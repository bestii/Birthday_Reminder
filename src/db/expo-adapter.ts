import type { SQLiteDatabase } from 'expo-sqlite';

import type { BindParams, RunResult, SqliteConnection } from './connection';

export function createExpoSqliteConnection(db: SQLiteDatabase): SqliteConnection {
  return {
    exec(source: string): void {
      db.execSync(source);
    },
    run(source: string, params: BindParams = []): RunResult {
      const result = db.runSync(source, params);
      return { lastInsertRowId: result.lastInsertRowId, changes: result.changes };
    },
    get<T>(source: string, params: BindParams = []): T | null {
      return db.getFirstSync<T>(source, params) ?? null;
    },
    all<T>(source: string, params: BindParams = []): T[] {
      return db.getAllSync<T>(source, params);
    },
    close(): void {
      db.closeSync();
    },
  };
}
