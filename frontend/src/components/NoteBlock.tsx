import { useTranslation } from 'react-i18next';

// Map labels FR statut backend → clés badge i18n
const STATUS_FR_TO_KEY: Record<string, string> = {
  'Nouveau':          'badge.new',
  'En cours':         'badge.in_progress',
  'En attente':       'badge.pending',
  'Résolu':           'badge.resolved',
  'Faux signalement': 'badge.false_report',
  'Clôturé':          'badge.closed',
  'Rejeté':           'badge.rejected',
};

interface NoteBlockProps {
  note: {
    id?: string;
    type: string;
    createdAt: string;
    content: string;
    author?: { firstName: string; lastName: string };
  };
  severityColor?: string;
}

export default function NoteBlock({ note, severityColor }: NoteBlockProps) {
  const { t } = useTranslation();

  const isConvocation  = note.type === 'convocation';
  const isStatusChange = note.type === 'status_change';
  const borderColor = severityColor ?? (isConvocation ? 'var(--color-warning)' : 'var(--color-primary)');

  // ── Traduire le contenu des notes de statut ──
  // Format backend : "Statut mis à jour : LABEL — DATE"
  const formatContent = (content: string): string => {
    if (!isStatusChange) return content;
    const match = content.match(/^Statut mis à jour : (.+) — (.+)$/);
    if (!match) return content;
    const [, labelFR, date] = match;
    const badgeKey = STATUS_FR_TO_KEY[labelFR.trim()];
    const translatedStatus = badgeKey ? t(badgeKey) : labelFR;
    return t('student.cases.statusUpdate', { status: translatedStatus, date });
  };

  // ── Traduire le contenu des convocations ──
  // Format backend : "Lina BOUGRINE est convoqué(e) le DATE\n\nMESSAGE"
  const formatConvocation = (content: string): string => {
    return content.replace(
      /^.+? est convoqué\(e\) le /,
      t('student.cases.summoned')
    );
  };

  const displayContent = isConvocation
    ? formatConvocation(note.content)
    : formatContent(note.content);

  // ── Label du type de note ──
  const typeLabel = isConvocation
    ? t('noteblock.convocation')
    : isStatusChange
    ? t('noteblock.statusChange')
    : t('noteblock.note');

  return (
    <div
      style={{ borderLeft: `3px solid ${borderColor}` }}
      className="p-3 m-3 bg-gray-50"
    >
      <div className="flex justify-between mb-1">
        <span className="text-xs font-semibold" style={{ color: borderColor }}>
          {typeLabel}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {note.author && ` - ${note.author.firstName} ${note.author.lastName?.toUpperCase()}`}
        </span>
      </div>
      <p className="text-sm text-gray-700 m-0 text-left whitespace-pre-line">{displayContent}</p>
    </div>
  );
}