import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SEVERITY_COLORS, severityFromApiGrade } from '../utils/severity';
import Button from './Button';
import Badge, { type BadgeVariant } from './Badge';
import Card from './Card';
import NoteBlock from './NoteBlock';
import { searchUsers, resolveSuspect } from '../services/api';
import type { Report, Note, ReportSuspect, UserSearchResult } from '../types';

interface ReportDetailProps {
  selected:             Report;
  filtered:             Report[];
  notes:                Note[];
  isAdmin:              boolean;
  saving:               boolean;
  adminNote:            string;
  setAdminNote:         (v: string) => void;
  newNote:              string;
  setNewNote:           (v: string) => void;
  convocationDate:      string;
  setConvocationDate:   (v: string) => void;
  convocationMessage:   string;
  setConvocationMessage:(v: string) => void;
  goTo:                 (report: Report | null) => void;
  handleUpdateStatus:   (id: string, status: string) => Promise<void>;
  handleAddNote:        (type?: string) => Promise<void>;
  onBack:               () => void;
  onSuspectResolved?:   () => void;
}

export default function ReportDetail({
  selected, filtered, notes, isAdmin, saving,
  adminNote, setAdminNote,
  newNote, setNewNote,
  convocationDate, setConvocationDate,
  convocationMessage, setConvocationMessage,
  goTo, handleUpdateStatus, handleAddNote, onBack,
  onSuspectResolved,
}: ReportDetailProps) {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [activeSuspect, setActiveSuspect] = useState<string | null>(null);
  const [resolving, setResolving]         = useState(false);

  const idx = filtered.findIndex(r => r.id === selected.id);
  const severityColor = SEVERITY_COLORS[severityFromApiGrade(selected.grade)];

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const results = await searchUsers(query);
      setSearchResults(results.filter((u: UserSearchResult) => u.role === 'student'));
    } catch { setSearchResults([]); }
  };

  const handleResolve = async (suspectId: string, userId: string | null) => {
    setResolving(true);
    try {
      await resolveSuspect(suspectId, userId);
      onSuspectResolved?.();
      setActiveSuspect(null);
      setSearchQuery('');
      setSearchResults([]);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 px-5 pb-10">

      {/* Navigation */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => goTo(filtered[idx - 1])} disabled={idx === 0}>
          ← {t('admin.prev')}
        </Button>
        <span className="font-bold text-primary">
          {t('admin.reportLabel', { number: selected.caseNumber })}
        </span>
        <Button variant="ghost" onClick={() => goTo(filtered[idx + 1])} disabled={idx === filtered.length - 1}>
          {t('admin.next')} →
        </Button>
      </div>

      {/* Statut + actions */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <Badge variant={selected.status as BadgeVariant} />
        <Button variant="ghost" onClick={onBack}>← {t('common.back')}</Button>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            {([
              { status: 'in_progress', label: `🔄 ${t('admin.actions.inProgress')}`, variant: 'primary'  },
              { status: 'closed',      label: `✅ ${t('admin.actions.close')}`,       variant: 'success'  },
              { status: 'rejected',    label: `❌ ${t('admin.actions.reject')}`,      variant: 'danger'   },
            ] as const).map(btn => (
              <Button key={btn.status} variant={btn.variant} disabled={saving}
                onClick={() => handleUpdateStatus(selected.id, btn.status)}>
                {btn.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Infos + personnes */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card borderColor={severityColor}>
          <h3 className="text-primary text-sm font-bold mb-4">{t('admin.detail.info')}</h3>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {([
                { label: t('admin.detail.titleField'), value: selected.title },
                { label: t('admin.detail.date'),       value: new Date(selected.createdAt).toLocaleDateString('fr-FR') },
                { label: t('admin.detail.class'),      value: selected.student?.studentProfile?.schoolClass ?? '-' },
                { label: t('admin.detail.aiScore'),    value: selected.aiScore ? `${selected.aiScore}/100` : '-' },
                { label: t('admin.detail.aiReason'),   value: selected.aiReason ?? '-' },
                { label: t('admin.detail.anonymous'),  value: selected.isAnonymous ? t('admin.detail.yes') : t('admin.detail.no') },
              ] as const).map(row => (
                <tr key={row.label} className="border-b border-gray-100">
                  <td className="py-2 text-gray-400 font-semibold w-2/5">{row.label}</td>
                  <td className="py-2 text-gray-700">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <h3 className="text-primary text-sm font-bold mb-4">{t('admin.detail.people')}</h3>

          {/* Signalé par */}
          <p className="text-xs text-gray-400 font-semibold mb-1">{t('admin.detail.reportedBy')}</p>
          <p className="text-sm text-gray-700 mb-4">
            {selected.isAnonymous
              ? t('admin.detail.anonymousLabel')
              : `${selected.student?.firstName} ${selected.student?.lastName}`}
            {selected.student?.role && (
              <span className="text-gray-400 text-xs ml-1">({selected.student.role})</span>
            )}
          </p>

          {/* Victime (cas témoin) */}
          {selected.description?.includes('| Victime :') && (
            <>
              <p className="text-xs text-gray-400 font-semibold mb-1">{t('admin.detail.victim')}</p>
              <p className="text-sm text-gray-700 mb-4">
                {selected.description.split('| Victime :')[1]?.split('|')[0]?.trim()}
              </p>
            </>
          )}

          {/* Suspects */}
          <p className="text-xs text-gray-400 font-semibold mb-2">{t('admin.detail.suspects')}</p>
          {selected.suspects?.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {selected.suspects.map((s: ReportSuspect) => (
                <li key={s.id} className="bg-surface rounded-lg px-3 py-2 text-sm">
                  {/* Nom saisi par l'élève */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-red-500 font-medium">{s.freeText}</span>
                    {isAdmin && (
                      <button
                        className="text-xs text-blue-500 hover:underline shrink-0"
                        onClick={() => setActiveSuspect(activeSuspect === s.id ? null : s.id)}
                      >
                        {s.resolvedUser ? '✏️ Modifier' : '🔗 Lier à un élève'}
                      </button>
                    )}
                  </div>

                  {/* Profil résolu */}
                  {s.resolvedUser && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-green-600">
                      <span>✅ Lié à :</span>
                      <span className="font-semibold">
                        {s.resolvedUser.firstName} {s.resolvedUser.lastName}
                      </span>
                      {isAdmin && (
                        <button
                          className="text-red-400 hover:underline ml-1"
                          onClick={() => handleResolve(s.id, null)}
                          disabled={resolving}
                        >
                          ✕ Délier
                        </button>
                      )}
                    </div>
                  )}

                  {/* Panneau de recherche */}
                  {isAdmin && activeSuspect === s.id && (
                    <div className="mt-2 border border-gray-200 rounded-lg p-2 bg-white">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Rechercher un élève..."
                        className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary mb-1"
                        autoFocus
                      />
                      {searchResults.length > 0 && (
                        <ul className="flex flex-col gap-0.5 max-h-32 overflow-y-auto">
                          {searchResults.map(u => (
                            <li key={u.id}>
                              <button
                                className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                                onClick={() => handleResolve(s.id, u.id)}
                                disabled={resolving}
                              >
                                {u.firstName} {u.lastName}
                                <span className="text-gray-400 ml-1">({u.role})</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {searchQuery.length >= 2 && searchResults.length === 0 && (
                        <p className="text-xs text-gray-400 px-2">Aucun élève trouvé</p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-300">{t('admin.detail.noSuspect')}</p>
          )}
        </Card>
      </div>

      {/* Description */}
      <Card borderColor={severityColor} className="mb-6">
        <h3 className="text-primary text-sm font-bold mb-3">{selected.aiReason}</h3>
        <p className="text-sm text-gray-700 leading-7">
          {selected.description?.split('|')[0]?.trim()}
        </p>
      </Card>

      {/* Notes */}
      <Card borderColor={severityColor} className="mb-6">
        <h3 className="text-primary text-sm font-bold mb-4">📝 {t('admin.notes.title')}</h3>
        {notes.length > 0 ? (
          <div className="flex flex-col gap-3 mb-5">
            {notes.map(note => <NoteBlock key={note.id} note={note} />)}
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-5">{t('admin.notes.empty')}</p>
        )}
        {isAdmin && (
          <>
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              rows={3}
              placeholder={t('admin.notes.placeholder')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-y mb-3 font-[inherit] box-border"
            />
            <Button onClick={() => handleAddNote('note')}>{t('admin.notes.save')}</Button>
          </>
        )}
      </Card>

      {/* Convocation */}
      {isAdmin && (
        <Card borderColor={severityColor}>
          <h3 className="text-gray-800 text-sm font-bold mb-4">📅 {t('admin.convocation.title')}</h3>
          <div className="mb-4">
            <label className="block mb-1 text-xs font-semibold text-gray-500" htmlFor="convocation-date">
              {t('admin.convocation.dateLabel')}
            </label>
            <input
              id="convocation-date"
              type="datetime-local"
              value={convocationDate}
              onChange={e => setConvocationDate(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-gray-700"
            />
          </div>
          <textarea
            value={convocationMessage}
            onChange={e => setConvocationMessage(e.target.value)}
            rows={3}
            placeholder={t('admin.convocation.placeholder')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-y mb-3 font-[inherit] box-border"
          />
          <Button onClick={() => handleAddNote('convocation')}>
            {t('admin.convocation.send')}
          </Button>
        </Card>
      )}
    </div>
  );
}