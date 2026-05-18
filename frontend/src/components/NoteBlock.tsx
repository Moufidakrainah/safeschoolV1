import { useTranslation } from 'react-i18next';

// ============================================================
// NOTEBLOCK
//
// Affiche une note administrative ou une convocation dans la vue détail
// d'un signalement.
//
// Props :
//   note : objet note avec { type, createdAt, author?, content }
//          type : 'note' | 'convocation'
//
// Utilisation :
//   {notes.map((note) => <NoteBlock key={note.id} note={note} />)}
// ============================================================

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
      className={`p-3 ${isConvocation ? 'bg-indigo-50' : 'bg-gray-50'}`}
    >
      <div className="flex justify-between mb-1">
        <span className={`text-xs font-semibold ${isConvocation ? 'text-warning' : 'text-primary'}`}>
          {isConvocation ? t('noteblock.convocation') : t('noteblock.note')}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(note.createdAt).toLocaleDateString('fr-FR')} à{' '}
          {new Date(note.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          {note.author && ` — ${note.author.firstName} ${note.author.lastName}`}
        </span>
      </div>
      <p className="text-sm text-gray-700 m-0">{note.content}</p>
    </div>
  );
}
