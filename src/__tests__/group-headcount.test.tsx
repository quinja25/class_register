/**
 * group-headcount.test.tsx
 *
 * Tests that the participant row array tracks headCount precisely.
 *
 * Behaviour under test (Step2EnrolleeInfo useEffect):
 *   When headCount changes, the `fields` array (from useFieldArray) is
 *   grown with append() or shrunk with remove() to match the new count.
 *   Shrinking REMOVES the last rows — data in earlier rows is preserved.
 *
 * Bug this would catch:
 *   - Rows not removed when headCount decreases (stale extra rows)
 *   - Rows not added when headCount increases (missing input fields)
 *   - Old data leaking into newly-shown rows after resize
 */
import { screen, within } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { courseHandlers } from '@/mocks/handlers/courseHandlers';
import { renderForm, completeStep1Group } from './test-utils';

const server = setupServer(...courseHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => { server.resetHandlers(); localStorage.clear(); });
afterAll(() => server.close());

describe('단체 신청 — 인원수 변경 시 참가자 행 동기화', () => {
  async function setup() {
    const utils = renderForm();
    await completeStep1Group(utils.user);
    // Wait for group section to appear
    await screen.findByPlaceholderText('(주)회사명');
    return utils;
  }

  test('headCount를 2→4로 늘리면 참가자 행이 4개로 늘어난다', async () => {
    const { user } = await setup();

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '4');

    // useEffect is synchronous after state update in jsdom
    const nameInputs = await screen.findAllByPlaceholderText('이름');
    expect(nameInputs).toHaveLength(4);

    const emailInputs = screen.getAllByPlaceholderText('이메일');
    expect(emailInputs).toHaveLength(4);
  });

  test('headCount 4→2로 줄이면 참가자 행이 2개만 남는다', async () => {
    const { user } = await setup();

    const select = screen.getByRole('combobox');

    // Expand to 4 first
    await user.selectOptions(select, '4');
    expect(await screen.findAllByPlaceholderText('이름')).toHaveLength(4);

    // Fill all 4 rows so we can verify trimming
    const nameInputs = screen.getAllByPlaceholderText('이름');
    const emailInputs = screen.getAllByPlaceholderText('이메일');
    await user.type(nameInputs[0], '참가자일');
    await user.type(emailInputs[0], 'p1@example.com');
    await user.type(nameInputs[1], '참가자이');
    await user.type(emailInputs[1], 'p2@example.com');
    await user.type(nameInputs[2], '참가자삼');
    await user.type(emailInputs[2], 'p3@example.com');
    await user.type(nameInputs[3], '참가자사');
    await user.type(emailInputs[3], 'p4@example.com');

    // Shrink back to 2
    await user.selectOptions(select, '2');

    // Only 2 rows should remain
    const remainingNameInputs = await screen.findAllByPlaceholderText('이름');
    expect(remainingNameInputs).toHaveLength(2);

    const remainingEmailInputs = screen.getAllByPlaceholderText('이메일');
    expect(remainingEmailInputs).toHaveLength(2);

    // First two rows preserved
    expect(remainingNameInputs[0]).toHaveValue('참가자일');
    expect(remainingEmailInputs[0]).toHaveValue('p1@example.com');
    expect(remainingNameInputs[1]).toHaveValue('참가자이');
    expect(remainingEmailInputs[1]).toHaveValue('p2@example.com');
  });

  test('headCount 변경 후 줄어든 행에 입력했던 데이터는 DOM에 남아있지 않다', async () => {
    const { user } = await setup();

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '3');
    const nameInputs3 = await screen.findAllByPlaceholderText('이름');
    expect(nameInputs3).toHaveLength(3);

    // Fill the 3rd row
    await user.type(nameInputs3[2], '삭제될참가자');
    const emailInputs3 = screen.getAllByPlaceholderText('이메일');
    await user.type(emailInputs3[2], 'delete@example.com');

    // Shrink to 2 — row 3 should vanish entirely
    await user.selectOptions(select, '2');

    const remainingNames = await screen.findAllByPlaceholderText('이름');
    expect(remainingNames).toHaveLength(2);

    // The removed participant's data must not appear anywhere
    expect(screen.queryByDisplayValue('삭제될참가자')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('delete@example.com')).not.toBeInTheDocument();
  });

  test('headCount 2로 기본 상태에서 참가자 행이 정확히 2개다', async () => {
    await setup();

    // Default headCount is 2
    const nameInputs = screen.getAllByPlaceholderText('이름');
    expect(nameInputs).toHaveLength(2);

    const emailInputs = screen.getAllByPlaceholderText('이메일');
    expect(emailInputs).toHaveLength(2);
  });
});
