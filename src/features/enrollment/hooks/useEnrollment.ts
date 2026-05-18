import { useMutation } from '@tanstack/react-query';
import type { EnrollmentRequest, EnrollmentResponse, EnrollmentApiError } from '../types/enrollment';

async function postEnrollment(body: EnrollmentRequest): Promise<EnrollmentResponse> {
  let res: Response;
  try {
    res = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw { code: 'UNKNOWN_ERROR', message: '네트워크 오류가 발생했습니다.' } satisfies EnrollmentApiError;
  }

  if (!res.ok) {
    let error: EnrollmentApiError;
    try {
      error = await res.json();
    } catch {
      error = { code: 'UNKNOWN_ERROR', message: '서버 오류가 발생했습니다.' };
    }
    throw error;
  }

  return res.json();
}

export function useEnrollment() {
  return useMutation<EnrollmentResponse, EnrollmentApiError, EnrollmentRequest>({
    mutationFn: postEnrollment,
  });
}
