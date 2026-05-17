'use client';

import { createContext, useReducer, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  enrollmentReducer,
  initialState,
  type EnrollmentFormState,
  type EnrollmentAction,
} from './enrollmentReducer';
import { loadDraft, saveDraft, clearDraft } from '../hooks/useFormPersistence';
import { useNavigationGuard } from '../hooks/useNavigationGuard';

export interface EnrollmentFormContextValue {
  state: EnrollmentFormState;
  dispatch: React.Dispatch<EnrollmentAction>;
  hasDraft: boolean;
  restoreDraft: () => void;
  dismissDraft: () => void;
}

export const EnrollmentFormContext = createContext<EnrollmentFormContextValue | null>(null);

export function EnrollmentFormProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(enrollmentReducer, initialState);
  const [hasDraft, setHasDraft] = useState(false);

  // Check for saved draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && (draft.step1 || draft.step2)) {
      setHasDraft(true);
    }
  }, []);

  // Auto-save whenever form data changes
  useEffect(() => {
    if (state.result) {
      // Submission succeeded — clear draft
      clearDraft();
      setHasDraft(false);
      return;
    }
    if (!state.step1 && !state.step2) return;
    saveDraft({ step1: state.step1, step2: state.step2, selectedCourse: state.selectedCourse });
  }, [state.step1, state.step2, state.selectedCourse, state.result]);

  const restoreDraft = useCallback(() => {
    const draft = loadDraft();
    if (!draft) return;
    if (draft.selectedCourse) {
      dispatch({ type: 'SET_SELECTED_COURSE', payload: draft.selectedCourse });
    }
    if (draft.step1) {
      dispatch({ type: 'SET_STEP1', payload: draft.step1 });
    }
    if (draft.step2) {
      dispatch({ type: 'SET_STEP2', payload: draft.step2 });
      // step2 present → user reached confirmation; go to step 3 so they can retry immediately
      dispatch({ type: 'GO_TO_STEP', payload: 3 });
    } else if (draft.step1) {
      dispatch({ type: 'GO_TO_STEP', payload: 1 });
    }
    setHasDraft(false);
  }, []);

  const dismissDraft = useCallback(() => {
    clearDraft();
    setHasDraft(false);
  }, []);

  // Guard navigation when form has data and submission is not complete
  const guardActive = !!(state.step1 || state.step2) && !state.result;
  useNavigationGuard(guardActive);

  return (
    <EnrollmentFormContext.Provider value={{ state, dispatch, hasDraft, restoreDraft, dismissDraft }}>
      {children}
    </EnrollmentFormContext.Provider>
  );
}
