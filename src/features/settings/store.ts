import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '@/lib/id';

export type ThemePref = 'light' | 'dark' | 'system';
export const ACCENTS = ['blue', 'violet', 'emerald', 'amber', 'rose'] as const;
export type Accent = (typeof ACCENTS)[number];

/** The competition "mode" the app is in. Drives default filters and which program's data is shown. */
export type ProgramMode = 'V5RC_HS' | 'V5RC_MS' | 'VEXU';
export const PROGRAM_MODES: Record<ProgramMode, { label: string; short: string }> = {
  V5RC_HS: { label: 'V5RC High School', short: 'V5RC HS' },
  V5RC_MS: { label: 'V5RC Middle School', short: 'V5RC MS' },
  VEXU: { label: 'VEX U', short: 'VEX U' },
};

export interface Settings {
  theme: ThemePref;
  accent: Accent;
  minimalist: boolean;
  program: ProgramMode;
  /** null = the current season for the selected program */
  seasonId: number | null;
  /** Stable per-install id, stamped on every local record for future sync. */
  deviceId: string;
}

interface SettingsActions {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  /** Switching program also resets the season, since season ids are per program. */
  setProgram: (program: ProgramMode) => void;
}

export const useSettings = create<Settings & SettingsActions>()(
  persist(
    (set) => ({
      theme: 'system',
      accent: 'blue',
      minimalist: false,
      program: 'V5RC_HS',
      seasonId: null,
      deviceId: newId(),
      set: (key, value) => set({ [key]: value } as Partial<Settings>),
      setProgram: (program) => set({ program, seasonId: null }),
    }),
    { name: 'vex-scout-settings', version: 1 },
  ),
);

