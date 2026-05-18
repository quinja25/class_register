/**
 * boundary.test.tsx
 *
 * Tests for boundary values on Step 2 fields.
 * Each test checks that the Zod schema accepts (or rejects) an
 * exact boundary value by observing whether the form advances to
 * Step 3 or stays on Step 2 with an error.
 */
import { screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { courseHandlers } from '@/mocks/handlers/courseHandlers';
import { renderForm, completeStep1Individual } from './test-utils';

const server = setupServer(...courseHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => { server.resetHandlers(); localStorage.clear(); });
afterAll(() => server.close());

// Helper: complete step 1 then fill name/email/phone with the supplied name,
// click 다음, and return the user handle.
async function fillStep2WithName(
  user: ReturnType<typeof import('@testing-library/user-event')['default']['setup']>,
  name: string,
) {
  await completeStep1Individual(user);
  // Wait for Step 2 to appear
  await screen.findByPlaceholderText('홍길동');

  await user.type(screen.getByPlaceholderText('홍길동'), name);
  await user.type(screen.getByPlaceholderText('example@email.com'), 'hong@example.com');
  await user.type(screen.getAllByPlaceholderText('010-1234-5678')[0], '010-1234-5678');
  await user.click(screen.getByRole('button', { name: '다음' }));
}

async function fillStep2WithMotivation(
  user: ReturnType<typeof import('@testing-library/user-event')['default']['setup']>,
  motivation: string,
) {
  await completeStep1Individual(user);
  await screen.findByPlaceholderText('홍길동');

  await user.type(screen.getByPlaceholderText('홍길동'), '홍길동');
  await user.type(screen.getByPlaceholderText('example@email.com'), 'hong@example.com');
  await user.type(screen.getAllByPlaceholderText('010-1234-5678')[0], '010-1234-5678');

  // Use fireEvent.change for large text blocks: userEvent.type fires one
  // synthetic event per character, making 300+ character strings time out.
  const textarea = screen.getByPlaceholderText('수강 동기를 입력해주세요');
  fireEvent.change(textarea, { target: { value: motivation } });

  await user.click(screen.getByRole('button', { name: '다음' }));
}

describe('경계값 테스트', () => {
  test('이름 정확히 2자이면 Step 3으로 진행한다', async () => {
    const { user } = renderForm();
    await fillStep2WithName(user, '김김');

    // If Step 3 rendered we'll see at least one "수정 →" button
    // (SectionCard renders one for each section).
    // A name-too-short error would keep us on Step 2.
    const editButtons = await screen.findAllByRole('button', { name: '수정 →' });
    expect(editButtons.length).toBeGreaterThanOrEqual(1);

    // Confirm we are NOT still showing a name validation error
    expect(screen.queryByText(/이름은 2자 이상이어야 합니다/)).not.toBeInTheDocument();
  });

  test('이름 정확히 20자이면 Step 3으로 진행한다', async () => {
    const { user } = renderForm();
    // Exactly 20 Korean characters
    const twentyChars = '가'.repeat(20);
    await fillStep2WithName(user, twentyChars);

    const editButtons = await screen.findAllByRole('button', { name: '수정 →' });
    expect(editButtons.length).toBeGreaterThanOrEqual(1);

    expect(screen.queryByText(/이름은 20자 이하이어야 합니다/)).not.toBeInTheDocument();
  });

  test('이름 21자이면 Step 2에 머물며 에러가 표시된다', async () => {
    const { user } = renderForm();
    const twentyOneChars = '가'.repeat(21);
    await fillStep2WithName(user, twentyOneChars);

    expect(await screen.findByText(/이름은 20자 이하이어야 합니다/)).toBeInTheDocument();
    // Must NOT have advanced to Step 3
    expect(screen.queryAllByRole('button', { name: '수정 →' })).toHaveLength(0);
  });

  test('수강 동기 정확히 300자이면 Step 3으로 진행한다', async () => {
    const { user } = renderForm();
    const threeHundredChars = 'a'.repeat(300);
    await fillStep2WithMotivation(user, threeHundredChars);

    const editButtons = await screen.findAllByRole('button', { name: '수정 →' });
    expect(editButtons.length).toBeGreaterThanOrEqual(1);

    expect(screen.queryByText(/300자 이하이어야 합니다/)).not.toBeInTheDocument();
  }, 10000);

  test('수강 동기 301자이면 Step 2에 머물며 에러가 표시된다', async () => {
    const { user } = renderForm();
    const threeHundredOneChars = 'a'.repeat(301);
    await fillStep2WithMotivation(user, threeHundredOneChars);

    expect(await screen.findByText(/300자 이하이어야 합니다/)).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: '수정 →' })).toHaveLength(0);
  }, 10000);
});
