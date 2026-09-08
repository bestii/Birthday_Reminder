import { DatabaseSync } from 'node:sqlite';

import { createNodeSqliteConnection } from '../node-adapter';
import { migrate } from '../migrate';
import { Repository } from '../repository';

function makeRepo(): { db: DatabaseSync; repo: Repository } {
  const db = new DatabaseSync(':memory:');
  const conn = createNodeSqliteConnection(db);
  migrate(conn);
  const repo = new Repository(conn);
  return { db, repo };
}

describe('schema & migration', () => {
  it('sets user_version to the latest migration and is idempotent', () => {
    const db = new DatabaseSync(':memory:');
    const conn = createNodeSqliteConnection(db);
    migrate(conn);
    migrate(conn); // idempotent
    expect(conn.get<{ user_version: number }>('PRAGMA user_version')).toEqual({
      user_version: 1,
    });
  });

  it('does not have a birth_date column on person', () => {
    const { db } = makeRepo();
    const cols = db.prepare('PRAGMA table_info(person)').all() as Array<{ name: string }>;
    expect(cols.map((c) => c.name)).not.toContain('birth_date');
  });

  it('seeds the three built-in event types exactly once', () => {
    const { repo } = makeRepo();
    const types = repo.listEventTypes();
    const builtin = types.filter((t) => t.is_builtin === 1);
    expect(builtin.map((t) => t.name).sort()).toEqual([
      'Anniversary',
      'Birthday',
      'Memorial',
    ]);
  });
});

describe('event types', () => {
  it('creates a custom type', () => {
    const { repo } = makeRepo();
    const t = repo.createEventType({ name: 'Graduation' });
    expect(t.name).toBe('Graduation');
    expect(t.is_builtin).toBe(0);
  });

  it('rejects renaming/deleting built-in types', () => {
    const { repo } = makeRepo();
    const birthday = repo.listEventTypes().find((t) => t.name === 'Birthday')!;
    expect(() => repo.renameEventType(birthday.id, 'Bday')).toThrow(/renamed/);
    expect(() => repo.deleteEventType(birthday.id)).toThrow(/deleted/);
  });

  it('rejects deleting a custom type still in use', () => {
    const { repo } = makeRepo();
    const custom = repo.createEventType({ name: 'Graduation' });
    const person = repo.createPerson({ name: 'Ada', birthDate: '1990-01-15' });
    repo.createEventForPerson({
      personId: person.id,
      eventTypeId: custom.id,
      date: '2024-06-01',
    });
    expect(() => repo.deleteEventType(custom.id)).toThrow(/in use/);
  });
});

describe('persons & events', () => {
  it('creates a person with a default Birthday event', () => {
    const { repo } = makeRepo();
    const person = repo.createPerson({ name: 'Ada', birthDate: '1990-01-15' });
    expect(person.name).toBe('Ada');
    const events = repo.listEventsByPerson(person.id);
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('1990-01-15');
    const type = repo.getEventType(events[0].event_type_id);
    expect(type.name).toBe('Birthday');
  });

  it('prevents deleting a person\u2019s only event', () => {
    const { repo } = makeRepo();
    const person = repo.createPerson({ name: 'Ada' });
    const [event] = repo.listEventsByPerson(person.id);
    expect(() => repo.deleteEvent(event.id)).toThrow(/only event/);
  });

  it('can clear a nullable person field back to null', () => {
    const { repo } = makeRepo();
    const person = repo.createPerson({ name: 'Ada', photoPath: 'file:///photo.jpg' });
    expect(person.photo_path).toBe('file:///photo.jpg');
    const updated = repo.updatePerson(person.id, { photoPath: null });
    expect(updated.photo_path).toBeNull();
  });

  it('can clear nullable event fields back to null', () => {
    const { repo } = makeRepo();
    const person = repo.createPerson({ name: 'Ada' });
    const [event] = repo.listEventsByPerson(person.id);
    repo.updateEvent(event.id, { notes: 'note' });
    expect(repo.getEvent(event.id).notes).toBe('note');
    repo.updateEvent(event.id, { notes: null });
    expect(repo.getEvent(event.id).notes).toBeNull();
  });

  it('allows deleting an event when another remains', () => {
    const { repo } = makeRepo();
    const person = repo.createPerson({ name: 'Ada' });
    const anniversary = repo.listEventTypes().find((t) => t.name === 'Anniversary')!;
    repo.createEventForPerson({
      personId: person.id,
      eventTypeId: anniversary.id,
      date: '2024-05-20',
    });
    const events = repo.listEventsByPerson(person.id);
    expect(events).toHaveLength(2);
    repo.deleteEvent(events[0].id);
    expect(repo.listEventsByPerson(person.id)).toHaveLength(1);
  });

  it('cascades event and group-link deletion when a person is deleted', () => {
    const { db, repo } = makeRepo();
    const group = repo.createGroup({ name: 'Family' });
    const person = repo.createPerson({ name: 'Ada' });
    repo.assignGroupsToPerson(person.id, [group.id]);

    repo.deletePerson(person.id);

    const events = db.prepare('SELECT COUNT(*) AS c FROM event').get() as { c: number };
    const links = db.prepare('SELECT COUNT(*) AS c FROM person_group').get() as { c: number };
    expect(events.c).toBe(0);
    expect(links.c).toBe(0);
  });
});

describe('groups', () => {
  it('assigns and lists groups for a person', () => {
    const { repo } = makeRepo();
    const g1 = repo.createGroup({ name: 'Family' });
    const g2 = repo.createGroup({ name: 'Work' });
    const person = repo.createPerson({ name: 'Ada' });
    repo.assignGroupsToPerson(person.id, [g1.id, g2.id]);
    expect(repo.getPersonWithGroups(person.id).groupIds.sort()).toEqual([g1.id, g2.id]);
  });

  it('cascades group-link deletion when a group is deleted', () => {
    const { db, repo } = makeRepo();
    const group = repo.createGroup({ name: 'Family' });
    const person = repo.createPerson({ name: 'Ada' });
    repo.assignGroupsToPerson(person.id, [group.id]);
    repo.deleteGroup(group.id);
    const links = db.prepare('SELECT COUNT(*) AS c FROM person_group').get() as { c: number };
    expect(links.c).toBe(0);
  });
});

describe('notification rules', () => {
  it('creates a rule with group filter and empty filter semantics', () => {
    const { repo } = makeRepo();
    const empty = repo.createNotificationRule({ daysBefore: 0, time: '09:00' });
    expect(empty.days_before).toBe(0);
    expect(empty.time).toBe('09:00');
    expect(repo.getNotificationRuleGroupIds(empty.id)).toEqual([]);

    const g = repo.createGroup({ name: 'Family' });
    const filtered = repo.createNotificationRule({
      daysBefore: 3,
      time: '08:00',
      groupIds: [g.id],
    });
    expect(repo.getNotificationRuleGroupIds(filtered.id)).toEqual([g.id]);
  });

  it('updates rule group filter', () => {
    const { repo } = makeRepo();
    const g1 = repo.createGroup({ name: 'Family' });
    const g2 = repo.createGroup({ name: 'Work' });
    const rule = repo.createNotificationRule({ daysBefore: 1, time: '09:00', groupIds: [g1.id] });
    repo.updateNotificationRule(rule.id, { groupIds: [g2.id] });
    expect(repo.getNotificationRuleGroupIds(rule.id)).toEqual([g2.id]);
  });
});
