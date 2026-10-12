/**
 * App domain model. These types are deliberately independent of the VEX Events API wire format:
 * LiveDataSource maps API responses into them and DemoDataSource generates them directly.
 */

export type ProgramCode = 'V5RC' | 'VURC';
export type Grade = 'Middle School' | 'High School' | 'College';
export type AllianceColor = 'red' | 'blue';
export type MatchRound = 'practice' | 'qualification' | 'r16' | 'quarterfinal' | 'semifinal' | 'final' | 'other';
/** Values of the API's EventLevel enum (swagger v1.0.21). */
export const EVENT_LEVELS = ['World', 'National', 'Regional', 'State', 'Signature', 'Spotlight', 'USO', 'Other'] as const;
export type EventLevel = (typeof EVENT_LEVELS)[number];

export interface Location {
  venue?: string;
  city: string;
  region: string;
  country: string;
}

export interface Season {
  id: number;
  name: string;
  program: ProgramCode;
  /** ISO date */
  start: string;
  /** ISO date */
  end: string;
}

/** Lightweight reference to a team, as embedded in matches, rankings and awards. */
export interface TeamRef {
  id: number;
  number: string;
}

export interface Team extends TeamRef {
  name: string;
  robotName?: string;
  organization: string;
  location: Location;
  grade: Grade;
  program: ProgramCode;
  registered: boolean;
}

export interface Division {
  id: number;
  name: string;
}

export interface VexEvent {
  id: number;
  sku: string;
  name: string;
  /** ISO datetime */
  start: string;
  /** ISO datetime */
  end: string;
  seasonId: number;
  program: ProgramCode;
  level: EventLevel;
  location: Location;
  divisions: Division[];
}

export interface MatchAlliance {
  color: AllianceColor;
  /** null until the match is scored */
  score: number | null;
  teams: Array<TeamRef & { sitting: boolean }>;
}

export interface Match {
  id: number;
  eventId: number;
  divisionId: number;
  round: MatchRound;
  instance: number;
  matchnum: number;
  /** Display name, e.g. "Q12" or "SF 2-1" */
  name: string;
  /** ISO datetime with offset, or null when the event has no schedule times */
  scheduled: string | null;
  started: string | null;
  field: string | null;
  scored: boolean;
  red: MatchAlliance;
  blue: MatchAlliance;
}

export interface Ranking {
  eventId: number;
  divisionId: number;
  rank: number;
  team: TeamRef;
  wins: number;
  losses: number;
  ties: number;
  wp: number;
  ap: number;
  sp: number;
  highScore: number;
  averagePoints: number;
  totalPoints: number;
}

export type SkillsType = 'driver' | 'programming';

export interface SkillsEntry {
  eventId: number;
  team: TeamRef;
  type: SkillsType;
  score: number;
  attempts: number;
  rank: number;
}

export interface Award {
  id: number;
  eventId: number;
  title: string;
  qualifications: string[];
  teams: Array<TeamRef & { divisionId?: number }>;
  individuals: string[];
}

export interface WorldSkillsEntry {
  rank: number;
  team: TeamRef & { name: string };
  location: Location;
  grade: Grade;
  combined: number;
  driver: number;
  programming: number;
}

export interface EventFilter {
  program: ProgramCode;
  seasonId: number;
  grade?: Grade;
  level?: EventLevel;
  region?: string;
  country?: string;
  /** Free-text match on name / SKU / city */
  query?: string;
}
