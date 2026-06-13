
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import NoteBlock from '@/components/NoteBlock';
import ConvocationSelector from '@/components/ConvocationSelector';
import { SEVERITY_COLORS, severityFromApiGrade } from '@/utils/severity';
import type { Report, Note } from '@/types';
import { API_BASE } from '@/config';

const AVATAR_BASE = `${API_BASE}/uploads/avatars`;

interface ReportDetailProps {
  selected: Report;
  filtered: Report[];
  notes: Note[];
  isAdmin: boolean;
  _saving: boolean;
  resolving: boolean;
  checkedConvocIds: string[];
  convocDetails: Record<string, { date: string; message: string }>;
  sendingConvoc: boolean;
  convocSuccess: boolean;
  newNote: string;
  activeSuspect: string | null;
  suspectSearch: string;
  suspectResults: any[];
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onUpdateStatus: (status: string, label: string) => void;
  onAddNote: (type?: string) => void;
  onSendConvocations: () => void;
  onResolveSuspect: (suspectId: string, userId: string | null) => void;
  onResolveVictim: (victimId: string, userId: string | null) => void;
  onSetActiveSuspect: (id: string | null) => void;
  onSuspectSearch: (q: string) => void;
  onSetNewNote: (v: string) => void;
  onToggleConvoc: (id: string) => void;
  onSetConvocDetails: (fn: (prev: any) => any) => void;
  onSetSendingConvoc: (v: boolean) => void;
  onSetConvocSuccess: (v: boolean) => void;
  onSetSuspectSearch: (v: string) => void;
  onSetSuspectResults: (v: any[]) => void;
  onAddNoteRaw: (reportId: string, content: string, type: string, personId?: string) => Promise<void>;
  onLoadNotes: (reportId: string) => void;
  onNavigateToUser: (userId: string) => void;
}

