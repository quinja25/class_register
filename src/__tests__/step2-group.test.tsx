import { screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { courseHandlers } from '@/mocks/handlers/courseHandlers';
import { renderForm, completeStep1Group } from './test-utils';

const server = setupServer(...courseHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => { server.resetHandlers(); localStorage.clear(); });
afterAll(() => server.close());

describe('Step2 단체 신청', () => {
  async function setup() {
    const utils = renderForm();
    await completeStep1Group(utils.user);
    return utils;
  }

  test('단체 신청 선택 시 단체 필드가 표시된다', async () => {
    await setup();
    expect(await screen.findByPlaceholderText('(주)회사명')).toBeInTheDocument();
  });

  test('단체→개인 전환 시 확인 다이얼로그가 표시된다', async () => {
    const { user } = await setup();
    await screen.findByPlaceholderText('(주)회사명');
    await user.type(screen.getByPlaceholderText('(주)회사명'), '테스트 회사');
    await user.click(screen.getByRole('radio', { name: /개인 신청/ }));
    expect(await screen.findByText(/단체 신청 정보가/)).toBeInTheDocument();
  });

  test('다이얼로그에서 취소 클릭 시 단체 유형과 데이터가 유지된다', async () => {
    const { user } = await setup();
    await screen.findByPlaceholderText('(주)회사명');
    await user.type(screen.getByPlaceholderText('(주)회사명'), '테스트 회사');
    await user.click(screen.getByRole('radio', { name: /개인 신청/ }));
    await screen.findByText(/단체 신청 정보가/);
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.getByPlaceholderText('(주)회사명')).toHaveValue('테스트 회사');
  });

  test('다이얼로그에서 확인 클릭 시 단체 필드가 초기화된다', async () => {
    const { user } = await setup();
    await screen.findByPlaceholderText('(주)회사명');
    await user.type(screen.getByPlaceholderText('(주)회사명'), '테스트 회사');
    await user.click(screen.getByRole('radio', { name: /개인 신청/ }));
    await screen.findByText(/단체 신청 정보가/);
    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByPlaceholderText('(주)회사명')).toHaveValue('');
  });

  test('참가자 이메일 중복 입력 시 에러가 표시된다', async () => {
    const { user } = await setup();
    await user.type(screen.getByPlaceholderText('홍길동'), '홍길동');
    await user.type(screen.getByPlaceholderText('example@email.com'), 'rep@example.com');
    await user.type(screen.getAllByPlaceholderText('010-1234-5678')[0], '010-1234-5678');
    await user.type(screen.getByPlaceholderText('(주)회사명'), '테스트 회사');
    await user.type(screen.getAllByPlaceholderText('010-1234-5678')[1], '010-9999-8888');

    const participantEmails = screen.getAllByPlaceholderText('이메일');
    await user.type(participantEmails[0], 'same@example.com');
    await user.type(participantEmails[1], 'same@example.com');

    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findByText(/이미 입력된 이메일/)).toBeInTheDocument();
  });

  test('참가자 이메일이 대표 신청자 이메일과 같으면 에러가 표시된다', async () => {
    const { user } = await setup();
    await user.type(screen.getByPlaceholderText('홍길동'), '홍길동');
    await user.type(screen.getByPlaceholderText('example@email.com'), 'rep@example.com');
    await user.type(screen.getAllByPlaceholderText('010-1234-5678')[0], '010-1234-5678');
    await user.type(screen.getByPlaceholderText('(주)회사명'), '테스트 회사');
    await user.type(screen.getAllByPlaceholderText('010-1234-5678')[1], '010-9999-8888');

    const participantEmails = screen.getAllByPlaceholderText('이메일');
    await user.type(participantEmails[0], 'rep@example.com');
    await user.type(participantEmails[1], 'other@example.com');

    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findByText(/대표 신청자와 동일한 이메일/)).toBeInTheDocument();
  });
});
