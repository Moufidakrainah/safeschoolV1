import { useTranslation } from 'react-i18next';
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
  const isConvocation = note.type === 'convocation';
  const borderColor = severityColor ?? (isConvocation ? 'var(--color-warning)' : 'var(--color-primary)');
  return (
    <div
      style={{ borderLeft: `3px solid ${borderColor}` }}
      className="p-3 m-3 bg-gray-50"
    >
      <div className="flex justify-between mb-1">
        <span className="text-xs font-semibold" style={{ color: borderColor }}>
          {isConvocation ? t('noteblock.convocation') : ''}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(note.createdAt).toLocaleDateString('fr-FR')} à{' '}
          {new Date(note.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          {note.author && ` — ${note.author.firstName} ${note.author.lastName}`}
        </span>
      </div>
      <p className="text-sm text-gray-700 m-0 text-left">{note.content}</p>
    </div>
  );
}
