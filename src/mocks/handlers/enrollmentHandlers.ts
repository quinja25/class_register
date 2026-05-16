import { http, HttpResponse } from 'msw';
import type { EnrollmentRequest } from '@/features/enrollment/types/enrollment';

export const enrollmentHandlers = [
  http.post('/api/enrollments', async ({ request }) => {
    const url = new URL(request.url);
    const body = await request.json() as EnrollmentRequest;

    if (url.searchParams.get('simulateError') === 'true') {
      return HttpResponse.json(
        { code: 'UNKNOWN_ERROR', message: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (url.searchParams.get('simulateInvalidInput') === 'true') {
      return HttpResponse.json(
        {
          code: 'INVALID_INPUT',
          message: '입력값을 확인해주세요.',
          details: { email: '올바른 이메일 형식이 아닙니다.', phone: '올바른 전화번호 형식이 아닙니다.' },
        },
        { status: 400 }
      );
    }

    if (body.courseId === 'mkt-001') {
      return HttpResponse.json(
        { code: 'COURSE_FULL', message: '선택하신 강의의 정원이 마감되었습니다.' },
        { status: 409 }
      );
    }

    if (body.applicant.email === 'duplicate@test.com') {
      return HttpResponse.json(
        { code: 'DUPLICATE_ENROLLMENT', message: '이미 신청한 강의입니다.' },
        { status: 409 }
      );
    }

    return HttpResponse.json(
      {
        enrollmentId: `ENR-${Date.now()}`,
        status: 'confirmed',
        enrolledAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }),
];
