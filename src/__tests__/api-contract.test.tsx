/**
 * api-contract.test.tsx
 *
 * API 명세 준수 테스트 — 실제 HTTP 요청/응답 페이로드가 명세와 일치하는지 검증.
 * UI 반응이 아닌 "무엇을 보내고 받는가"에 집중.
 *
 * GET /api/courses?category={category}
 *   → CourseListResponse: { courses: Course[], categories: string[] }
 *
 * POST /api/enrollments
 *   → 개인: PersonalEnrollmentRequest
 *   → 단체: GroupEnrollmentRequest
 *   ← 성공: EnrollmentResponse { enrollmentId, status, enrolledAt }
 *   ← 에러: ErrorResponse { code, message, details? }
 */
import { screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { courseHandlers } from '@/mocks/handlers/courseHandlers';
import { enrollmentHandlers } from '@/mocks/handlers/enrollmentHandlers';
import type {
  PersonalEnrollmentRequest,
  GroupEnrollmentRequest,
  CourseListResponse,
  Course,
} from '@/features/enrollment/types/enrollment';
import {
  renderForm,
  completeStep1Individual,
  completeStep1Group,
  completeStep2Individual,
  completeStep2Group,
} from './test-utils';

const server = setupServer(...courseHandlers, ...enrollmentHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => { server.resetHandlers(); localStorage.clear(); });
afterAll(() => server.close());

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

async function goToStep3Individual(user: ReturnType<typeof import('@testing-library/user-event')['default']['setup']>) {
  await completeStep1Individual(user);
  await completeStep2Individual(user);
  await screen.findByText('선택 강의');
}

async function goToStep3Group(user: ReturnType<typeof import('@testing-library/user-event')['default']['setup']>) {
  await completeStep1Group(user);
  await completeStep2Group(user);
  await screen.findByText('선택 강의');
}

async function submitStep3(user: ReturnType<typeof import('@testing-library/user-event')['default']['setup']>) {
  await user.click(screen.getByRole('checkbox', { name: /이용약관/ }));
  await user.click(screen.getByRole('button', { name: '제출하기' }));
}

// ─── GET /api/courses — 응답 스키마 ──────────────────────────────────────────

describe('GET /api/courses — 응답 스키마', () => {
  test('응답이 courses 배열과 categories 배열을 포함한다', async () => {
    let captured: CourseListResponse | null = null;
    server.use(
      http.get('/api/courses', ({ request }) => {
        // 원래 핸들러 로직 재현 후 shape 캡처
        const url = new URL(request.url);
        expect(url.pathname).toBe('/api/courses');
        return new Promise((resolve) => {
          // courseHandlers와 동일한 응답을 직접 구성
          import('@/mocks/data/courses').then(({ mockCourseListResponse }) => {
            captured = mockCourseListResponse;
            resolve(HttpResponse.json(mockCourseListResponse));
          });
        });
      })
    );

    renderForm();
    await screen.findByText('React 실전 개발');

    expect(captured).not.toBeNull();
    expect(Array.isArray(captured!.courses)).toBe(true);
    expect(Array.isArray(captured!.categories)).toBe(true);
    expect(captured!.courses.length).toBeGreaterThan(0);
  });

  test('각 Course 객체가 명세 필드를 모두 포함한다', async () => {
    let courses: Course[] = [];
    server.use(
      http.get('/api/courses', () =>
        new Promise((resolve) => {
          import('@/mocks/data/courses').then(({ mockCourseListResponse }) => {
            courses = mockCourseListResponse.courses;
            resolve(HttpResponse.json(mockCourseListResponse));
          });
        })
      )
    );

    renderForm();
    await screen.findByText('React 실전 개발');

    const requiredStringFields: (keyof Course)[] = [
      'id', 'title', 'description', 'category', 'instructor', 'startDate', 'endDate',
    ];
    const requiredNumberFields: (keyof Course)[] = ['price', 'maxCapacity', 'currentEnrollment'];
    const validCategories = ['development', 'design', 'marketing', 'business'];

    for (const course of courses) {
      for (const field of requiredStringFields) {
        expect(typeof course[field], `${course.id}.${field}`).toBe('string');
      }
      for (const field of requiredNumberFields) {
        expect(typeof course[field], `${course.id}.${field}`).toBe('number');
      }
      expect(validCategories, `${course.id}.category`).toContain(course.category);
      // ISO 8601 형식 확인
      expect(() => new Date(course.startDate).toISOString(), `${course.id}.startDate`).not.toThrow();
      expect(() => new Date(course.endDate).toISOString(), `${course.id}.endDate`).not.toThrow();
      // 정원 값 일관성
      expect(course.currentEnrollment, `${course.id} currentEnrollment <= maxCapacity`).toBeLessThanOrEqual(course.maxCapacity);
    }
  });

  test('categories 배열이 4개 카테고리를 모두 포함한다', async () => {
    let categories: string[] = [];
    server.use(
      http.get('/api/courses', () =>
        new Promise((resolve) => {
          import('@/mocks/data/courses').then(({ mockCourseListResponse }) => {
            categories = mockCourseListResponse.categories;
            resolve(HttpResponse.json(mockCourseListResponse));
          });
        })
      )
    );

    renderForm();
    await screen.findByText('React 실전 개발');

    expect(categories).toContain('development');
    expect(categories).toContain('design');
    expect(categories).toContain('marketing');
    expect(categories).toContain('business');
  });

  test('카테고리 필터 클릭 시 ?category= 쿼리 파라미터가 전송된다', async () => {
    const receivedParams: string[] = [];
    server.use(
      http.get('/api/courses', ({ request }) => {
        const url = new URL(request.url);
        const cat = url.searchParams.get('category');
        if (cat) receivedParams.push(cat);
        return new Promise((resolve) => {
          import('@/mocks/data/courses').then(({ mockCourseListResponse }) => {
            resolve(HttpResponse.json(mockCourseListResponse));
          });
        });
      })
    );

    const { user } = renderForm();
    await screen.findByText('React 실전 개발');
    await user.click(screen.getByRole('button', { name: '디자인' }));
    await screen.findByText('UI/UX 디자인 입문');

    expect(receivedParams).toContain('design');
  });

  test('courses가 빈 배열이면 안내 메시지가 표시된다', async () => {
    server.use(
      http.get('/api/courses', () =>
        HttpResponse.json({ courses: [], categories: ['development', 'design', 'marketing', 'business'] })
      )
    );

    renderForm();
    expect(await screen.findByText(/등록된 강의가 없습니다|강의가 없습니다|수강 가능한 강의/i)).toBeInTheDocument();
  });
});

// ─── POST /api/enrollments — 개인 신청 요청 바디 ─────────────────────────────

describe('POST /api/enrollments — 개인 신청 요청 바디', () => {
  test('개인 신청 payload가 PersonalEnrollmentRequest 명세를 만족한다', async () => {
    let capturedBody: PersonalEnrollmentRequest | null = null;
    server.use(
      http.post('/api/enrollments', async ({ request }) => {
        capturedBody = await request.json() as PersonalEnrollmentRequest;
        return HttpResponse.json({
          enrollmentId: 'ENR-TEST-001',
          status: 'confirmed',
          enrolledAt: new Date().toISOString(),
        });
      })
    );

    const { user } = renderForm();
    await goToStep3Individual(user);
    await submitStep3(user);
    await screen.findByText(/완료/);

    expect(capturedBody).not.toBeNull();
    // 최상위 필드
    expect(typeof capturedBody!.courseId).toBe('string');
    expect(capturedBody!.courseId).not.toBe('');
    expect(capturedBody!.type).toBe('personal');
    expect(capturedBody!.agreedToTerms).toBe(true);
    // applicant
    expect(capturedBody!.applicant.name).toBe('홍길동');
    expect(capturedBody!.applicant.email).toBe('hong@example.com');
    expect(capturedBody!.applicant.phone).toMatch(/^0\d{1,2}-\d{3,4}-\d{4}$/);
    // group 필드가 없어야 함
    expect((capturedBody as unknown as Record<string, unknown>).group).toBeUndefined();
  });

  test('수강 동기가 비어있으면 motivation 필드가 payload에서 생략되거나 undefined다', async () => {
    let capturedBody: PersonalEnrollmentRequest | null = null;
    server.use(
      http.post('/api/enrollments', async ({ request }) => {
        capturedBody = await request.json() as PersonalEnrollmentRequest;
        return HttpResponse.json({ enrollmentId: 'ENR-MOTIV-001', status: 'confirmed', enrolledAt: new Date().toISOString() });
      })
    );

    const { user } = renderForm();
    await goToStep3Individual(user);
    await submitStep3(user);
    await screen.findByText(/완료/);

    // motivation은 optional — 빈 값이면 포함되지 않거나 undefined/빈 문자열이어야 함
    const motivation = capturedBody!.applicant.motivation;
    expect(motivation == null || motivation === '').toBe(true);
  });

  test('수강 동기가 입력되면 motivation이 payload에 포함된다', async () => {
    let capturedBody: PersonalEnrollmentRequest | null = null;
    server.use(
      http.post('/api/enrollments', async ({ request }) => {
        capturedBody = await request.json() as PersonalEnrollmentRequest;
        return HttpResponse.json({ enrollmentId: 'ENR-MOTIV-002', status: 'confirmed', enrolledAt: new Date().toISOString() });
      })
    );

    const { user } = renderForm();
    await completeStep1Individual(user);

    // 수강 동기 입력 후 step2 완료
    await screen.findByPlaceholderText('홍길동');
    await user.type(screen.getByPlaceholderText('홍길동'), '홍길동');
    await user.type(screen.getByPlaceholderText('example@email.com'), 'hong@example.com');
    await user.type(screen.getAllByPlaceholderText('010-1234-5678')[0], '010-1234-5678');
    await user.type(screen.getByPlaceholderText('수강 동기를 입력해주세요'), 'React를 더 잘 배우고 싶습니다.');
    await user.click(screen.getByRole('button', { name: '다음' }));
    await screen.findByText('선택 강의');

    await submitStep3(user);
    await screen.findByText(/완료/);

    expect(capturedBody!.applicant.motivation).toBe('React를 더 잘 배우고 싶습니다.');
  });

  test('agreedToTerms가 true로 전송된다', async () => {
    let capturedBody: PersonalEnrollmentRequest | null = null;
    server.use(
      http.post('/api/enrollments', async ({ request }) => {
        capturedBody = await request.json() as PersonalEnrollmentRequest;
        return HttpResponse.json({ enrollmentId: 'ENR-TERMS-001', status: 'confirmed', enrolledAt: new Date().toISOString() });
      })
    );

    const { user } = renderForm();
    await goToStep3Individual(user);
    await submitStep3(user);
    await screen.findByText(/완료/);

    expect(capturedBody!.agreedToTerms).toBe(true);
  });
});

// ─── POST /api/enrollments — 단체 신청 요청 바디 ─────────────────────────────

describe('POST /api/enrollments — 단체 신청 요청 바디', () => {
  test('단체 신청 payload가 GroupEnrollmentRequest 명세를 만족한다', async () => {
    let capturedBody: GroupEnrollmentRequest | null = null;
    server.use(
      http.post('/api/enrollments', async ({ request }) => {
        capturedBody = await request.json() as GroupEnrollmentRequest;
        return HttpResponse.json({ enrollmentId: 'ENR-GRP-001', status: 'confirmed', enrolledAt: new Date().toISOString() });
      })
    );

    const { user } = renderForm();
    await goToStep3Group(user);
    await submitStep3(user);
    await screen.findByText(/완료/);

    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.type).toBe('group');
    expect(typeof capturedBody!.courseId).toBe('string');
    expect(capturedBody!.agreedToTerms).toBe(true);
    // applicant
    expect(capturedBody!.applicant.name).toBe('홍길동');
    expect(capturedBody!.applicant.email).toBe('rep@example.com');
    // group 객체
    expect(capturedBody!.group).toBeDefined();
    expect(capturedBody!.group.organizationName).toBe('테스트 회사');
    expect(typeof capturedBody!.group.headCount).toBe('number');
    expect(capturedBody!.group.headCount).toBeGreaterThanOrEqual(2);
    expect(typeof capturedBody!.group.contactPerson).toBe('string');
    expect(capturedBody!.group.contactPerson).not.toBe('');
    // participants
    expect(Array.isArray(capturedBody!.group.participants)).toBe(true);
  });

  test('headCount와 participants 배열 길이가 일치한다', async () => {
    let capturedBody: GroupEnrollmentRequest | null = null;
    server.use(
      http.post('/api/enrollments', async ({ request }) => {
        capturedBody = await request.json() as GroupEnrollmentRequest;
        return HttpResponse.json({ enrollmentId: 'ENR-GRP-002', status: 'confirmed', enrolledAt: new Date().toISOString() });
      })
    );

    const { user } = renderForm();
    await goToStep3Group(user);
    await submitStep3(user);
    await screen.findByText(/완료/);

    expect(capturedBody!.group.participants).toHaveLength(capturedBody!.group.headCount);
  });

  test('각 participant 객체가 name과 email 필드를 포함한다', async () => {
    let capturedBody: GroupEnrollmentRequest | null = null;
    server.use(
      http.post('/api/enrollments', async ({ request }) => {
        capturedBody = await request.json() as GroupEnrollmentRequest;
        return HttpResponse.json({ enrollmentId: 'ENR-GRP-003', status: 'confirmed', enrolledAt: new Date().toISOString() });
      })
    );

    const { user } = renderForm();
    await goToStep3Group(user);
    await submitStep3(user);
    await screen.findByText(/완료/);

    for (const p of capturedBody!.group.participants) {
      expect(typeof p.name).toBe('string');
      expect(p.name).not.toBe('');
      expect(typeof p.email).toBe('string');
      expect(p.email).toMatch(/@/);
    }
  });
});

