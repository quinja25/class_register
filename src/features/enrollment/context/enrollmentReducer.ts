import type { Step1Values } from '../schemas/step1Schema';
import type { Step2Values } from '../schemas/step2Schema';
import type { Step3Values } from '../schemas/step3Schema';
import type { EnrollmentResponse } from '../types/enrollment';

export type Step = 1 | 2 | 3;

export interface EnrollmentFormState {
  step: Step;
  step1: Step1Values | null;
  step2: Step2Values | null;
  step3: Step3Values | null;
  result: EnrollmentResponse | null;
}

export const initialState: EnrollmentFormState = {
  step: 1,
  step1: null,
  step2: null,
  step3: null,
  result: null,
};

export type EnrollmentAction =
  | { type: 'SET_STEP1'; payload: Step1Values }
  | { type: 'SET_STEP2'; payload: Step2Values }
  | { type: 'SET_STEP3'; payload: Step3Values }
  | { type: 'CLEAR_STEP2' }
  | { type: 'GO_TO_STEP'; payload: Step }
  | { type: 'SET_RESULT'; payload: EnrollmentResponse }
  | { type: 'RESET' };

export function enrollmentReducer(
  state: EnrollmentFormState,
  action: EnrollmentAction
): EnrollmentFormState {
  switch (action.type) {
    case 'SET_STEP1':
      return { ...state, step1: action.payload };
    case 'SET_STEP2':
      return { ...state, step2: action.payload };
    case 'SET_STEP3':
      return { ...state, step3: action.payload };
    case 'CLEAR_STEP2':
      return { ...state, step2: null };
    case 'GO_TO_STEP':
      return { ...state, step: action.payload };
    case 'SET_RESULT':
      return { ...state, result: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}
