import type { DatabaseSync, StatementSync } from 'node:sqlite';

import type { BindParams, RunResult, SqliteConnection } from './connection';

function normalize<T>(row: Record<string, unknown> | null | undefined): T | null {
  if (row == null) {
    return null;
  }
  return { ...row } as T;
}

export function createNodeSqliteConnection(db: DatabaseSync): SqliteConnection {
  return {
    exec(source: string): void {
      db.exec(source);
    },
    run(source: string, params: BindParams = []): RunResult {
      const stmt: StatementSync = db.prepare(source);
      try {
        const result = stmt.run(...params);
        return {
          lastInsertRowId: Number(result.lastInsertRowid),
          changes: Number(result.changes),
        };
      } finally {
        // node:sqlite has no finalize; statement is GC'd. Nothing to do.
      }
    },
    get<T>(source: string, params: BindParams = []): T | null {
      const stmt: StatementSync = db.prepare(source);
      const row = stmt.get(...params) as Record<string, unknown> | undefined;
      return normalize<T>(row);
    },
    all<T>(source: string, params: BindParams = []): T[] {
      const stmt: StatementSync = db.prepare(source);
      const rows = stmt.all(...params) as Array<Record<string, unknown>>;
      return rows.map((row) => ({ ...row }) as T);
    },
    close(): void {
      db.close();
    },
  };
}
