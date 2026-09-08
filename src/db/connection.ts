export type BindValue = string | number | null;
export type BindParams = BindValue[];

export interface RunResult {
  lastInsertRowId: number;
  changes: number;
}

export interface SqliteConnection {
  exec(source: string): void;
  run(source: string, params?: BindParams): RunResult;
  get<T>(source: string, params?: BindParams): T | null;
  all<T>(source: string, params?: BindParams): T[];
  close(): void;
}
