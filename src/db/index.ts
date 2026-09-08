import { openDatabaseSync } from 'expo-sqlite';

import { createExpoSqliteConnection } from './expo-adapter';
import { migrate } from './migrate';
import { Repository } from './repository';

const DATABASE_NAME = 'birthday-reminder.db';

let repo: Repository | null = null;

export function getRepository(): Repository {
  if (!repo) {
    const db = openDatabaseSync(DATABASE_NAME);
    const conn = createExpoSqliteConnection(db);
    migrate(conn);
    repo = new Repository(conn);
  }
  return repo;
}
