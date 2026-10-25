-- Local proof only; not the portfolio production schema.
CREATE TABLE foundation_probe (id INTEGER PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO foundation_probe (id, value) VALUES (1, 'local-only');
