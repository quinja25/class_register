import { useContext } from 'react';
import { EnrollmentFormContext } from '../context/EnrollmentFormContext';

export function useEnrollmentForm() {
  const ctx = useContext(EnrollmentFormContext);
  if (!ctx) {
    throw new Error('useEnrollmentForm must be used within EnrollmentFormProvider');
  }
  return ctx;
}
