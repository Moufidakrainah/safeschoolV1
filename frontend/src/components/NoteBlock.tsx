import { useTranslation } from 'react-i18next';

interface NoteBlockProps {
  note: {
    id?: string;
    type: string;
    createdAt: string;
    content: string;
    author?: { firstName: string; lastName: string };
  };
}

export default function NoteBlock({ note }: NoteBlockProps) {
  const { t } = useTranslation();
  const isConvocation = note.type === 'convocation';
  return (
    <div
      style={{ borderLeft: `3px solid ${isConvocation ? 'var(--color-warning)' : 'var(--color-primary)'}` }}
      className={`p-3 m-3 ${isConvocation ? 'bg-indigo-50' : 'bg-gray-50'}`}
    >
      <div className="flex justify-between mb-1">
        <span className={`text-xs font-semibold ${isConvocation ? 'text-warning' : 'text-primary'}`}>
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
