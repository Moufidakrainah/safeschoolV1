/* Definit report, user, note .., si on change lAPI on met a jour ici en premier */
export type UserRole = "student" | "admin" | "teacher";
export type ReportGrade = "critical" | "high" | "medium" | "low";
export type ReportStatus =
  | "new"
  | "pending"
  | "in_progress"
  | "resolved"
  | "false_report";
export type ReportType =
  | "physique"
  | "verbal"
  | "cyber"
  | "exclusion"
  | "sexuel";
export type Reporter = "victime" | "temoin";
export type BadgeVariant =
  | "all"
  | "new"
  | "new_red"
  | "in_progress"
  | "pending"
  | "resolved"
  | "false_report";
export type LanguageCode = "fr" | "en" | "de";

export interface SchoolClass {
  id: string;
  level: string;
  section: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string | null;
  studentProfile?: {
    id: string;
    schoolClass: SchoolClass | null;
    dateOfBirth: string;
  } | null;
  staffProfile?: {
    id: string;
    profession: string;
    subject: string | null;
  } | null;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  createdAt: string;
  studentProfile?: {
    id?: string;
    schoolClass: SchoolClass | null;
    dateOfBirth?: string;
  } | null;
  staffProfile?: {
    id?: string;
    profession?: string;
    subject?: string | null;
    classes?: SchoolClass[];
  } | null;
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
    avatar?: string | null;
    studentProfile?: {
      schoolClass?: { id: string; level: string; section: string } | null;
    } | null;
  } | null;
}

export interface ReportVictim {
  id: string;
  freeText: string;
  resolvedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    studentProfile?: {
      schoolClass?: { id: string; level: string; section: string } | null;
    } | null;
  } | null;
}

export interface SuspectInput {
  freeText: string;
}
export interface VictimInput {
  freeText: string;
}

export interface Note {
  id: string;
  type: "note" | "convocation" | "status_change";
  content: string;
  createdAt: string;
  message?: string;
  isRead?: boolean;
  author?: { firstName: string; lastName: string };
  report?: { id: string; caseNumber: string };
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
  phone?: string | null;
  address?: string | null;
}

export interface Report {
  id: string;
  caseNumber: string;
  type: ReportType;
  reporter: Reporter;
  description: string;
  status: ReportStatus;
  grade: ReportGrade;
  isAnonymous: boolean;
  createdAt: string;
  aiScore?: number;
  aiReason?: string;
  adminNote?: string;
  frequency?: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatar?: string | null;
    studentProfile?: {
      schoolClass: SchoolClass | null;
    } | null;
  };
  suspects: ReportSuspect[];
  victims: ReportVictim[];
}
