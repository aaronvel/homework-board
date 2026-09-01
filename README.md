# Family homework board

Static parent board. Live site: https://aaronvel.github.io/homework-board/

## How updates work

Homeroom refreshes `data.json` on weekday school watches, then pushes so this Pages site updates.

- Merge extras. Keep this schema. Do not wipe `assignments` or `activities`.
- Homework lives in `assignments`. Class and activity news lives in `activities` (Activities tab).
- Skip daily-bulletin posts. Do not invent sports times.
- Submitted work should display as done (`status: submitted` or `completed`).
- Capture the Schoology item URL on `url` when the assignment name is a link.

## Schema

See `data.json`.

Assignment `status`: `completed` | `submitted` | `missing` | `upcoming`.

Activity fields: `title` (required); `deadline` (ISO) for orders/forms **or** `when` (+ optional `end`) for events; `note`; `where`; `kid` (one student id, `both`, or omit if school-wide); `source`; `url`.

## Pages

GitHub Pages from `main` at `/` (root).
