import { screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { courseHandlers } from '@/mocks/handlers/courseHandlers';
import { renderForm, completeStep1Individual } from './test-utils';

const server = setupServer(...courseHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => { server.resetHandlers(); localStorage.clear(); });
afterAll(() => server.close());

describe('Step2 개인 신청 정보 입력', () => {
  async function setup() {
    const utils = renderForm();
    await completeStep1Individual(utils.user);
    return utils;
  }

  test('이름 2자 미만 입력 시 에러가 표시된다', async () => {
    const { user } = await setup();
    const nameInput = screen.getByPlaceholderText('홍길동');
    await user.type(nameInput, '홍');
    await user.tab();
    expect(await screen.findByText(/2자 이상/)).toBeInTheDocument();
  });

  test('이름 20자 초과 입력 시 에러가 표시된다', async () => {
    const { user } = await setup();
    const nameInput = screen.getByPlaceholderText('홍길동');
    await user.type(nameInput, '가'.repeat(21));
    await user.tab();
    expect(await screen.findByText(/20자 이하/)).toBeInTheDocument();
  });

  test('이메일 형식이 올바르지 않으면 에러가 표시된다', async () => {
    const { user } = await setup();
    const emailInput = screen.getByPlaceholderText('example@email.com');
    await user.type(emailInput, 'invalid-email');
    await user.tab();
    expect(await screen.findByText(/이메일 형식/)).toBeInTheDocument();
  });

  test('전화번호 형식이 올바르지 않으면 에러가 표시된다', async () => {
    const { user } = await setup();
    const phoneInput = screen.getAllByPlaceholderText('010-1234-5678')[0];
    await user.type(phoneInput, '12345');
    await user.tab();
    expect(await screen.findByText(/전화번호 형식/)).toBeInTheDocument();
  });

  test('수강 동기 300자 초과 시 에러가 표시된다', async () => {
    const { user } = await setup();
    const motivationInput = screen.getByPlaceholderText('수강 동기를 입력해주세요');
    await user.click(motivationInput);
    await user.paste('가'.repeat(301));
    await user.tab();
    expect(await screen.findByText(/300자 이하/)).toBeInTheDocument();
  });

  test('필수 필드 미입력 시 다음 클릭하면 에러가 표시된다', async () => {
    const { user } = await setup();
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findByText(/2자 이상/)).toBeInTheDocument();
  });

  test('이전 버튼 클릭 시 Step1으로 이동하고 강의 선택이 유지된다', async () => {
    const { user } = await setup();
    await user.click(screen.getByRole('button', { name: '이전' }));
    // 선택된 강의 요약 strip + 카드 두 곳에 표시됨
    expect(await screen.findAllByText('React 실전 개발')).toHaveLength(2);
  });

  test('유효한 정보 입력 후 다음 클릭 시 Step3으로 이동한다', async () => {
    const { user } = await setup();
    await user.type(screen.getByPlaceholderText('홍길동'), '홍길동');
    await user.type(screen.getByPlaceholderText('example@email.com'), 'hong@example.com');
    await user.type(screen.getAllByPlaceholderText('010-1234-5678')[0], '010-1234-5678');
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findByText(/이용약관/)).toBeInTheDocument();
  });
});