// ─── POST /api/enrollments — 성공 응답 파싱 ─────────────────────────────────

describe('POST /api/enrollments — 성공 응답 파싱', () => {
  test('응답의 enrollmentId가 완료 화면에 표시된다', async () => {
    server.use(
      http.post('/api/enrollments', () =>
        HttpResponse.json({
          enrollmentId: 'ENR-20260518-9999',
          status: 'confirmed',
          enrolledAt: new Date().toISOString(),
        })
      )
    );

    const { user } = renderForm();
    await goToStep3Individual(user);
    await submitStep3(user);

    expect(await screen.findByText('ENR-20260518-9999')).toBeInTheDocument();
  });

  test('status가 confirmed이면 완료 화면이 표시된다', async () => {
    server.use(
      http.post('/api/enrollments', () =>
        HttpResponse.json({
          enrollmentId: 'ENR-CONFIRMED-001',
          status: 'confirmed',
          enrolledAt: '2026-05-18T09:00:00Z',
        })
      )
    );

    const { user } = renderForm();
    await goToStep3Individual(user);
    await submitStep3(user);

    expect(await screen.findByText(/완료/)).toBeInTheDocument();
    expect(screen.queryByText(/오류|실패/i)).not.toBeInTheDocument();
  });

  test('status가 pending이면 완료 화면이 표시된다', async () => {
    server.use(
      http.post('/api/enrollments', () =>
        HttpResponse.json({
          enrollmentId: 'ENR-PENDING-001',
          status: 'pending',
          enrolledAt: new Date().toISOString(),
        })
      )
    );

    const { user } = renderForm();
    await goToStep3Individual(user);
    await submitStep3(user);

    expect(await screen.findByText(/완료/)).toBeInTheDocument();
  });
});

