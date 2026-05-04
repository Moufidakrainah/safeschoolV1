// ─── Types partagés du frontend ───────────────────────────────────────────────
// Ces types correspondent aux données renvoyées par l'API backend.
// Ils doivent être utilisés dans toutes les pages et composants à la place de `any`.

// ─── Utilisateur (repris depuis AuthContext pour éviter la duplication) ───────
export type UserRole = 'student' | 'admin' | 'director' | 'teacher' | 'staff';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  studentProfile?: {
    id: string;
    schoolClass: string;
    dateOfBirth: string;
  } | null;  
  staffProfile?: {
    id: string;
    role: string;
    subject: string;
  } | null;
}

// ─── Utilisateur dans les listes admin ───────────────────────────────────────
export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  studentProfile?: { schoolClass: string } | null;
}

// ─── Résultat de recherche d'utilisateur (autocomplete) ──────────────────────
export interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// ─── Suspect dans un signalement ─────────────────────────────────────────────
export interface ReportSuspect {
  id?: string;
  user?: { firstName: string; lastName: string };
  freeText?: string;
}

// ─── Payload envoyé à l'API lors de la création d'un signalement ─────────────
export interface SuspectInput {
  userId?: string;
  freeText?: string;
}

// ─── Note administrative ──────────────────────────────────────────────────────
export interface Note {
  id: string;
  type: 'note' | 'convocation';
  content: string;
  createdAt: string;
  author?: { firstName: string; lastName: string };
}

// ─── Signalement ─────────────────────────────────────────────────────────────
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
    studentProfile?: { schoolClass: string } | null;
  };
  suspects: ReportSuspect[];
}
