export const MIGRATIONS: readonly string[] = [
  // v1 — initial schema
  `
  CREATE TABLE IF NOT EXISTS event_type (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_builtin INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS person (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    photo_path TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS event (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    event_type_id INTEGER NOT NULL REFERENCES event_type(id),
    date TEXT NOT NULL,
    notes TEXT,
    show_year INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "group" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS person_group (
    person_id INTEGER NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES "group"(id) ON DELETE CASCADE,
    PRIMARY KEY (person_id, group_id)
  );

  CREATE TABLE IF NOT EXISTS notification_rule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    days_before INTEGER NOT NULL DEFAULT 0,
    time TEXT NOT NULL DEFAULT '09:00',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notification_rule_group (
    rule_id INTEGER NOT NULL REFERENCES notification_rule(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES "group"(id) ON DELETE CASCADE,
    PRIMARY KEY (rule_id, group_id)
  );

  INSERT INTO event_type (name, is_builtin) VALUES
    ('Birthday', 1),
    ('Anniversary', 1),
    ('Memorial', 1);
  `,
];
