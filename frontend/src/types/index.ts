export type UserRole = 'student' | 'admin' | 'director' | 'teacher' | 'staff';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  studentProfile?: {
    id: string;
    schoolClass: { id: string; level: string; section: string } | null;
    dateOfBirth: string;
  } | null;
  staffProfile?: {
    id: string;
    role: string;
    subject: string;
  } | null;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  studentProfile?: { schoolClass: { id: string; level: string; section: string } | null } | null;
}

export interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface ReportSuspect {
  id: string;
  freeText: string;
  resolvedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
}

export interface SuspectInput {
  freeText: string;
}

export interface Note {
  id: string;
  type: 'note' | 'convocation';
  content: string;
  createdAt: string;
  author?: { firstName: string; lastName: string };
}

export interface StaffProfile {
  id: string;
  profession: string;
  subject: string | null;
}

export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
}

export interface Report {
  id: string;
  caseNumber: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'escalated' | 'closed' | 'rejected';
  grade: string;
  isAnonymous: boolean;
  createdAt: string;
  aiScore?: number;
  aiReason?: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    studentProfile?: { schoolClass: { id: string; level: string; section: string } | null } | null;
  };
  suspects: ReportSuspect[];
}
