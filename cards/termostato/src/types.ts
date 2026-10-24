export interface HassEntity {
  entity_id: string;
  state: string;
  last_changed?: string;
  attributes: Record<string, unknown>;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<unknown>;
  callWS<T = unknown>(msg: Record<string, unknown>): Promise<T>;
  [key: string]: unknown;
}

export type TermoMode = "programma" | "fuori_programma" | "manuale" | "timer" | "spento";

export interface TermoSettings {
  antigelo: number;
  min_target: number;
  max_target: number;
  default_target: number;
  timer_max_hours: number;
  frost_keep_heat: boolean;
  away_setback: boolean;
  away_minutes: number;
  notify_enabled: boolean;
  notify_service: string;
  notify_targets: string[];
}

/** Una fascia: giorni (0 = lunedì), "HH:MM" di inizio e fine e temperatura; se la fine non segue l'inizio finisce il giorno dopo. */
export interface SlotData {
  days: number[];
  start: string;
  end: string;
  temp: number;
}

export interface ScheduleData {
  enabled: boolean;
  slots: SlotData[];
}

export interface TermoInfo {
  entry_id: string;
  title: string;
  mode: TermoMode;
  available: boolean;
  hvac_mode: string | null;
  hvac_action: string | null;
  target: number | null;
  current: number | null;
  expected: number | null;
  sources: { climate: string; temperature_sensor: string | null; away_entity: string | null; guests_entity: string | null };
  settings: TermoSettings;
  schedule: ScheduleData;
  timer_until: string | null;
  timer_temp: number | null;
  next_event: { kind: "set" | "idle"; time: string; temp: number | null } | null;
  away_applied: boolean;
  last_action: { azione: string; motivo: string; quando: string; temperatura: number | null } | null;
  entities: Record<string, string>;
}
