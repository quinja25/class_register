API 스키마
아래는 Mock 구현을 위한 API 명세입니다. 이 스키마를 기반으로 Mock 환경을 직접 구성해 주세요.

강의 목록 조회
GET /api/courses?category={category}
interface Course {
  id: string;
  title: string;
  description: string;
  category: string;       // "development" | "design" | "marketing" | "business"
  price: number;
  maxCapacity: number;
  currentEnrollment: number;
  startDate: string;      // ISO 8601
  endDate: string;        // ISO 8601
  instructor: string;
}

interface CourseListResponse {
  courses: Course[];
  categories: string[];
}
수강 신청 제출
POST /api/enrollments
// 개인 신청
interface PersonalEnrollmentRequest {
  courseId: string;
  type: "personal";
  applicant: {
    name: string;
    email: string;
    phone: string;
    motivation?: string;
  };
  agreedToTerms: boolean;
}

// 단체 신청
interface GroupEnrollmentRequest {
  courseId: string;
  type: "group";
  applicant: {
    name: string;
    email: string;
    phone: string;
    motivation?: string;
  };
  group: {
    organizationName: string;
    headCount: number;
    participants: Array<{ name: string; email: string }>;
    contactPerson: string;
  };
  agreedToTerms: boolean;
}

interface EnrollmentResponse {
  enrollmentId: string;
  status: "confirmed" | "pending";
  enrolledAt: string;
}
에러 응답
interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string>;  // 필드별 에러 (서버 측 유효성 검증)
}
주요 에러 코드:

COURSE_FULL — 정원 초과
DUPLICATE_ENROLLMENT — 이미 신청된 강의
INVALID_INPUT — 입력값 오류 (details에 필드별 메시지)