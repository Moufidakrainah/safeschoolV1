import { colors } from './colors';

export const GRADE_COLORS: Record<string, string> = {
  critical: colors.critical.light,
  high:    colors.high.main,
  medium:    colors.medium.main,
  low:   colors.low.main,
};

export const GRADE_LABELS: Record<string, string> = {
  critical: '🔴 Critical',
  high:    '🟠 High',
  medium:    '🟡 Medium',
  low:   '🟢 Low',
};

export const STATUS_LABELS: Record<string, string> = {
    new:   	   	 '📄 Nouveau',
    in_progress: '📂 En cours',
    pending:     '⏳ En attente',
    resolved:    '✅ Resolu',
    false_report:'❌ Faux signalement',
};