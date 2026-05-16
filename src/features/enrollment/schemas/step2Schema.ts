import { z } from 'zod';

const koreanPhoneRegex = /^01[016789]-?\d{3,4}-?\d{4}$/; //다양한 한국 전화번호 형식 허용 (010-1234-5678, 01012345678, 010-123-4567 등)

const baseInfoSchema = z.object({
  name: z
    .string()
    .min(2, '이름은 2자 이상이어야 합니다')
    .max(20, '이름은 20자 이하이어야 합니다'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  phone: z
    .string()
    .regex(koreanPhoneRegex, '올바른 한국 전화번호 형식이 아닙니다 (예: 010-1234-5678)'),
  motivation: z
    .string()
    .max(300, '수강 동기는 300자 이하이어야 합니다')
    .optional(),
});

const personalSchema = baseInfoSchema.extend({
  type: z.literal('personal'),
});

const groupSchema = baseInfoSchema.extend({
  type: z.literal('group'),
  organizationName: z.string().min(1, '단체명을 입력해주세요'),
  headCount: z
    .number({ error: '인원수를 입력해주세요' })
    .int()
    .min(2, '최소 2명 이상이어야 합니다')
    .max(10, '최대 10명까지 신청 가능합니다'),
  participants: z
    .array(
      z.object({
        name: z.string().min(1, '참가자 이름을 입력해주세요'),
        email: z.string().email('올바른 이메일 형식이 아닙니다'),
      })
    )
    .superRefine((participants, ctx) => {
      const seen = new Set<string>();
      participants.forEach((p, i) => {
        const email = p.email.toLowerCase();
        if (seen.has(email)) {
          ctx.addIssue({
            code: 'custom',
            path: [i, 'email'],
            message: '이미 입력된 이메일입니다',
          });
        }
        seen.add(email);
      });
    }),
  contactPerson: z
    .string()
    .regex(koreanPhoneRegex, '올바른 한국 전화번호 형식이 아닙니다 (예: 010-1234-5678)'),
});

export const step2Schema = z.discriminatedUnion('type', [
  personalSchema,
  groupSchema,
]);

export type Step2Values = z.infer<typeof step2Schema>;
export type PersonalStep2Values = z.infer<typeof personalSchema>;
export type GroupStep2Values = z.infer<typeof groupSchema>;
