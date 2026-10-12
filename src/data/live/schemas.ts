/**
 * Runtime validation of API responses (zod), matching the official OpenAPI spec (swagger v1.0.21).
 * Schemas are lenient (nullish everywhere a field might be missing) so that a
 * small upstream change degrades gracefully instead of breaking every screen.
 */
import { z } from 'zod';

export const IdNameSchema = z.object({
  id: z.number(),
  name: z.string().nullish(),
  code: z.string().nullish(),
});

export const LocationSchema = z
  .object({
    venue: z.string().nullish(),
    city: z.string().nullish(),
    region: z.string().nullish(),
    country: z.string().nullish(),
  })
  .nullish();

export const ProgramSchema = z.object({
  id: z.number(),
  abbr: z.string().nullish(),
  name: z.string().nullish(),
});

export const SeasonSchema = z.object({
  id: z.number(),
  name: z.string(),
  program: IdNameSchema,
  start: z.string(),
  end: z.string(),
});

export const TeamSchema = z.object({
  id: z.number(),
  number: z.string(),
  team_name: z.string().nullish(),
  robot_name: z.string().nullish(),
  organization: z.string().nullish(),
  location: LocationSchema,
  registered: z.boolean().nullish(),
  program: IdNameSchema,
  grade: z.string().nullish(),
});

export const EventSchema = z.object({
  id: z.number(),
  sku: z.string(),
  name: z.string(),
  start: z.string(),
  end: z.string(),
  season: IdNameSchema,
  program: IdNameSchema,
  location: LocationSchema,
  divisions: z.array(z.object({ id: z.number(), name: z.string(), order: z.number().nullish() })).nullish(),
  level: z.string().nullish(),
});

/** In embedded team refs, RobotEvents puts the team *number* in `name`. */
export const MatchSchema = z.object({
  id: z.number(),
  event: IdNameSchema,
  division: IdNameSchema,
  round: z.number(),
  instance: z.number(),
  matchnum: z.number(),
  scheduled: z.string().nullish(),
  started: z.string().nullish(),
  field: z.string().nullish(),
  scored: z.boolean(),
  name: z.string(),
  alliances: z.array(
    z.object({
      color: z.enum(['red', 'blue']),
      score: z.number().nullish(),
      teams: z.array(z.object({ team: IdNameSchema, sitting: z.boolean().nullish() })),
    }),
  ),
});

export const RankingSchema = z.object({
  event: IdNameSchema,
  division: IdNameSchema,
  rank: z.number(),
  team: IdNameSchema,
  wins: z.number(),
  losses: z.number(),
  ties: z.number(),
  wp: z.number(),
  ap: z.number(),
  sp: z.number(),
  high_score: z.number().nullish(),
  average_points: z.number().nullish(),
  total_points: z.number().nullish(),
});

export const SkillsSchema = z.object({
  event: IdNameSchema,
  team: IdNameSchema,
  type: z.string(),
  score: z.number(),
  attempts: z.number().nullish(),
  rank: z.number().nullish(),
});

export const AwardSchema = z.object({
  id: z.number(),
  event: IdNameSchema,
  title: z.string(),
  qualifications: z.array(z.string()).nullish(),
  teamWinners: z.array(z.object({ division: IdNameSchema.nullish(), team: IdNameSchema })).nullish(),
  individualWinners: z.array(z.string()).nullish(),
});

/** ⚠ ASSUMED shape of the World Skills standings feed (not part of the API spec). */
export const WorldSkillsRowSchema = z.object({
  rank: z.number(),
  team: z.object({
    id: z.number(),
    team: z.string(),
    teamName: z.string().nullish(),
    city: z.string().nullish(),
    region: z.string().nullish(),
    country: z.string().nullish(),
    gradeLevel: z.string().nullish(),
  }),
  scores: z.object({ score: z.number(), driver: z.number(), programming: z.number() }),
});

export function pageSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    meta: z.object({ current_page: z.number(), last_page: z.number() }).passthrough(),
    data: z.array(item),
  });
}
