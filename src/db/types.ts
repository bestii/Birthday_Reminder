export interface Person {
  id: number;
  name: string;
  photo_path: string | null;
  created_at: number;
  updated_at: number;
}

export interface Event {
  id: number;
  person_id: number;
  event_type_id: number;
  date: string;
  notes: string | null;
  show_year: number;
  created_at: number;
  updated_at: number;
}

export interface EventType {
  id: number;
  name: string;
  is_builtin: number;
}

export interface Group {
  id: number;
  name: string;
}

export interface NotificationRule {
  id: number;
  days_before: number;
  time: string;
  created_at: number;
  updated_at: number;
}

export interface ListEventRow {
  id: number;
  person_id: number;
  event_type_id: number;
  date: string;
  notes: string | null;
  show_year: number;
  created_at: number;
  updated_at: number;
  person_name: string;
  person_photo_path: string | null;
  group_ids: string | null;
}
