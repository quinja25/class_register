export type CourseCategory =
  | 'development'
  | 'design'
  | 'marketing'
  | 'business';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory; // string type
  price: number;
  maxCapacity: number;
  currentEnrollment: number;
  startDate: string;  // ISO 8601
  endDate: string;    // ISO 8601
  instructor: string;
}

export interface CourseListResponse {
  courses: Course[];
  categories: string[];
}

export interface Participant {
  name: string;
  email: string;
}

export type EnrollmentType = 'personal' | 'group';

interface BaseEnrolleeInfo {
  name: string;
  email: string;
  phone: string;
  motivation?: string; // optional, 최대 300자
}

export interface IndividualEnrollment extends BaseEnrolleeInfo {
  type: 'personal';
}

export interface GroupEnrollment extends BaseEnrolleeInfo {
  type: 'group';
  organizationName: string;
  headCount: number;
  participants: Participant[];
  contactPerson: string;
}

export type EnrolleeInfo = IndividualEnrollment | GroupEnrollment;

export interface EnrollmentFormState {
  selectedCourse: Course | null;
  enrollmentType: EnrollmentType | null;
  enrolleeInfo: Partial<EnrolleeInfo>;
  agreedToTerms: boolean;
}

// API request shapes
export interface PersonalEnrollmentRequest {
  courseId: string;
  type: 'personal';
  applicant: BaseEnrolleeInfo;
  agreedToTerms: boolean;
}

export interface GroupEnrollmentRequest {
  courseId: string;
  type: 'group';
  applicant: BaseEnrolleeInfo;
  group: {
    organizationName: string;
    headCount: number;
    participants: Participant[];
    contactPerson: string;
  };
  agreedToTerms: boolean;
}

export type EnrollmentRequest = PersonalEnrollmentRequest | GroupEnrollmentRequest;

// API response shapes
export interface EnrollmentResponse {
  enrollmentId: string;
  status: 'confirmed' | 'pending';
  enrolledAt: string;
}

export type EnrollmentErrorCode =
  | 'COURSE_FULL'
  | 'DUPLICATE_ENROLLMENT'
  | 'INVALID_INPUT'
  | 'UNKNOWN_ERROR';

export interface EnrollmentApiError {
  code: EnrollmentErrorCode;
  message: string;
  details?: Record<string, string>;
}
