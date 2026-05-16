'use client';

import { createContext, useReducer, type ReactNode } from 'react';
import {
  enrollmentReducer,
  initialState,
  type EnrollmentFormState,
  type EnrollmentAction,
} from './enrollmentReducer';

interface EnrollmentFormContextValue {
  state: EnrollmentFormState;
  dispatch: React.Dispatch<EnrollmentAction>;
}

export const EnrollmentFormContext = createContext<EnrollmentFormContextValue | null>(null);

export function EnrollmentFormProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(enrollmentReducer, initialState);

  return (
    <EnrollmentFormContext.Provider value={{ state, dispatch }}>
      {children}
    </EnrollmentFormContext.Provider>
  );
}
