interface NoteBlockProps {
  note: any;
}

export default function NoteBlock({ note }: NoteBlockProps) {
  const isConvocation = note.type === 'convocation';
  return (
    <div style={{ borderLeft: `3px solid ${isConvocation ? '#7c3aed' : '#0097b2'}` }}
      className={`p-3 ${isConvocation ? 'bg-indigo-50' : 'bg-gray-50'}`}>
      <div className="flex justify-between mb-1">
        <span className={`text-xs font-semibold ${isConvocation ? 'text-purple-700' : 'text-[#0097b2]'}`}>
          {isConvocation ? '📅 Convocation' : '📝 Note'}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(note.createdAt).toLocaleDateString('fr-FR')} à {new Date(note.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          {note.author && ` — ${note.author.firstName} ${note.author.lastName}`}
        </span>
      </div>
      <p className="text-sm text-gray-700 m-0">{note.content}</p>
    </div>
  );
}