import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { emptyField, type AwpChecks, type FieldState } from './engine';
import { OVERRIDE_FIELD } from './rules/manual';
import type { AllianceColor } from './rules/types';

/** Calculator inputs, kept separately per mode and persisted so a reload mid-match loses nothing. */

export interface MatchCalcState {
  autonomous: FieldState;
  final: FieldState;
  violations: Record<AllianceColor, boolean>;
  awpChecks: Record<AllianceColor, AwpChecks>;
  awpCriteriaId: string;
}

export interface SkillsCalcState {
  variant: 'skills-v5rc' | 'skills-vexu';
  runType: 'driver' | 'programming';
  field: FieldState;
}

export const emptyMatchCalc = (): MatchCalcState => ({
  autonomous: emptyField(OVERRIDE_FIELD),
  final: emptyField(OVERRIDE_FIELD),
  violations: { red: false, blue: false },
  awpChecks: { red: { noPerimeterContact: true, noViolations: true }, blue: { noPerimeterContact: true, noViolations: true } },
  awpCriteriaId: '',
});

export const emptySkillsCalc = (variant: SkillsCalcState['variant'] = 'skills-v5rc'): SkillsCalcState => ({
  variant,
  runType: 'driver',
  field: emptyField(OVERRIDE_FIELD),
});

interface ScoringStore {
  v5rc: MatchCalcState;
  vexu: MatchCalcState;
  skills: SkillsCalcState;
  setMatch: (mode: 'v5rc' | 'vexu', next: MatchCalcState) => void;
  setSkills: (next: SkillsCalcState) => void;
  reset: (mode: 'v5rc' | 'vexu' | 'skills') => void;
}

export const useScoringStore = create<ScoringStore>()(
  persist(
    (set) => ({
      v5rc: emptyMatchCalc(),
      vexu: emptyMatchCalc(),
      skills: emptySkillsCalc(),
      setMatch: (mode, next) => set({ [mode]: next } as Pick<ScoringStore, 'v5rc'>),
      setSkills: (next) => set({ skills: next }),
      reset: (mode) =>
        set((s) => (mode === 'skills' ? { skills: emptySkillsCalc(s.skills.variant) } : ({ [mode]: emptyMatchCalc() } as Pick<ScoringStore, 'v5rc'>))),
    }),
    { name: 'vex-scout-scoring', version: 1 },
  ),
);
