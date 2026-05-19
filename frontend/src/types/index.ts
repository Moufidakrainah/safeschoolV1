/* Definit report, user, note .., si on change lAPI o met ajour ici en premier */
export type UserRole = 'student' | 'admin' | 'director' | 'teacher' | 'staff';
export type ReportGrade  = 'critique' | 'grave' | 'moyen' | 'faible';
export type ReportStatus = 'pending' | 'in_progress' | 'closed' | 'rejected';
export type ReportType   = 'physique' | 'verbal' | 'cyber' | 'exclusion' | 'sexuel';
export type Reporter     = 'victime' | 'temoin';

export interface SchoolClass {
  id: string;
  level: string;    
  section: string;  
}

/* Utilisateur connecte (retourne par /auth/login) */
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

/* Utilisateur dans la liste admin */
export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  studentProfile?: { 
    schoolClass: SchoolClass | null 
  } | null;
}

/*Resultat de recherche utilisateur (autocomplete) */
export interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

/*Suspect dans un signalement */
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

/* Victime dans un signalement */
export interface ReportVictim {
  id: string;
  freeText: string;
  resolvedUser?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

/* Payload envoye a l API lors de la creation */
export interface SuspectInput {
  freeText: string;
}
export interface VictimInput {
  freeText: string;
}

/* Note administrative */
export interface Note {
  id: string;
  type: 'note' | 'convocation';
  content: string;
  createdAt: string;
  author?: { firstName: string; lastName: string };
}

/* Profil staff/enseignant */
export interface StaffProfile {
  id: string;
  profession: string;
  subject: string | null;
}

/* Parent d un eleve */
export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
}

/* Signalement */
export interface Report {
  id: string;
  caseNumber: string;
  type: ReportType;
  reporter: Reporter;
  description: string;
  status: ReportStatus
  grade: ReportGrade;
  isAnonymous: boolean;
  createdAt: string;
  aiScore?: number;
  aiReason?: string;
  adminNote?: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    studentProfile?: {
      schoolClass: SchoolClass | null;
    } | null;
  };
  suspects: ReportSuspect[];
  victims: ReportVictim[];
}