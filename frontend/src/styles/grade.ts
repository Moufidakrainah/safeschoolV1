import { colors } from './colors';

export const GRADE_COLORS: Record<string, string> = {
  critique: colors.critique.light,
  grave:    colors.grave.main,
  moyen:    colors.moyen.main,
  faible:   colors.faible.main,
};

export const GRADE_LABELS: Record<string, string> = {
  critique: '🔴 Critique',
  grave:    '🟠 Grave',
  moyen:    '🟡 Moyen',
  faible:   '🟢 Faible',
};

export const STATUS_LABELS: Record<string, string> = {
  pending:     '⏳ En attente',
  in_progress: '🔄 En cours',
  escalated:   '🚨 Escaladé',
  closed:      '✅ Clôturé',
  rejected:    '❌ Rejeté',
};