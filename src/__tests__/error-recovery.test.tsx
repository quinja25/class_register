/**
 * error-recovery.test.tsx
 *
 * Tests for submission error scenarios and post-success state reset.
 *
 * Error code mapping (from Step3Confirmation.tsx ERROR_MESSAGES):
 *   UNKNOWN_ERROR → '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
 *
 * The fallback branch in Step3Confirmation:
 *   const apiError = error?.code
 *     ? (ERROR_MESSAGES[error.code] ?? ERROR_MESSAGES.UNKNOWN_ERROR)
 *     : null;
 *
 * A plain-text 500 body with no JSON 'code' field exercises the
 * "code is undefined → fallback to UNKNOWN_ERROR" path.
 *
 * useEnrollment must parse the response: if it cannot extract a
 * code from a non-JSON body, error.code will be undefined, which
 * should still show the UNKNOWN_ERROR message.
 */
import { screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { courseHandlers } from '@/mocks/handlers/courseHandlers';
import { enrollmentHandlers } from '@/mocks/handlers/enrollmentHandlers';
import { renderForm, completeStep1Individual, completeStep2Individual } from './test-utils';

const server = setupServer(...courseHandlers, ...enrollmentHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => { server.resetHandlers(); localStorage.clear(); });
afterAll(() => server.close());

async function goToStep3(user: ReturnType<typeof import('@testing-library/user-event')['default']['setup']>) {
  await completeStep1Individual(user);
  await completeStep2Individual(user);
  // Wait for Step 3 to render
  await screen.findByText('선택 강의');
}

describe('에러 복구 및 상태 초기화', () => {
  test('서버가 non-JSON 500을 반환하면 폴백 에러 메시지가 표시된다', async () => {
    server.use(
      http.post('/api/enrollments', () =>
        new HttpResponse('Internal Server Error', {
          status: 500,
          headers: { 'Content-Type': 'text/plain' },
        })
      )
    );

    const { user } = renderForm();
    await goToStep3(user);

    await user.click(screen.getByRole('checkbox', { name: /이용약관/ }));
    await user.click(screen.getByRole('button', { name: '제출하기' }));

    // UNKNOWN_ERROR path: code is missing/unrecognised → fallback message
    expect(await screen.findByText(/일시적인 오류/)).toBeInTheDocument();

    // Must still be on Step 3 (not completion screen)
    expect(screen.queryByText(/수강 신청이 완료되었습니다/)).not.toBeInTheDocument();
  });

  test('첫 번째 제출 실패 후 재시도 성공 시 완료 화면이 표시된다', async () => {
    let callCount = 0;
    server.use(
      http.post('/api/enrollments', () => {
        callCount += 1;
        if (callCount === 1) {
          return HttpResponse.json(
            { code: 'UNKNOWN_ERROR', message: '서버 오류' },
            { status: 500 }
          );
        }
        return HttpResponse.json(
          {
            enrollmentId: 'ENR-RETRY-001',
            status: 'confirmed',
            enrolledAt: new Date().toISOString(),
          },
          { status: 200 }
        );
      })
    );

    const { user } = renderForm();
    await goToStep3(user);

    // Check the terms checkbox — it must persist across retry
    await user.click(screen.getByRole('checkbox', { name: /이용약관/ }));

    // First attempt — expect failure message
    await user.click(screen.getByRole('button', { name: '제출하기' }));
    await screen.findByText(/일시적인 오류/);

    // Terms checkbox should still be checked (form state preserved)
    const checkbox = screen.getByRole('checkbox', { name: /이용약관/ });
    expect(checkbox).toBeChecked();

    // Second attempt — should succeed
    await user.click(screen.getByRole('button', { name: '제출하기' }));
    expect(await screen.findByText(/수강 신청이 완료되었습니다/)).toBeInTheDocument();
    expect(screen.getByText('ENR-RETRY-001')).toBeInTheDocument();
  });

  test('제출 성공 후 "새로운 신청하기" 클릭 시 Step 1으로 돌아가고 이전 강의 요약이 없다', async () => {
    const { user } = renderForm();
    await goToStep3(user);

    await user.click(screen.getByRole('checkbox', { name: /이용약관/ }));
    await user.click(screen.getByRole('button', { name: '제출하기' }));

    // Completion screen
    expect(await screen.findByText(/수강 신청이 완료되었습니다/)).toBeInTheDocument();

    // Reset
    await user.click(screen.getByRole('button', { name: '새로운 신청하기' }));

    // Back to Step 1 — course list reloads
    expect(await screen.findByText('React 실전 개발')).toBeInTheDocument();

    // The step-3 summary cards must not be visible
    expect(screen.queryByText('선택 강의')).not.toBeInTheDocument();
    expect(screen.queryByText('신청자 정보')).not.toBeInTheDocument();

    // Draft banner must not appear (draft was cleared on success)
    expect(screen.queryByText(/이전에 작성하던 신청서가 있습니다/)).not.toBeInTheDocument();

    // RESET action sets state to initialState — no previously-filled name
    expect(screen.queryByText('홍길동')).not.toBeInTheDocument();
  });

  test('제출 실패 후 입력한 신청자 정보가 Step 3 화면에 유지된다', async () => {
    server.use(
      http.post('/api/enrollments', () =>
        HttpResponse.json({ code: 'UNKNOWN_ERROR', message: '서버 오류' }, { status: 500 })
      )
    );

    const { user } = renderForm();
    await goToStep3(user);

    await user.click(screen.getByRole('checkbox', { name: /이용약관/ }));
    await user.click(screen.getByRole('button', { name: '제출하기' }));

    await screen.findByText(/일시적인 오류/);

    // Step 2 data still visible in summary
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('hong@example.com')).toBeInTheDocument();
    expect(screen.getByText('React 실전 개발')).toBeInTheDocument();
  });
});
