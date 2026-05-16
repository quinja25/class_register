import { z } from 'zod';

export const step3Schema = z.object({
  agreedToTerms: z.literal(true, {
    error: '이용약관에 동의해주세요',
  }),
});

export type Step3Values = z.infer<typeof step3Schema>;
