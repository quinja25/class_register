import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnrollmentForm } from '@/features/enrollment/components/EnrollmentForm';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export function renderForm() {
  const queryClient = makeQueryClient();
  const user = userEvent.setup();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <EnrollmentForm />
    </QueryClientProvider>
  );
  return { user, ...utils };
}

export async function completeStep1Individual(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText('React 실전 개발');
  await user.click(screen.getByRole('button', { name: /React 실전 개발/ }));
  await user.click(screen.getByRole('radio', { name: /개인 신청/ }));
  await user.click(screen.getByRole('button', { name: '다음' }));
}

export async function completeStep1Group(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText('React 실전 개발');
  await user.click(screen.getByRole('button', { name: /React 실전 개발/ }));
  await user.click(screen.getByRole('radio', { name: /단체 신청/ }));
  await user.click(screen.getByRole('button', { name: '다음' }));
}

export async function completeStep2Individual(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('홍길동'), '홍길동');
  await user.type(screen.getByPlaceholderText('example@email.com'), 'hong@example.com');
  await user.type(screen.getAllByPlaceholderText('010-1234-5678')[0], '010-1234-5678');
  await user.click(screen.getByRole('button', { name: '다음' }));
}

/**
 * Fills required group step-2 fields and advances to Step 3.
 * Default headCount is 2, so two participant rows are pre-rendered.
 */
export async function completeStep2Group(user: ReturnType<typeof userEvent.setup>) {
  // Common fields
  await user.type(screen.getByPlaceholderText('홍길동'), '홍길동');
  await user.type(screen.getByPlaceholderText('example@email.com'), 'rep@example.com');
  await user.type(screen.getAllByPlaceholderText('010-1234-5678')[0], '010-1234-5678');

  // Group-only fields
  await user.type(screen.getByPlaceholderText('(주)회사명'), '테스트 회사');
  // headCount stays at 2 (default) — two participant rows already rendered

  // Participant 1
  const nameInputs = screen.getAllByPlaceholderText('이름');
  const emailInputs = screen.getAllByPlaceholderText('이메일');
  await user.type(nameInputs[0], '참가자일');
  await user.type(emailInputs[0], 'p1@example.com');

  // Participant 2
  await user.type(nameInputs[1], '참가자이');
  await user.type(emailInputs[1], 'p2@example.com');

  // Contact person phone (second 010 field)
  await user.type(screen.getAllByPlaceholderText('010-1234-5678')[1], '010-9999-8888');

  await user.click(screen.getByRole('button', { name: '다음' }));
}
