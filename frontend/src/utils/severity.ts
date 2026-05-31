export type ApiReportGrade = 'critical' | 'high' | 'medium' | 'low';
export type SeverityLevel = 'all'|'critical' | 'high' | 'medium' | 'low';

const API_GRADE_TO_SEVERITY: Record<ApiReportGrade, SeverityLevel> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

export const API_REPORT_GRADES: ApiReportGrade[] = ['critical', 'high', 'medium', 'low'];

export const API_GRADE_BADGE_LABELS: Record<ApiReportGrade, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  all:      'var(--color-all)',
  critical: 'var(--color-critical)',
  high:     'var(--color-high)',
  medium:   'var(--color-medium)',
  low:      'var(--color-low)',
};

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  all: 'all',
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

// export const SEVERITY_BADGES: Record<SeverityLevel, string> = {
//   critical: '🔴 Critical',
//   high: '🟠 High',
//   medium: '🟡 Medium',
//   low: '🟢 Low',
// };

function isApiReportGrade(value: string): value is ApiReportGrade {
  return Object.prototype.hasOwnProperty.call(API_GRADE_TO_SEVERITY, value);
}

export function severityFromApiGrade(grade: string | null | undefined): SeverityLevel {
  if (!grade || !isApiReportGrade(grade)) {
    return 'low';
  }
  return API_GRADE_TO_SEVERITY[grade];
}
