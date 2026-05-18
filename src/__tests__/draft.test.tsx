/**
 * draft.test.tsx
 *
 * Tests for localStorage draft persistence.
 *
 * Key constants from useFormPersistence.ts:
 *   STORAGE_KEY = 'enrollment_form_draft'
 *   DRAFT_VERSION = 1
 *
 * isValidDraft requires:
 *   - version === 1  (strict equality)
 *   - 'savedAt' in v (present as a key)
 *
 * The banner (DraftRestoreBanner) is rendered only when:
 *   hasDraft === true AND !state.step1
 *
 * restoreDraft: if draft.step2 exists → dispatches SET_STEP2 then GO_TO_STEP(3)
 * dismissDraft: calls clearDraft() (removes key) then setHasDraft(false)
 */
import { screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { courseHandlers } from '@/mocks/handlers/courseHandlers';
import { renderForm } from './test-utils';
import { mockCourses } from '@/mocks/data/courses';

const STORAGE_KEY = 'enrollment_form_draft';
const DRAFT_VERSION = 1;

/** Build a valid draft matching the DraftState shape. */
function buildDraft(overrides: Record<string, unknown> = {}) {
  const course = mockCourses[0]; // dev-001 — React 실전 개발
  return {
    version: DRAFT_VERSION,
    savedAt: new Date().toISOString(),
    step1: { selectedCourseId: course.id, enrollmentType: 'personal' },
    step2: {
      type: 'personal',
      name: '홍길동',
      email: 'hong@example.com',
      phone: '010-1234-5678',
    },
    selectedCourse: course,
    ...overrides,
  };
}

const server = setupServer(...courseHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => { server.resetHandlers(); localStorage.clear(); });
afterAll(() => server.close());

describe('임시 저장(draft) 복원', () => {
  test('유효한 draft가 있으면 배너가 표시된다', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildDraft()));
    renderForm();

    expect(await screen.findByText(/이전에 작성하던 신청서가 있습니다/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이어서 작성' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새로 시작' })).toBeInTheDocument();
  });

  test('"이어서 작성" 클릭 시 Step 3 요약 화면에 복원된 데이터가 표시된다', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildDraft()));
    const { user } = renderForm();

    await screen.findByText(/이전에 작성하던 신청서가 있습니다/);
    await user.click(screen.getByRole('button', { name: '이어서 작성' }));

    // restoreDraft dispatches GO_TO_STEP(3) when step2 is present
    // Step 3 SectionCard titles
    expect(await screen.findByText('선택 강의')).toBeInTheDocument();
    expect(screen.getByText('신청자 정보')).toBeInTheDocument();

    // Restored applicant data visible in summary
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('hong@example.com')).toBeInTheDocument();

    // Course title visible
    expect(screen.getByText('React 실전 개발')).toBeInTheDocument();
  });

  test('"새로 시작" 클릭 시 배너가 사라지고 localStorage가 지워지고 Step 1이 유지된다', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildDraft()));
    const { user } = renderForm();

    await screen.findByText(/이전에 작성하던 신청서가 있습니다/);
    await user.click(screen.getByRole('button', { name: '새로 시작' }));

    // Banner is gone
    expect(screen.queryByText(/이전에 작성하던 신청서가 있습니다/)).not.toBeInTheDocument();

    // localStorage key is cleared
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    // Still on Step 1 — course list eventually loads
    expect(await screen.findByText('React 실전 개발')).toBeInTheDocument();

    // No step2 data pre-filled (we are on step 1, not step 3)
    expect(screen.queryAllByRole('button', { name: '수정 →' })).toHaveLength(0);
  });

  test('version이 다른 draft(version: 999)는 배너를 표시하지 않는다', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(buildDraft({ version: 999 })),
    );
    renderForm();

    // Wait for the course list to load so we know the component mounted
    await screen.findByText('React 실전 개발');

    expect(screen.queryByText(/이전에 작성하던 신청서가 있습니다/)).not.toBeInTheDocument();

    // isValidDraft clears stale drafts — key should be removed
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test('localStorage에 잘못된 JSON이 있어도 앱이 크래시하지 않고 배너가 표시되지 않는다', async () => {
    localStorage.setItem(STORAGE_KEY, '{this is not valid json}}}');
    renderForm();

    await screen.findByText('React 실전 개발');

    expect(screen.queryByText(/이전에 작성하던 신청서가 있습니다/)).not.toBeInTheDocument();
  });

  test('savedAt 키가 없는 draft는 배너를 표시하지 않는다', async () => {
    // isValidDraft requires 'savedAt' in v
    const draftWithoutSavedAt = {
      version: DRAFT_VERSION,
      step1: { selectedCourseId: 'dev-001', enrollmentType: 'personal' },
      step2: null,
      selectedCourse: null,
      // no savedAt
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftWithoutSavedAt));
    renderForm();

    await screen.findByText('React 실전 개발');

    expect(screen.queryByText(/이전에 작성하던 신청서가 있습니다/)).not.toBeInTheDocument();
  });
});