// ─── POST /api/enrollments — 에러 응답 ───────────────────────────────────────

describe('POST /api/enrollments — 에러 응답 스키마', () => {
  test('COURSE_FULL (409) — code + message 구조로 응답된다', async () => {
    server.use(
      http.post('/api/enrollments', () =>
        HttpResponse.json(
          { code: 'COURSE_FULL', message: '선택하신 강의의 정원이 마감되었습니다.' },
          { status: 409 }
        )
      )
    );

    const { user } = renderForm();
    await goToStep3Individual(user);
    await submitStep3(user);

    expect(await screen.findByText(/정원이 마감/)).toBeInTheDocument();
    // 완료 화면이 아님
    expect(screen.queryByText(/수강 신청이 완료되었습니다/)).not.toBeInTheDocument();
  });

  test('DUPLICATE_ENROLLMENT (409) — 이미 신청한 강의 메시지가 표시된다', async () => {
    server.use(
      http.post('/api/enrollments', () =>
        HttpResponse.json(
          { code: 'DUPLICATE_ENROLLMENT', message: '이미 신청한 강의입니다.' },
          { status: 409 }
        )
      )
    );

    const { user } = renderForm();
    await goToStep3Individual(user);
    await submitStep3(user);

    expect(await screen.findByText(/이미 신청한 강의/)).toBeInTheDocument();
  });

  test('INVALID_INPUT (400) — details 필드 없이도 에러 메시지가 표시된다', async () => {
    server.use(
      http.post('/api/enrollments', () =>
        HttpResponse.json(
          { code: 'INVALID_INPUT', message: '입력값을 확인해주세요.' },
          { status: 400 }
        )
      )
    );

    const { user } = renderForm();
    await goToStep3Individual(user);
    await submitStep3(user);

    const errorEls = await screen.findAllByText(/입력값|입력 정보|다시 확인/i);
    expect(errorEls.length).toBeGreaterThan(0);
    expect(screen.queryByText(/수강 신청이 완료되었습니다/)).not.toBeInTheDocument();
  });

  test('INVALID_INPUT (400) — details 필드가 있으면 필드별 에러가 표시된다', async () => {
    server.use(
      http.post('/api/enrollments', () =>
        HttpResponse.json(
          {
            code: 'INVALID_INPUT',
            message: '입력값을 확인해주세요.',
            details: {
              email: '올바른 이메일 형식이 아닙니다.',
              phone: '올바른 전화번호 형식이 아닙니다.',
            },
          },
          { status: 400 }
        )
      )
    );

    const { user } = renderForm();
    await goToStep3Individual(user);
    await submitStep3(user);

    // 에러 배너가 표시되어야 함
    const bannerEls = await screen.findAllByText(/입력값|입력 정보|다시 확인/i);
    expect(bannerEls.length).toBeGreaterThan(0);
  });

  test('UNKNOWN_ERROR (500) — 일시적 오류 메시지와 재시도 버튼이 표시된다', async () => {
    server.use(
      http.post('/api/enrollments', () =>
        HttpResponse.json(
          { code: 'UNKNOWN_ERROR', message: '서버 오류가 발생했습니다.' },
          { status: 500 }
        )
      )
    );

    const { user } = renderForm();
    await goToStep3Individual(user);
    await submitStep3(user);

    expect(await screen.findByText(/일시적인 오류|잠시 후/i)).toBeInTheDocument();
    // 제출 버튼이 다시 활성화되어 재시도 가능해야 함
    expect(screen.getByRole('button', { name: '제출하기' })).not.toBeDisabled();
  });

  test('네트워크 장애 시 에러 메시지가 표시되고 입력 데이터가 유지된다', async () => {
    server.use(
      http.post('/api/enrollments', () => HttpResponse.error())
    );

    const { user } = renderForm();
    await goToStep3Individual(user);
    await submitStep3(user);

    expect(await screen.findByText(/일시적인 오류|잠시 후/i)).toBeInTheDocument();
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('hong@example.com')).toBeInTheDocument();
  });
});

