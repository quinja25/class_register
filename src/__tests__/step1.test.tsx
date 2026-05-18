import { screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { courseHandlers } from '@/mocks/handlers/courseHandlers';
import { renderForm } from './test-utils';

const server = setupServer(...courseHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => { server.resetHandlers(); localStorage.clear(); });
afterAll(() => server.close());

describe('Step1 강의 선택', () => {
  test('강의 목록이 로딩 후 렌더링된다', async () => {
    renderForm();
    await screen.findByText('React 실전 개발');
    expect(screen.getByText('Node.js 백엔드 입문')).toBeInTheDocument();
  });

  test('카테고리 필터로 해당 카테고리 강의만 표시된다', async () => {
    const { user } = renderForm();
    await screen.findByText('React 실전 개발');
    await user.click(screen.getByRole('button', { name: '디자인' }));
    expect(await screen.findByText('UI/UX 디자인 입문')).toBeInTheDocument();
    expect(screen.queryByText('React 실전 개발')).not.toBeInTheDocument();
  });

  test('마감된 강의(스타트업 마케팅)는 버튼이 비활성화된다', async () => {
    const { user } = renderForm();
    await screen.findByText('React 실전 개발');
    await user.click(screen.getByRole('button', { name: '마케팅' }));
    const fullBtn = await screen.findByRole('button', { name: /스타트업 마케팅 전략/ });
    expect(fullBtn).toBeDisabled();
  });

  test('강의를 선택하지 않고 다음 클릭 시 에러 메시지가 표시된다', async () => {
    const { user } = renderForm();
    await screen.findByText('React 실전 개발');
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findByText(/강의를 선택해주세요/)).toBeInTheDocument();
  });

  test('신청 유형을 선택하지 않고 다음 클릭 시 에러 메시지가 표시된다', async () => {
    const { user } = renderForm();
    await screen.findByText('React 실전 개발');
    await user.click(screen.getByRole('button', { name: /React 실전 개발/ }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findByText(/신청 유형을 선택해주세요/)).toBeInTheDocument();
  });

  test('강의와 개인 신청 유형을 선택하면 Step2로 이동한다', async () => {
    const { user } = renderForm();
    await screen.findByText('React 실전 개발');
    await user.click(screen.getByRole('button', { name: /React 실전 개발/ }));
    await user.click(screen.getByRole('radio', { name: /개인 신청/ }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findByPlaceholderText('홍길동')).toBeInTheDocument();
  });

  test('마감 임박 강의에 배지가 표시된다', async () => {
    const { user } = renderForm();
    await screen.findByText('React 실전 개발');
    await user.click(screen.getByRole('button', { name: '디자인' }));
    expect(await screen.findByText(/마감 임박/)).toBeInTheDocument();
  });
});
