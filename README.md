## 프로젝트 개요

온라인 교육 플랫폼의 수강 신청 흐름을 3단계 폼으로 구현한 프로젝트입니다.

- **Step 1**: 강의 선택 (카테고리 필터, 개인/단체 신청 유형 선택)
- **Step 2**: 수강생 정보 입력 (개인/단체 조건부 필드, 유효성 검증)
- **Step 3**: 확인 및 제출 (전체 내용 요약, 이용약관 동의, 제출 결과)

단계 간 데이터를 유지하고, 새로고침 후에도 입력 내용을 복구하며, 제출 실패 시 데이터를 보존하고 재시도할 수 있습니다.


## 기술 스택

| 분류 | 기술 | 선택 이유 |
|---|---|---|
| 프레임워크 | Next.js 15 (App Router) | 과제 권장 스택 |
| 언어 | TypeScript | 과제 필수 |
| 폼 상태 관리 | React Hook Form | 비제어 컴포넌트 기반으로 리렌더링 최소화, 스텝별 schema 분리 용이 |
| 유효성 검증 | Zod v4 | RHF와 zodResolver로 연동, discriminated union으로 개인/단체 타입 분리 |
| 서버 상태 | TanStack Query v5 | 과제 권장 스택, 제출 뮤테이션 상태 관리 |
| Mock API | MSW v2 | 브라우저/Node 환경 모두 지원, 테스트와 개발 환경 동일한 핸들러 재사용 |
| 테스트 | Vitest + React Testing Library | Next.js 15와 호환, jsdom 환경에서 실제 사용자 인터랙션 시뮬레이션 |
| 스타일 | Tailwind CSS v4 | 빠른 반응형 구현 |


## 실행 방법

```bash
npm install
npm run dev       # 개발 서버 (http://localhost:3000)
npm test          # 테스트 실행 (48개)
npm run build     # 프로덕션 빌드
```

### Mock API 구성

MSW(Mock Service Worker)를 사용합니다. 별도 서버 실행 없이 브라우저와 테스트 환경에서 자동으로 동작합니다.

- **브라우저**: `src/app/layout.tsx`에서 개발 환경일 때 MSW 서비스 워커를 자동 등록
- **테스트**: 각 테스트 파일에서 `msw/node`의 `setupServer`로 인터셉트

Mock 데이터 위치:
```
src/mocks/
├── handlers/
│   ├── courseHandlers.ts       # GET /api/courses
│   └── enrollmentHandlers.ts  # POST /api/enrollments
└── data/
    └── courses.ts              # 12개 강의 (개발/디자인/마케팅/비즈니스)
```

지원하는 에러 시나리오 (POST /api/enrollments):
- `COURSE_FULL` (409): 정원 마감 강의 신청 시
- `DUPLICATE_ENROLLMENT` (409): 이미 신청한 강의 재신청 시
- 500: 서버 오류 (비JSON 응답 포함)


## 요구사항 해석 및 가정

**단체 신청 인원수 해석**

"신청 인원수 (2~10명)"를 참가자 명단 인원으로 해석했습니다. 대표 신청자는 별도이므로 실제 총 인원은 `headCount + 1`명입니다. 확인 화면에 "총 신청 인원: N명 (대표자 포함)"으로 표시합니다.

**개인→단체 전환 시 데이터 처리**

단체 신청으로 필드를 채운 후 개인으로 전환하면 단체 관련 데이터(단체명, 참가자 명단, 담당자 연락처)를 즉시 초기화합니다. 전환 전 확인 다이얼로그를 표시하여 의도치 않은 데이터 손실을 방지합니다.

**참가자 이메일 중복 처리**

참가자 이메일이 대표 신청자 이메일과 동일하면 Zod superRefine으로 제출을 차단합니다. 명단 내 참가자 간 이메일 중복은 허용합니다(동명이인 등 실제 케이스 고려).

**정원 마감 강의 UX**

`currentEnrollment >= maxCapacity`인 강의는 선택 버튼을 비활성화합니다. 단체 신청 시 남은 좌석이 headCount 상한을 제한합니다(`maxHeadCount = Math.min(10, remaining - 1)`).


## 설계 결정과 이유

**폼 상태 관리: useReducer + Context**

스텝 간 데이터 공유를 위해 `EnrollmentFormContext`에 `useReducer`를 사용했습니다. 각 스텝은 독립적인 `useForm` 인스턴스를 가지며, 스텝 전환 시 해당 스텝 데이터를 Context에 저장합니다. 전역 상태 라이브러리 없이도 스텝 간 데이터 흐름이 명확하게 추적됩니다.

**유효성 검증 전략**

- 스텝 전환 시 해당 스텝 전체 검증 (`handleSubmit`)
- 필드 blur 시 개별 검증 (`trigger('fieldName')`)
- 스텝별 Zod schema 분리 (`step1Schema.ts`, `step2Schema.ts`)
- 개인/단체 타입은 `z.discriminatedUnion`으로 분리하여 타입 안전성 보장

**조건부 필드: discriminated union**

```ts
z.discriminatedUnion('type', [personalSchema, groupSchema])
```

`type: 'personal' | 'group'`으로 TypeScript가 각 경우의 필드를 정확히 추론합니다. 타입 전환 시 관련 필드를 명시적으로 초기화하여 stale data가 남지 않습니다.

**임시 저장: localStorage**

`useFormPersistence` 훅에서 폼 상태를 debounce 없이 스텝 전환마다 저장합니다. `version` 필드로 스키마 변경 시 구버전 draft를 자동 폐기합니다. 제출 성공 시 draft를 즉시 삭제합니다.


## 미구현 / 제약사항

**이탈 방지 (브라우저 뒤로가기/닫기)**

`beforeunload` 이벤트로 구현 가능하나 Next.js App Router에서 `router.push`에 의한 소프트 네비게이션에는 별도 처리가 필요합니다. 시간 제약으로 미구현했습니다.

**이메일 인증**

이메일 형식 검증만 구현했습니다. 실제 Google OAuth 등 외부 인증은 범위 외로 판단했습니다.

**서버사이드 유효성 검증**

Mock API는 클라이언트 검증을 통과한 요청만 받는다고 가정했습니다. 실제 서버에서의 재검증 로직은 구현하지 않았습니다.


## AI 활용 범위

Claude Code (claude-sonnet-4-6)를 사용했습니다.

**활용 내역**
- 컴포넌트 구조 설계 및 초기 구현 (EnrollmentForm, Step 컴포넌트)
- Zod v4 discriminated union + superRefine 적용
- MSW v2 핸들러 작성
- 모바일 반응형 Tailwind 클래스 적용
- 테스트 코드 작성 (Vitest + RTL + MSW, 48개)
- 코드 리뷰 및 리팩토링 (비JSON 에러 처리, format 유틸 분리, dead state 제거)

**직접 작성한 부분**
- 요구사항 분석 및 설계 방향 결정
- 각 구현 단계에서의 검토 및 승인
- 커밋 구성 및 Git 관리