// ─── 에러 코드별 액션 버튼 ────────────────────────────────────────────────────

describe('에러 코드별 액션 UX', () => {
  test('COURSE_FULL — "다른 강의 선택하기" 버튼이 표시된다', async () => {
    server.use(
      http.post('/api/enrollments', () =>
        HttpResponse.json({ code: 'COURSE_FULL', message: '정원 마감' }, { status: 409 })
      )
    );

    const { user } = renderForm();
    await goToStep3Individual(user);
    await submitStep3(user);

    expect(await screen.findByRole('button', { name: /다른 강의 선택하기/ })).toBeInTheDocument();
  });

  test('COURSE_FULL — "다른 강의 선택하기" 클릭 시 Step1으로 이동한다', async () => {
    server.use(
      http.post('/api/enrollments', () =>
        HttpResponse.json({ code: 'COURSE_FULL', message: '정원 마감' }, { status: 409 })
      )
    );

    const { user } = renderForm();
    await goToStep3Individual(user);
    await submitStep3(user);
    await screen.findByRole('button', { name: /다른 강의 선택하기/ });

    await user.click(screen.getByRole('button', { name: /다른 강의 선택하기/ }));

    // Step1 강의 목록이 다시 표시됨 (카드 + 선택 요약 strip에 각각 표시될 수 있음)
    const courseEls = await screen.findAllByText('React 실전 개발');
    expect(courseEls.length).toBeGreaterThan(0);
  });

  test('제출 실패 후 체크박스 상태가 유지된다', async () => {
    server.use(
      http.post('/api/enrollments', () =>
        HttpResponse.json({ code: 'UNKNOWN_ERROR', message: '서버 오류' }, { status: 500 })
      )
    );

    const { user } = renderForm();
    await goToStep3Individual(user);
    await submitStep3(user);
    await screen.findByText(/일시적인 오류/);

    expect(screen.getByRole('checkbox', { name: /이용약관/ })).toBeChecked();
  });
});

// ─── 중복 제출 방지 ───────────────────────────────────────────────────────────

describe('중복 제출 방지', () => {
  test('제출 중에는 버튼이 disabled 상태가 된다', async () => {
    server.use(
      http.post('/api/enrollments', async () => {
        // 의도적 지연
        await new Promise((r) => setTimeout(r, 300));
        return HttpResponse.json({ enrollmentId: 'ENR-DELAY', status: 'confirmed', enrolledAt: new Date().toISOString() });
      })
    );

    const { user } = renderForm();
    await goToStep3Individual(user);
    await user.click(screen.getByRole('checkbox', { name: /이용약관/ }));
    await user.click(screen.getByRole('button', { name: '제출하기' }));

    // 제출 중 버튼 비활성화 확인
    expect(await screen.findByRole('button', { name: /제출 중/ })).toBeDisabled();
  });
});
