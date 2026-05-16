import { useMutation } from '@tanstack/react-query';
import type { EnrollmentRequest, EnrollmentResponse, EnrollmentApiError } from '../types/enrollment';

async function postEnrollment(body: EnrollmentRequest): Promise<EnrollmentResponse> {
  const res = await fetch('/api/enrollments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error: EnrollmentApiError = await res.json();
    throw error;
  }

  return res.json();
}

export function useEnrollment() {
  return useMutation<EnrollmentResponse, EnrollmentApiError, EnrollmentRequest>({
    mutationFn: postEnrollment,
  });
}
