import type { SqliteConnection } from './connection';
import { MIGRATIONS } from './schema';

export function migrate(db: SqliteConnection): void {
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  const current = db.get<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;

  for (let v = current; v < MIGRATIONS.length; v++) {
    db.exec('BEGIN;');
    try {
      db.exec(MIGRATIONS[v]);
      db.exec(`PRAGMA user_version = ${v + 1};`);
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }
}