export default function ReportDetail({
  selected, filtered, notes, isAdmin, _saving, resolving,
  checkedConvocIds, convocDetails, sendingConvoc, convocSuccess,
  newNote, activeSuspect, suspectSearch, suspectResults,
  onBack, onPrev, onNext, onUpdateStatus, onAddNote, onResolveSuspect, onResolveVictim,
  onSetActiveSuspect, onSuspectSearch, onSetNewNote, onToggleConvoc, onSetConvocDetails,
  onSetSendingConvoc, onSetConvocSuccess, onSetSuspectSearch, onSetSuspectResults,
  onAddNoteRaw, onLoadNotes, onNavigateToUser,
}: ReportDetailProps) {
  const { t } = useTranslation();
  const idx = filtered.findIndex(r => r.id === selected.id);
  const severity = severityFromApiGrade(selected.grade);
  const severityColor = SEVERITY_COLORS[severity];

  // ── Victime principale ──
  // Trier les victims : alerteur (resolvedUser.id === student.id) en premier
  const sortedVictims = selected.victims
    ? [...selected.victims].sort((a, b) => {
        if (a.resolvedUser?.id === selected.student?.id) return -1;
        if (b.resolvedUser?.id === selected.student?.id) return 1;
        return 0;
      })
    : [];

  const mainVictim = selected.reporter === 'victime'
    ? selected.student
    : sortedVictims?.[0]?.resolvedUser ?? null;

  const mainVictimFreeText = selected.reporter === 'temoin'
    ? selected.victims?.[0]?.freeText
    : undefined;

  const mainVictimClass = selected.reporter === 'victime'
    ? selected.student?.studentProfile?.schoolClass
    : selected.victims?.[0]?.resolvedUser?.studentProfile?.schoolClass;

  // id de la victime principale (pour le système de résolution)
  const mainVictimId = selected.victims?.[0]?.id;

  return (
    <div className="max-w-5xl mx-auto mt-8 px-5 pb-10">

      {/* ── Titre ── */}
      <h1 className="text-2xl font-black text-primary text-center mb-4">
        Signalement {selected.caseNumber}
      </h1>

      {/* ── Navigation ── */}
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={onBack}>← Revenir à tous les signalements</Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onPrev} disabled={idx === 0}>← {t('admin.prev')}</Button>
          <Button variant="ghost" onClick={onNext} disabled={idx === filtered.length - 1}>{t('admin.next')} →</Button>
        </div>
      </div>

      {/* ── Statut + modifier ── */}
      <div className="bg-surface shadow-sm flex items-center justify-between mb-3 px-5 py-3"
        style={{ borderLeft: `5px solid ${severityColor}` }}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 font-semibold">Statut du signalement :</span>
          <Badge variant={selected.status as BadgeVariant} />
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-semibold">Modifier le statut :</span>
            <Select value={selected.status} onValueChange={v => onUpdateStatus(v, t(`badge.${v}`))}>
              <SelectTrigger className="w-auto">
                <Badge variant={selected.status as BadgeVariant} />
              </SelectTrigger>
              <SelectContent>
                {(['new','in_progress','pending','resolved','false_report'] as BadgeVariant[]).map(s => (
                  <SelectItem key={s} value={s}><Badge variant={s} /></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* ── Victime principale ── */}
      <div className="bg-surface shadow-sm px-6 py-4 mb-3"
        style={{ borderLeft: `5px solid ${severityColor}` }}>
        <p className="text-sm font-semibold text-gray-700 mb-3">Victime</p>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {mainVictim?.avatar
            ? <img src={`${AVATAR_BASE}/${mainVictim.avatar}`} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 flex-shrink-0" />
            : <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-base font-bold text-gray-500 flex-shrink-0">
                {mainVictim ? `${mainVictim.firstName?.[0]}${mainVictim.lastName?.[0]}` : '?'}
              </div>
          }

          <div className="flex-1">
            {/* Nom (texte libre ou nom résolu) */}
            <p className={`font-semibold text-gray-800 ${mainVictim?.id ? 'cursor-pointer hover:text-primary' : ''}`}
              onClick={() => mainVictim?.id && onNavigateToUser(mainVictim.id)}>
              {mainVictimFreeText ?? (mainVictim ? `${mainVictim.firstName} ${mainVictim.lastName}` : 'Non identifié')}
            </p>

            {/* Classe de la victime */}
            {mainVictimClass && (
              <p className="text-xs text-primary">{mainVictimClass.level} {mainVictimClass.section}</p>
            )}

            {/* Cas reporter = 'temoin' : affiche résolution comme les suspects */}
            {selected.reporter === 'temoin' && mainVictimId && (
              <div className="mt-1">
                {/* Victime résolue → affiche nom + délier */}
                {selected.victims?.[0]?.resolvedUser && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    {selected.victims[0].resolvedUser.firstName} {selected.victims[0].resolvedUser.lastName}
                    {selected.victims[0].resolvedUser.studentProfile?.schoolClass && (
                      <span className="text-primary ml-1">
                        {selected.victims[0].resolvedUser.studentProfile.schoolClass.level} {selected.victims[0].resolvedUser.studentProfile.schoolClass.section}
                      </span>
                    )}
                    {isAdmin && (
                      <button className="text-red-400 hover:underline ml-2"
                        onClick={() => onResolveVictim(mainVictimId, null)}
                        disabled={resolving}>
                        ✕ Délier
                      </button>
                    )}
                  </div>
                )}

                {/* Victime non résolue → "Identité non liée" */}
                {!selected.victims?.[0]?.resolvedUser && (
                  <p className="text-xs text-gray-400 italic">Identité non liée</p>
                )}

                {/* Bouton Lier / Modifier */}
                {isAdmin && (
                  <button className="text-xs text-blue-500 hover:underline mt-1"
                    onClick={() => { onSetActiveSuspect(activeSuspect === mainVictimId ? null : mainVictimId); onSetSuspectSearch(''); onSetSuspectResults([]); }}>
                    {selected.victims?.[0]?.resolvedUser ? 'Modifier' : ' Lier'}
                  </button>
                )}

                {/* Formulaire de recherche */}
                {isAdmin && activeSuspect === mainVictimId && (
                  <div className="mt-2 border rounded-lg p-2 bg-gray-50 w-full">
                    <input type="text" value={suspectSearch} onChange={e => onSuspectSearch(e.target.value)}
                      placeholder="Rechercher un élève..." autoFocus
                      className="w-full px-3 py-1.5 border rounded text-xs focus:outline-none mb-1" />
                    {suspectResults.map((u: any) => (
                      <button key={u.id} className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                        onClick={() => onResolveVictim(mainVictimId, u.id)} disabled={resolving}>
                        {u.firstName} {u.lastName} <span className="text-gray-400">({u.role})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Autres victimes (à partir de l'index 1) ── */}
        {sortedVictims && sortedVictims.length > 1 && (
          <div className="mt-3 flex flex-col gap-2">
            {sortedVictims.slice(1).map((v) => (
              <div key={v.id} className="flex items-start gap-3 text-sm">
                <div className="flex items-center gap-2 flex-1">
                  {v.resolvedUser?.avatar
                    ? <img src={`${AVATAR_BASE}/${v.resolvedUser.avatar}`} alt="" className="w-8 h-8 rounded-full object-cover" />
                    : <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">?</div>
                  }
                  <div className="flex-1">
                    <span className="text-gray-800 font-medium">{v.freeText}</span>
                    {v.resolvedUser && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        → {v.resolvedUser.firstName} {v.resolvedUser.lastName}
                        {isAdmin && (
                          <button className="text-red-400 hover:underline ml-2"
                            onClick={() => onResolveVictim(v.id, null)} disabled={resolving}>
                            ✕ Délier
                          </button>
                        )}
                      </div>
                    )}
                    {!v.resolvedUser && <p className="text-xs text-gray-400 italic">Identité non liée</p>}
                    {isAdmin && !v.resolvedUser && (
                      <button className="text-xs text-blue-500 hover:underline mt-1"
                        onClick={() => { onSetActiveSuspect(activeSuspect === v.id ? null : v.id); onSetSuspectSearch(''); onSetSuspectResults([]); }}>
                        🔗 Lier
                      </button>
                    )}
                    {isAdmin && activeSuspect === v.id && (
                      <div className="mt-2 border rounded-lg p-2 bg-gray-50 w-full">
                        <input type="text" value={suspectSearch} onChange={e => onSuspectSearch(e.target.value)}
                          placeholder="Rechercher un élève..." autoFocus
                          className="w-full px-3 py-1.5 border rounded text-xs focus:outline-none mb-1" />
                        {suspectResults.map((u: any) => (
                          <button key={u.id} className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                            onClick={() => onResolveVictim(v.id, u.id)} disabled={resolving}>
                            {u.firstName} {u.lastName} <span className="text-gray-400">({u.role})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Signalement ── */}
      <div className="bg-surface shadow-sm px-6 py-4 mb-3"
        style={{ borderLeft: `5px solid ${severityColor}` }}>
        <p className="text-sm font-semibold text-gray-700 mb-3">Signalement</p>
        <div className="flex flex-wrap gap-4 text-sm mb-4">
          <div><span className="text-muted-foreground font-semibold">Date : </span>{new Date(selected.createdAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
          <div><span className="text-muted-foreground font-semibold">Type : </span><span className="capitalize">{selected.type}</span></div>
          <div><span className="text-muted-foreground font-semibold">Score IA : </span>{selected.aiScore ? `${selected.aiScore}/100` : '-'}</div>
        </div>
        <p className="text-sm text-gray-700 leading-7 mb-4">{selected.description}</p>
        {selected.aiReason && (
          <div className="bg-gray-100 rounded-lg px-4 py-3 text-xs text-gray-500 italic">
            Analyse IA : {selected.aiReason}
          </div>
        )}
      </div>

      {/* ── Suspects + Alerteur ── */}
      <div className="bg-surface shadow-sm px-6 py-4 mb-3"
        style={{ borderLeft: `5px solid ${severityColor}` }}>
        <p className="text-sm font-semibold text-gray-700 mb-3">Personnes impliquées</p>
        <div className="grid grid-cols-2 gap-6">

          {/* Suspects */}
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-3">Suspect(s)</p>
            {selected.suspects?.length > 0 ? (
              <div className="flex flex-col gap-3">
                {selected.suspects.map((s) => (
                  <div key={s.id} className="flex items-start gap-3">
                    {s.resolvedUser?.avatar
                      ? <img src={`${AVATAR_BASE}/${s.resolvedUser.avatar}`} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                      : <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-500">
                          {s.resolvedUser ? `${s.resolvedUser.firstName?.[0]}${s.resolvedUser.lastName?.[0]}` : '?'}
                        </div>
                    }
                    <div className="flex-1">
                      <p className={`text-sm font-medium text-gray-800 ${s.resolvedUser?.id ? 'cursor-pointer hover:underline' : ''}`}
                        onClick={() => s.resolvedUser?.id && onNavigateToUser(s.resolvedUser.id)}>
                        {s.freeText}
                      </p>
                      {s.resolvedUser && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          {s.resolvedUser.firstName} {s.resolvedUser.lastName}
                          {s.resolvedUser.studentProfile?.schoolClass && (
                            <span className="text-primary ml-1">
                              {s.resolvedUser.studentProfile.schoolClass.level} {s.resolvedUser.studentProfile.schoolClass.section}
                            </span>
                          )}
                          {isAdmin && <button className="text-red-400 hover:underline ml-2" onClick={() => onResolveSuspect(s.id, null)} disabled={resolving}>✕ Délier</button>}
                        </div>
                      )}
                      {isAdmin && (
                        <button className="text-xs text-blue-500 hover:underline mt-1"
                          onClick={() => { onSetActiveSuspect(activeSuspect === s.id ? null : s.id); onSetSuspectSearch(''); onSetSuspectResults([]); }}>
                          {s.resolvedUser ? 'Modifier' : 'Lier'}
                        </button>
                      )}
                      {isAdmin && activeSuspect === s.id && (
                        <div className="mt-2 border rounded-lg p-2 bg-gray-50">
                          <input type="text" value={suspectSearch} onChange={e => onSuspectSearch(e.target.value)}
                            placeholder="Rechercher un élève..." autoFocus
                            className="w-full px-3 py-1.5 border rounded text-xs focus:outline-none mb-1" />
                          {suspectResults.map((u: any) => (
                            <button key={u.id} className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                              onClick={() => onResolveSuspect(s.id, u.id)} disabled={resolving}>
                              {u.firstName} {u.lastName} <span className="text-gray-400">({u.role})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">{t('admin.detail.noSuspect')}</p>}
          </div>

          {/* Alerteur */}
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-3">Alerteur</p>
            <div className={`flex items-center gap-3 ${selected.isAnonymous ? 'opacity-50' : ''} ${!selected.isAnonymous && selected.student?.id ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={() => !selected.isAnonymous && selected.student?.id && onNavigateToUser(selected.student.id)}>
              {selected.student?.avatar
                ? <img src={`${AVATAR_BASE}/${selected.student.avatar}`} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                : <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                    {selected.student ? `${selected.student.firstName?.[0]}${selected.student.lastName?.[0]}` : '?'}
                  </div>
              }
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {selected.isAnonymous ? t('admin.detail.anonymousLabel') : `${selected.student?.firstName} ${selected.student?.lastName}`}
                </p>
                {selected.student?.studentProfile?.schoolClass && (
                  <p className="text-xs text-primary">
                    {selected.student.studentProfile.schoolClass.level} {selected.student.studentProfile.schoolClass.section}
                  </p>
                )}
                <p className="text-xs text-gray-400 capitalize">{selected.reporter === 'victime' ? 'Victime' : 'Témoin'}</p>
                {selected.isAnonymous && <p className="text-xs text-gray-400 italic">Signalement anonyme</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notes ── */}
      <div className="bg-surface shadow-sm px-6 py-4 mb-3"
        style={{ borderLeft: `5px solid ${severityColor}` }}>
        <p className="text-sm font-semibold text-gray-700 mb-3">{t('admin.notes.title')}</p>
        {notes.length > 0 ? (
          <div className="flex flex-col gap-3 mb-5">
            {notes.map(note => <NoteBlock key={note.id} note={note} severityColor={severityColor} />)}
          </div>
        ) : <p className="text-sm text-gray-400 mb-5">{t('admin.notes.empty')}</p>}
        {isAdmin && (
          <div className="flex flex-col gap-2">
            <Textarea value={newNote} onChange={e => onSetNewNote(e.target.value.slice(0, 1500))} rows={3}
              placeholder={t('admin.notes.placeholder')} className="resize-y bg-gray-50" maxLength={1500} />
            <p className="text-xs text-gray-400 text-right">{newNote.length}/1500 {newNote.length >= 1500 && <span className="text-red-500">Limite atteinte</span>}</p>
            <Button onClick={() => onAddNote('note')}>{t('admin.notes.save')}</Button>
          </div>
        )}
      </div>

      {/* ── Convocations ── */}
      {isAdmin && (
        <div className="bg-surface shadow-sm px-6 py-4 mb-3"
          style={{ borderLeft: `5px solid ${severityColor}` }}>
          <p className="text-sm font-semibold text-gray-700 mb-3">{t('admin.convocation.title')}</p>
          <p className="text-xs text-gray-500 mb-3">Sélectionnez les personnes à convoquer et définissez une date et un message pour chacune.</p>
          <ConvocationSelector selected={selected} checkedIds={checkedConvocIds}
            onToggle={id => {
              onToggleConvoc(id);
              onSetConvocDetails((prev: any) => ({ ...prev, [id]: prev[id] ?? { date: '', message: '' } }));
            }}
          />
          {checkedConvocIds.length > 0 && (
            <div className="flex flex-col gap-4 mt-4 border-t pt-4">
              {checkedConvocIds.map(personId => {
                const details = convocDetails[personId] ?? { date: '', message: '' };
                const label = personId === 'alerteur'
                  ? `👤 ${selected.student?.firstName} ${selected.student?.lastName}`
                  : personId.startsWith('victim_')
                    ? (() => { const uid = personId.slice('victim_'.length); const v = selected.victims?.find((v: any) => v.resolvedUser?.id === uid); return `🟦 ${v?.resolvedUser ? `${v.resolvedUser.firstName} ${v.resolvedUser.lastName}` : v?.freeText ?? 'Victime'}`; })()
                    : (() => { const uid = personId.slice('suspect_'.length); const s = selected.suspects?.find((s: any) => s.resolvedUser?.id === uid); return `🔴 ${s?.resolvedUser ? `${s.resolvedUser.firstName} ${s.resolvedUser.lastName}` : s?.freeText ?? 'Suspect'}`; })();
                return (
                  <div key={personId} className="border rounded-lg p-3 bg-gray-50">
                    <p className="text-xs font-semibold text-primary mb-2">{label}</p>
                    <div className="mb-2">
                      <Label className="text-xs text-gray-500 mb-1 block">Date et heure</Label>
                      <Input type="datetime-local" value={details.date} className="max-w-[220px]"
                        min={new Date().toISOString().slice(0,16)}
                        onChange={e => onSetConvocDetails((prev: any) => ({ ...prev, [personId]: { ...prev[personId], date: e.target.value } }))} />
                      {details.date && new Date(details.date) <= new Date() && (
                        <p className="text-red-500 text-xs mt-1">La date doit être dans le futur</p>
                      )}
                    </div>
                    <Textarea rows={2} placeholder="Message de convocation..." value={details.message}
                      onChange={e => onSetConvocDetails((prev: any) => ({ ...prev, [personId]: { ...prev[personId], message: e.target.value.slice(0, 1500) } }))}
                      className="resize-y" maxLength={1500} />
                    <p className="text-xs text-gray-400 text-right">{details.message.length}/1500 {details.message.length >= 1500 && <span className="text-red-500">Limite atteinte</span>}</p>
                  </div>
                );
              })}
              {convocSuccess && <p className="text-green-600 text-sm">Convocations envoyées avec succès !</p>}
              <Button
                disabled={sendingConvoc || checkedConvocIds.some(id => !convocDetails[id]?.date || !convocDetails[id]?.message || new Date(convocDetails[id].date) <= new Date())}
                onClick={async () => {
                  onSetSendingConvoc(true); onSetConvocSuccess(false);
                  try {
                    for (const personId of checkedConvocIds) {
                      const d = convocDetails[personId];
                      if (!d?.date || !d?.message) continue;
                      const f = new Date(d.date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
                      const recipientName = personId === 'alerteur'
                        ? `${selected.student?.firstName} ${selected.student?.lastName}`
                        : personId.startsWith('victim_')
                          ? (() => { const uid = personId.slice('victim_'.length); const v = selected.victims?.find((v: any) => v.resolvedUser?.id === uid); return v?.resolvedUser ? `${v.resolvedUser.firstName} ${v.resolvedUser.lastName}` : v?.freeText ?? 'Victime'; })()
                          : (() => { const uid = personId.slice('suspect_'.length); const s = selected.suspects?.find((s: any) => s.resolvedUser?.id === uid); return s?.resolvedUser ? `${s.resolvedUser.firstName} ${s.resolvedUser.lastName}` : s?.freeText ?? 'Suspect'; })();
                      await onAddNoteRaw(selected.id, `${recipientName} est convoqué(e) le ${f}\n\n${d.message}`, 'convocation', personId);
                    }
                    onLoadNotes(selected.id);
                    onSetConvocDetails(() => ({}));
                    onToggleConvoc('__clear__');
                    onSetConvocSuccess(true);
                    setTimeout(() => onSetConvocSuccess(false), 3000);
                  } finally { onSetSendingConvoc(false); }
                }}
              >{sendingConvoc ? 'Envoi...' : `📤 Envoyer ${checkedConvocIds.length} convocation(s)`}</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}