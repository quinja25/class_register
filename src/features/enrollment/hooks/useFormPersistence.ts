import type { Step1Values } from '../schemas/step1Schema';
import type { Step2Values } from '../schemas/step2Schema';
import type { Course } from '../types/enrollment';

const STORAGE_KEY = 'enrollment_form_draft';
const DRAFT_VERSION = 1; // bump when DraftState shape changes to invalidate old drafts

export type DraftState = {
  version: number;
  step1: Step1Values | null;
  step2: Step2Values | null;
  selectedCourse: Course | null;
  savedAt: string; // ISO timestamp
};

function isValidDraft(value: unknown): value is DraftState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return v['version'] === DRAFT_VERSION && 'savedAt' in v;
}

export function loadDraft(): DraftState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidDraft(parsed)) {
      localStorage.removeItem(STORAGE_KEY); // stale version — wipe it
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(draft: Omit<DraftState, 'savedAt' | 'version'>): void {
  try {
    const payload: DraftState = { version: DRAFT_VERSION, ...draft, savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable (private browsing, quota exceeded) — fail silently
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
