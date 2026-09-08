import type { SqliteConnection } from './connection';
import type {
  Event,
  EventType,
  Group,
  ListEventRow,
  NotificationRule,
  Person,
} from './types';

const BUILTIN_BIRTHDAY = 'Birthday';

function now(): number {
  return Date.now();
}

export interface CreatePersonInput {
  name: string;
  photoPath?: string | null;
  birthDate?: string | null;
}

export interface CreateEventInput {
  personId: number;
  eventTypeId: number;
  date: string;
  notes?: string | null;
  showYear?: boolean;
}

export interface CreateEventTypeInput {
  name: string;
}

export interface CreateGroupInput {
  name: string;
}

export interface CreateNotificationRuleInput {
  daysBefore: number;
  time: string;
  groupIds?: number[];
}

export interface PersonWithGroups extends Person {
  groupIds: number[];
}

export interface PersonWithEvents extends Person {
  events: Event[];
  groupIds: number[];
}

export interface UpcomingEvent {
  event: Event;
  person: { id: number; name: string; photo_path: string | null };
  groupIds: number[];
}

export class Repository {
  constructor(private readonly db: SqliteConnection) {}

  private getEventTypeIdByName(name: string): number | null {
    return this.db.get<{ id: number }>('SELECT id FROM event_type WHERE name = ?', [name])?.id ?? null;
  }

  createEventType(input: CreateEventTypeInput): EventType {
    const result = this.db.run('INSERT INTO event_type (name, is_builtin) VALUES (?, 0)', [
      input.name,
    ]);
    return this.getEventType(result.lastInsertRowId);
  }

  getEventType(id: number): EventType {
    const row = this.db.get<EventType>('SELECT * FROM event_type WHERE id = ?', [id]);
    if (!row) {
      throw new Error(`EventType ${id} not found`);
    }
    return row;
  }

  listEventTypes(): EventType[] {
    return this.db.all<EventType>('SELECT * FROM event_type ORDER BY is_builtin DESC, name ASC');
  }

  renameEventType(id: number, name: string): EventType {
    const existing = this.getEventType(id);
    if (existing.is_builtin) {
      throw new Error('Built-in event types cannot be renamed');
    }
    this.db.run('UPDATE event_type SET name = ? WHERE id = ?', [name, id]);
    return this.getEventType(id);
  }

  deleteEventType(id: number): void {
    const existing = this.getEventType(id);
    if (existing.is_builtin) {
      throw new Error('Built-in event types cannot be deleted');
    }
    const used = this.db.get<{ c: number }>(
      'SELECT COUNT(*) AS c FROM event WHERE event_type_id = ?',
      [id],
    );
    if ((used?.c ?? 0) > 0) {
      throw new Error('Cannot delete an event type still in use');
    }
    this.db.run('DELETE FROM event_type WHERE id = ?', [id]);
  }

  createGroup(input: CreateGroupInput): Group {
    const result = this.db.run('INSERT INTO "group" (name) VALUES (?)', [input.name]);
    return this.getGroup(result.lastInsertRowId);
  }

  getGroup(id: number): Group {
    const row = this.db.get<Group>('SELECT * FROM "group" WHERE id = ?', [id]);
    if (!row) {
      throw new Error(`Group ${id} not found`);
    }
    return row;
  }

  listGroups(): Group[] {
    return this.db.all<Group>('SELECT * FROM "group" ORDER BY name ASC');
  }

  deleteGroup(id: number): void {
    this.db.run('DELETE FROM "group" WHERE id = ?', [id]);
  }

