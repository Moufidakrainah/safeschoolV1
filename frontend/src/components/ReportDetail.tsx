/**
 * ReportDetail — vue détail d'un signalement.
 *
 * Affiche toutes les informations d'un signalement sélectionné :
 * informations générales, personnes impliquées, description,
 * notes administratives et convocations.
 *
 * Extrait de AdminDashboard pour réduire sa taille.
 */

import { useTranslation } from 'react-i18next';
import { SEVERITY_COLORS, severityFromApiGrade } from '../utils/severity';
import { Button } from './ui/button';
import Badge, { type BadgeVariant } from './Badge';
import { Card } from './ui/card';
import NoteBlock from './NoteBlock';
import type { Report, Note } from '../types';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ReportDetail({
  selected, filtered, notes, isAdmin, saving,
  adminNote, setAdminNote,
  newNote, setNewNote,
  convocationDate, setConvocationDate,
  convocationMessage, setConvocationMessage,
  goTo, handleUpdateStatus, handleAddNote, onBack,
}: ReportDetailProps) {
  const { t } = useTranslation();

  const idx = filtered.findIndex(r => r.id === selected.id);
  const severityColor = SEVERITY_COLORS[severityFromApiGrade(selected.grade)];

  return (
    <div className="max-w-5xl mx-auto mt-8 px-5 pb-10">

      {/* Retour + navigation précédent / suivant */}
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => goTo(filtered[idx - 1])}
          disabled={idx === 0}
          aria-label={t('admin.prev')}
        >
          ← {t('admin.prev')}
        </Button>
        <span className="font-bold text-primary">
          {t('admin.reportLabel', { number: selected.caseNumber })}
        </span>
        <Button
          variant="ghost"
          onClick={() => goTo(filtered[idx + 1])}
          disabled={idx === filtered.length - 1}
          aria-label={t('admin.next')}
        >
          {t('admin.next')} →
        </Button>
      </div>

      {/* Statut + boutons d'action */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <Badge variant={selected.status as BadgeVariant} />
        <Button variant="ghost" onClick={onBack}>
          ← {t('common.back')}
        </Button>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap" role="group" aria-label={t('admin.actions.groupLabel')}>
            {([
              { status: 'in_progress', label: `🔄 ${t('admin.actions.inProgress')}`, variant: 'primary'  },
              { status: 'escalated',   label: `🚨 ${t('admin.actions.escalate')}`,   variant: 'warning'  },
              { status: 'closed',      label: `✅ ${t('admin.actions.close')}`,       variant: 'success'  },
              { status: 'rejected',    label: `❌ ${t('admin.actions.reject')}`,      variant: 'danger'   },
            ] as const).map(btn => (
              <Button
                key={btn.status}
                variant={btn.variant}
                disabled={saving}
                onClick={() => handleUpdateStatus(selected.id, btn.status)}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Informations + personnes impliquées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card style={{ borderLeft: `5px solid ${severityColor}` }} className="p-6 shadow-sm">
          <h3 className="text-primary text-sm font-bold mb-4">{t('admin.detail.info')}</h3>
          <div className="overflow-x-auto">
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
          </div>
        </Card>

        <Card>
          <h3 className="text-primary text-sm font-bold mb-4">{t('admin.detail.people')}</h3>
          <p className="text-xs text-gray-400 font-semibold mb-1">{t('admin.detail.reportedBy')}</p>
          <p className="text-sm text-gray-700 mb-4">
            {selected.isAnonymous
              ? t('admin.detail.anonymousLabel')
              : `${selected.student?.firstName} ${selected.student?.lastName}`}
            {selected.student?.role && (
              <span className="text-gray-400 text-xs ml-1">({selected.student.role})</span>
            )}
          </p>
          {selected.description?.includes('| Victime :') && (
            <>
              <p className="text-xs text-gray-400 font-semibold mb-1">{t('admin.detail.victim')}</p>
              <p className="text-sm text-gray-700 mb-4">
                {selected.description.split('| Victime :')[1]?.split('|')[0]?.trim()}
              </p>
            </>
          )}
          <p className="text-xs text-gray-400 font-semibold mb-2">{t('admin.detail.suspects')}</p>
          {selected.suspects?.length > 0 ? (
            <ul aria-label={t('admin.detail.suspects')} className="flex flex-col gap-1">
              {selected.suspects.map((s, i) => (
                <li key={i} className="bg-surface px-3 py-1 text-sm text-red-500">
                  {s.user ? `${s.user.firstName} ${s.user.lastName}` : s.freeText}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-300">{t('admin.detail.noSuspect')}</p>
          )}
        </Card>
      </div>

      {/* Description */}
      <Card style={{ borderLeft: `5px solid ${severityColor}` }} className="mb-6 p-6 shadow-sm">
        <h3 className="text-primary text-sm font-bold mb-3">{selected.aiReason}</h3>
        <p className="text-sm text-gray-700 leading-7">
          {selected.description?.split('|')[0]?.trim()}
        </p>
      </Card>

      {/* Notes administratives */}
      <Card style={{ borderLeft: `5px solid ${severityColor}` }} className="mb-6 p-6 shadow-sm">
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
            <Textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              rows={3}
              placeholder={t('admin.notes.placeholder')}
              aria-label={t('admin.notes.placeholder')}
              className="resize-y mb-3"
            />
            <Button onClick={() => handleAddNote('note')}>{t('admin.notes.save')}</Button>
          </>
        )}
      </Card>

      {/* Convocation */}
      {isAdmin && (
        <Card style={{ borderLeft: `5px solid ${severityColor}` }} className="p-6 shadow-sm">
          <h3 className="text-gray-800 text-sm font-bold mb-4">📅 {t('admin.convocation.title')}</h3>
          <div className="mb-4">
            <label className="block mb-1 text-xs font-semibold text-gray-500" htmlFor="convocation-date">
              {t('admin.convocation.dateLabel')}
            </label>
            <Input
              id="convocation-date"
              type="datetime-local"
              value={convocationDate}
              onChange={e => setConvocationDate(e.target.value)}
            />
          </div>
          <Textarea
            value={convocationMessage}
            onChange={e => setConvocationMessage(e.target.value)}
            rows={3}
            placeholder={t('admin.convocation.placeholder')}
            aria-label={t('admin.convocation.placeholder')}
            className="resize-y mb-3"
          />
          <Button onClick={() => handleAddNote('convocation')}>
            {t('admin.convocation.send')}
          </Button>
        </Card>
      )}

    </div>
  );
}
