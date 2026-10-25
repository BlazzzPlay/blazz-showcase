-- New empty D1 only. Dates retain Drizzle timestamp-mode epoch seconds.
CREATE TABLE contact_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 100),
  email TEXT NOT NULL CHECK(length(email) BETWEEN 3 AND 254),
  subject TEXT NOT NULL CHECK(length(subject) BETWEEN 3 AND 200),
  message TEXT NOT NULL CHECK(length(message) BETWEEN 10 AND 4000),
  is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0, 1)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE contact_funnel_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL CHECK(length(session_id) BETWEEN 8 AND 64),
  event TEXT NOT NULL CHECK(event IN ('cta_click', 'form_start', 'form_submit_success')),
  source TEXT NOT NULL DEFAULT 'contact_form' CHECK(source IN ('hero', 'nav', 'contact_form')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