  private createEvent(input: CreateEventInput): Event {
    const ts = now();
    const result = this.db.run(
      `INSERT INTO event (person_id, event_type_id, date, notes, show_year, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.personId,
        input.eventTypeId,
        input.date,
        input.notes ?? null,
        input.showYear === false ? 0 : 1,
        ts,
        ts,
      ],
    );
    return this.getEvent(result.lastInsertRowId);
  }

  createPerson(input: CreatePersonInput): Person {
    const ts = now();
    const result = this.db.run(
      'INSERT INTO person (name, photo_path, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [input.name, input.photoPath ?? null, ts, ts],
    );
    const personId = result.lastInsertRowId;

    const birthdayTypeId = this.getEventTypeIdByName(BUILTIN_BIRTHDAY);
    if (birthdayTypeId == null) {
      throw new Error('Birthday event type not seeded');
    }

    const eventDate = input.birthDate ?? new Date().toISOString().slice(0, 10);
    this.createEvent({ personId, eventTypeId: birthdayTypeId, date: eventDate });

    return this.getPerson(personId);
  }

  getPerson(id: number): Person {
    const row = this.db.get<Person>('SELECT * FROM person WHERE id = ?', [id]);
    if (!row) {
      throw new Error(`Person ${id} not found`);
    }
    return row;
  }

  getPersonWithGroups(id: number): PersonWithGroups {
    const person = this.getPerson(id);
    const groupIds = this.db
      .all<{ group_id: number }>('SELECT group_id FROM person_group WHERE person_id = ?', [id])
      .map((r) => r.group_id);
    return { ...person, groupIds };
  }

  getPersonWithEvents(id: number): PersonWithEvents {
    const person = this.getPerson(id);
    const events = this.db.all<Event>(
      'SELECT * FROM event WHERE person_id = ? ORDER BY date ASC',
      [id],
    );
    const groupIds = this.db
      .all<{ group_id: number }>('SELECT group_id FROM person_group WHERE person_id = ?', [id])
      .map((r) => r.group_id);
    return { ...person, events, groupIds };
  }

  listPeople(): Person[] {
    return this.db.all<Person>('SELECT * FROM person ORDER BY name ASC');
  }

  updatePerson(id: number, input: Partial<CreatePersonInput>): Person {
    this.getPerson(id);

    const sets: string[] = [];
    const params: (string | number | null)[] = [];
    if (input.name !== undefined) {
      sets.push('name = ?');
      params.push(input.name);
    }
    if (input.photoPath !== undefined) {
      sets.push('photo_path = ?');
      params.push(input.photoPath);
    }
    sets.push('updated_at = ?');
    params.push(now());

    if (sets.length > 1) {
      this.db.run(`UPDATE person SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    }
    return this.getPerson(id);
  }

  deletePerson(id: number): void {
    this.db.run('DELETE FROM person WHERE id = ?', [id]);
  }

  getEvent(id: number): Event {
    const row = this.db.get<Event>('SELECT * FROM event WHERE id = ?', [id]);
    if (!row) {
      throw new Error(`Event ${id} not found`);
    }
    return row;
  }

  listEventsByPerson(personId: number): Event[] {
    return this.db.all<Event>('SELECT * FROM event WHERE person_id = ? ORDER BY date ASC', [
      personId,
    ]);
  }

