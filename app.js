const state = { data: null, tab: "homework", kid: "all" };

const $ = (id) => document.getElementById(id);

function fmtWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    timeZone: "America/Detroit",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: iso.includes("T") ? "numeric" : undefined,
    minute: iso.includes("T") ? "2-digit" : undefined,
  });
}

function isDailyBulletin(activity) {
  const src = `${activity.source || ""} ${activity.title || ""}`.toLowerCase();
  return src.includes("daily bulletin") || src.includes("daily-bulletin");
}

function isDone(status) {
  return status === "completed" || status === "submitted";
}

function kidName(id) {
  const kid = (state.data.kids || []).find((k) => k.id === id);
  return kid ? kid.name : id || "School-wide";
}

function matchKid(itemKid) {
  if (state.kid === "all") return true;
  if (!itemKid || itemKid === "both") return true;
  return itemKid === state.kid;
}

function titleHtml(title, url) {
  const safe = escapeHtml(title || "Untitled");
  if (!url) return safe;
  return `<a href="${escapeAttr(url)}" target="_blank" rel="noopener">${safe}</a>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

function renderPickup() {
  const kids = state.data.kids || [];
  const groups = new Map();
  for (const kid of kids) {
    const key = `${kid.school}|${kid.pickup}`;
    if (!groups.has(key)) groups.set(key, { school: kid.school, pickup: kid.pickup, half: kid.pickupHalfDay, names: [] });
    groups.get(key).names.push(kid.name);
  }
  $("pickup").innerHTML = [...groups.values()]
    .map((g) => {
      const half = g.half ? ` · half day ${escapeHtml(g.half)}` : "";
      return `<article class="pickup-card"><div class="who">${escapeHtml(g.names.join(" & "))}</div><div class="when">Pickup ${escapeHtml(g.pickup)}${half}</div><div class="school">${escapeHtml(g.school)}</div></article>`;
    })
    .join("");
}

function renderFilters() {
  const kids = state.data.kids || [];
  const buttons = [{ id: "all", name: "All" }, ...kids];
  $("kid-filters").innerHTML = buttons
    .map((k) => `<button type="button" data-kid="${escapeAttr(k.id)}" aria-pressed="${state.kid === k.id}">${escapeHtml(k.name)}</button>`)
    .join("");
}

function assignmentCard(a) {
  const status = a.status || "upcoming";
  const chip = `<span class="chip ${escapeAttr(status)}">${escapeHtml(status)}</span>`;
  const due = a.due ? `Due ${fmtWhen(a.due)}` : "";
  const course = a.course || "";
  const score = a.score != null && a.score !== "" ? ` · ${escapeHtml(a.score)}` : "";
  const note = a.note ? `<p class="note">${escapeHtml(a.note)}</p>` : "";
  return `<article class="card ${isDone(status) ? "done" : ""}"><h3>${titleHtml(a.title, a.url)}${chip}</h3><p class="meta">${escapeHtml(kidName(a.kid))}${course ? " · " + escapeHtml(course) : ""}${due ? " · " + due : ""}${score}</p>${note}</article>`;
}

function activityCard(a) {
  const when = a.when ? fmtWhen(a.when) : a.deadline ? `Deadline ${fmtWhen(a.deadline)}` : "";
  const end = a.end ? `– ${fmtWhen(a.end)}` : "";
  const where = a.where ? escapeHtml(a.where) : "";
  const kid = a.kid ? kidName(a.kid) : "School-wide";
  const note = a.note ? `<p class="note">${escapeHtml(a.note)}</p>` : "";
  return `<article class="card"><h3>${titleHtml(a.title, a.url)}</h3><p class="meta">${escapeHtml(kid)}${when ? " · " + when + end : ""}${where ? " · " + where : ""}</p>${note}</article>`;
}

function renderHomework() {
  const items = (state.data.assignments || []).filter((a) => matchKid(a.kid));
  const missing = items.filter((a) => a.status === "missing");
  const upcoming = items.filter((a) => a.status === "upcoming" || !a.status);
  const done = items.filter((a) => isDone(a.status));

  const block = (title, list, empty) => {
    if (!list.length && empty) return "";
    if (!list.length) return "";
    return `<section class="group"><h2>${title}</h2>${list.map(assignmentCard).join("")}</section>`;
  };

  if (!items.length) {
    $("panel-homework").innerHTML = `<p class="empty">No homework in the board yet.</p>`;
    return;
  }

  $("panel-homework").innerHTML =
    block("Missing", missing) +
    block("Upcoming", upcoming) +
    block("Done", done) +
    (!missing.length && !upcoming.length && !done.length ? `<p class="empty">Nothing for this filter.</p>` : "");
}

function renderActivities() {
  const items = (state.data.activities || []).filter((a) => !isDailyBulletin(a) && matchKid(a.kid));
  if (!items.length) {
    $("panel-activities").innerHTML = `<p class="empty">No activities in the board yet.</p>`;
    return;
  }
  $("panel-activities").innerHTML = `<section class="group">${items.map(activityCard).join("")}</section>`;
}

function render() {
  const updated = state.data.updated ? fmtWhen(state.data.updated) : "";
  $("updated").textContent = updated ? `Updated ${updated}` : "";
  renderPickup();
  renderFilters();
  renderHomework();
  renderActivities();
}

function setTab(tab) {
  state.tab = tab;
  $("tab-homework").setAttribute("aria-selected", tab === "homework");
  $("tab-activities").setAttribute("aria-selected", tab === "activities");
  $("panel-homework").hidden = tab !== "homework";
  $("panel-activities").hidden = tab !== "activities";
}

document.querySelector(".tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-tab]");
  if (btn) setTab(btn.dataset.tab);
});

$("kid-filters").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-kid]");
  if (!btn) return;
  state.kid = btn.dataset.kid;
  render();
});

fetch("./data.json", { cache: "no-store" })
  .then((r) => {
    if (!r.ok) throw new Error("Could not load data.json");
    return r.json();
  })
  .then((data) => {
    state.data = data;
    render();
  })
  .catch((err) => {
    $("updated").textContent = "Could not load the board";
    $("panel-homework").innerHTML = `<p class="empty">${escapeHtml(err.message)}</p>`;
  });
