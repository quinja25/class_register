import type { Step1Values } from '../schemas/step1Schema';
import type { Step2Values } from '../schemas/step2Schema';
import type { Course } from '../types/enrollment';

const STORAGE_KEY = 'enrollment_form_draft';

export type DraftState = {
  step1: Step1Values | null;
  step2: Step2Values | null;
  selectedCourse: Course | null;
  savedAt: string; // ISO timestamp
};

export function loadDraft(): DraftState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftState;
  } catch {
    return null;
  }
}

export function saveDraft(draft: Omit<DraftState, 'savedAt'>): void {
  try {
    const payload: DraftState = { ...draft, savedAt: new Date().toISOString() };
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