  listUpcomingEvents(): UpcomingEvent[] {
    const rows = this.db.all<ListEventRow>(
      `SELECT
         e.id, e.person_id, e.event_type_id, e.date, e.notes, e.show_year,
         e.created_at, e.updated_at,
         p.name AS person_name, p.photo_path AS person_photo_path,
         (SELECT GROUP_CONCAT(pg.group_id)
            FROM person_group pg
            WHERE pg.person_id = e.person_id) AS group_ids
       FROM event e
       JOIN person p ON p.id = e.person_id
       ORDER BY e.date ASC`,
    );
    return rows.map((row) => ({
      event: {
        id: row.id,
        person_id: row.person_id,
        event_type_id: row.event_type_id,
        date: row.date,
        notes: row.notes,
        show_year: row.show_year,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      person: {
        id: row.person_id,
        name: row.person_name,
        photo_path: row.person_photo_path,
      },
      groupIds: row.group_ids ? row.group_ids.split(',').map(Number) : [],
    }));
  }

  createEventForPerson(input: CreateEventInput): Event {
    this.getPerson(input.personId);
    this.getEventType(input.eventTypeId);
    return this.createEvent(input);
  }

  updateEvent(id: number, input: Partial<Omit<CreateEventInput, 'personId'>>): Event {
    this.getEvent(id);

    const sets: string[] = [];
    const params: (string | number | null)[] = [];
    if (input.eventTypeId !== undefined) {
      sets.push('event_type_id = ?');
      params.push(input.eventTypeId);
    }
    if (input.date !== undefined) {
      sets.push('date = ?');
      params.push(input.date);
    }
    if (input.notes !== undefined) {
      sets.push('notes = ?');
      params.push(input.notes);
    }
    if (input.showYear !== undefined) {
      sets.push('show_year = ?');
      params.push(input.showYear ? 1 : 0);
    }
    sets.push('updated_at = ?');
    params.push(now());

    if (sets.length > 1) {
      this.db.run(`UPDATE event SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    }
    return this.getEvent(id);
  }

  deleteEvent(id: number): void {
    const event = this.getEvent(id);
    const count = this.db.get<{ c: number }>(
      'SELECT COUNT(*) AS c FROM event WHERE person_id = ?',
      [event.person_id],
    );
    if ((count?.c ?? 0) <= 1) {
      throw new Error('Cannot delete a person\u2019s only event');
    }
    this.db.run('DELETE FROM event WHERE id = ?', [id]);
  }

  assignGroupsToPerson(personId: number, groupIds: number[]): void {
    this.getPerson(personId);
    this.db.run('DELETE FROM person_group WHERE person_id = ?', [personId]);
    for (const groupId of groupIds) {
      this.getGroup(groupId);
      this.db.run('INSERT INTO person_group (person_id, group_id) VALUES (?, ?)', [
        personId,
        groupId,
      ]);
    }
  }

  createNotificationRule(input: CreateNotificationRuleInput): NotificationRule {
    const ts = now();
    const result = this.db.run(
      'INSERT INTO notification_rule (days_before, time, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [input.daysBefore, input.time, ts, ts],
    );
    const ruleId = result.lastInsertRowId;
    for (const groupId of input.groupIds ?? []) {
      this.getGroup(groupId);
      this.db.run('INSERT INTO notification_rule_group (rule_id, group_id) VALUES (?, ?)', [
        ruleId,
        groupId,
      ]);
    }
    return this.getNotificationRule(ruleId);
  }

  getNotificationRule(id: number): NotificationRule {
    const row = this.db.get<NotificationRule>('SELECT * FROM notification_rule WHERE id = ?', [id]);
    if (!row) {
      throw new Error(`NotificationRule ${id} not found`);
    }
    return row;
  }

  listNotificationRules(): NotificationRule[] {
    return this.db.all<NotificationRule>('SELECT * FROM notification_rule ORDER BY id ASC');
  }

  getNotificationRuleGroupIds(ruleId: number): number[] {
    return this.db
      .all<{ group_id: number }>(
        'SELECT group_id FROM notification_rule_group WHERE rule_id = ?',
        [ruleId],
      )
      .map((r) => r.group_id);
  }

  updateNotificationRule(
    id: number,
    input: Partial<CreateNotificationRuleInput>,
  ): NotificationRule {
    this.getNotificationRule(id);
    this.db.run(
      'UPDATE notification_rule SET days_before = COALESCE(?, days_before), time = COALESCE(?, time), updated_at = ? WHERE id = ?',
      [input.daysBefore ?? null, input.time ?? null, now(), id],
    );
    if (input.groupIds !== undefined) {
      this.db.run('DELETE FROM notification_rule_group WHERE rule_id = ?', [id]);
      for (const groupId of input.groupIds) {
        this.getGroup(groupId);
        this.db.run('INSERT INTO notification_rule_group (rule_id, group_id) VALUES (?, ?)', [
          id,
          groupId,
        ]);
      }
    }
    return this.getNotificationRule(id);
  }

  deleteNotificationRule(id: number): void {
    this.db.run('DELETE FROM notification_rule WHERE id = ?', [id]);
  }
}
