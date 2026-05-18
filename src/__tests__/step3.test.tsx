import { screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
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
}

describe('Step3 확인 및 제출', () => {
  test('신청자 정보와 강의 정보가 요약 화면에 표시된다', async () => {
    const { user } = renderForm();
    await goToStep3(user);
    expect(await screen.findByText('React 실전 개발')).toBeInTheDocument();
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('hong@example.com')).toBeInTheDocument();
  });

  test('이용약관 미동의 시 제출이 차단된다', async () => {
    const { user } = renderForm();
    await goToStep3(user);
    await screen.findByText('React 실전 개발');
    await user.click(screen.getByRole('button', { name: '제출하기' }));
    expect(await screen.findByText(/이용약관에 동의해주세요/)).toBeInTheDocument();
  });

  test('제출 중 버튼이 비활성화되어 중복 제출이 방지된다', async () => {
    server.use(
      http.post('/api/enrollments', async () => {
        await delay(300);
        return HttpResponse.json({ enrollmentId: 'ENR-TEST', status: 'confirmed', enrolledAt: new Date().toISOString() });
      })
    );
    const { user } = renderForm();
    await goToStep3(user);
    await screen.findByText('React 실전 개발');
    await user.click(screen.getByRole('checkbox', { name: /이용약관/ }));
    await user.click(screen.getByRole('button', { name: '제출하기' }));
    expect(await screen.findByRole('button', { name: /제출 중/ })).toBeDisabled();
  });

  test('제출 성공 시 완료 화면이 표시된다', async () => {
    const { user } = renderForm();
    await goToStep3(user);
    await screen.findByText('React 실전 개발');
    await user.click(screen.getByRole('checkbox', { name: /이용약관/ }));
    await user.click(screen.getByRole('button', { name: '제출하기' }));
    expect(await screen.findByText(/수강 신청이 완료되었습니다/)).toBeInTheDocument();
    expect(screen.getByText(/ENR-/)).toBeInTheDocument();
  });

  test('COURSE_FULL 에러 시 의미 있는 메시지와 액션 버튼이 표시된다', async () => {
    server.use(
      http.post('/api/enrollments', () =>
        HttpResponse.json({ code: 'COURSE_FULL', message: '정원 마감' }, { status: 409 })
      )
    );
    const { user } = renderForm();
    await goToStep3(user);
    await screen.findByText('React 실전 개발');
    await user.click(screen.getByRole('checkbox', { name: /이용약관/ }));
    await user.click(screen.getByRole('button', { name: '제출하기' }));
    expect(await screen.findByText(/정원이 마감/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /다른 강의 선택하기/ })).toBeInTheDocument();
  });

  test('DUPLICATE_ENROLLMENT 에러 시 메시지가 표시된다', async () => {
    server.use(
      http.post('/api/enrollments', () =>
        HttpResponse.json({ code: 'DUPLICATE_ENROLLMENT', message: '중복 신청' }, { status: 409 })
      )
    );
    const { user } = renderForm();
    await goToStep3(user);
    await screen.findByText('React 실전 개발');
    await user.click(screen.getByRole('checkbox', { name: /이용약관/ }));
    await user.click(screen.getByRole('button', { name: '제출하기' }));
    expect(await screen.findByText(/이미 신청한 강의/)).toBeInTheDocument();
  });

  test('제출 실패 후 입력 데이터가 유지된다', async () => {
    server.use(
      http.post('/api/enrollments', () =>
        HttpResponse.json({ code: 'UNKNOWN_ERROR', message: '서버 오류' }, { status: 500 })
      )
    );
    const { user } = renderForm();
    await goToStep3(user);
    await screen.findByText('React 실전 개발');
    await user.click(screen.getByRole('checkbox', { name: /이용약관/ }));
    await user.click(screen.getByRole('button', { name: '제출하기' }));
    await screen.findByText(/일시적인 오류/);
    // Data still visible
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('hong@example.com')).toBeInTheDocument();
  });

  test('"수정" 클릭 시 해당 스텝으로 이동한다', async () => {
    const { user } = renderForm();
    await goToStep3(user);
    await screen.findByText('React 실전 개발');
    const editButtons = screen.getAllByRole('button', { name: '수정 →' });
    await user.click(editButtons[0]); // 강의 선택으로 이동
    expect(await screen.findByText(/신청 유형/)).toBeInTheDocument();
  });
});
