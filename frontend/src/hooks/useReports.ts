/**
 * useReports — hook personnalisé pour la gestion des signalements dans AdminDashboard.
 *
 * Centralise :
 *   - L'état de la liste, du détail, des filtres, de la pagination
 *   - Les handlers de mise à jour de statut, de notes, de convocations
 *   - Les valeurs calculées (filtered, paginated, stats, totalPages)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllReports, updateReport, getNotes, addNote } from '@/services/api';
import { severityFromApiGrade } from '@/utils/severity';
import type { Report, Note } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportStats {
  total: number;
  critical: number;
  high: number;
  pending: number;
}

export interface UseReportsReturn {
  // Liste
  reports:      Report[];
  loading:      boolean;
  fetchReports: () => Promise<void>;

  // Vue détail
  view:         'list' | 'detail';
  setView:      React.Dispatch<React.SetStateAction<'list' | 'detail'>>;
  selected:     Report | null;
  setSelected:  React.Dispatch<React.SetStateAction<Report | null>>;
  goTo:         (report: Report | null) => void;

  // Mise à jour statut
  saving:               boolean;
  adminNote:            string;
  setAdminNote:         React.Dispatch<React.SetStateAction<string>>;
  handleUpdateStatus:   (id: string, status: string) => Promise<void>;

  // Filtres
  search:           string;
  setSearch:        React.Dispatch<React.SetStateAction<string>>;
  filterGrade:      string;
  setFilterGrade:   React.Dispatch<React.SetStateAction<string>>;
  filterStatus:     string;
  setFilterStatus:  React.Dispatch<React.SetStateAction<string>>;
  filterClass:      string;
  setFilterClass:   React.Dispatch<React.SetStateAction<string>>;
  filterStudent:    string;
  setFilterStudent: React.Dispatch<React.SetStateAction<string>>;
  filterSuspect:    string;
  setFilterSuspect: React.Dispatch<React.SetStateAction<string>>;
  filterVictim:    string;
  setFilterVictim: React.Dispatch<React.SetStateAction<string>>;
  filterDateFrom:   string;
  setFilterDateFrom:React.Dispatch<React.SetStateAction<string>>;
  filterDateTo:     string;
  setFilterDateTo:  React.Dispatch<React.SetStateAction<string>>;
  currentPage:      number;
  setCurrentPage:   React.Dispatch<React.SetStateAction<number>>;
  resetKey:         number;
  handleReset:      () => void;

  // Valeurs calculées
  filtered:    Report[];
  totalPages:  number;
  paginated:   Report[];
  stats:       ReportStats;

  // Notes
  notes:               Note[];
  newNote:             string;
  setNewNote:          React.Dispatch<React.SetStateAction<string>>;
  convocationDate:     string;
  setConvocationDate:  React.Dispatch<React.SetStateAction<string>>;
  convocationMessage:  string;
  setConvocationMessage: React.Dispatch<React.SetStateAction<string>>;
  loadNotes:           (reportId: string) => Promise<void>;
  handleAddNote:       (type?: string) => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 5;

export function useReports(): UseReportsReturn {

  // ── Liste & détail ─────────────────────────────────────────────────────────
  const [reports,   setReports]   = useState<Report[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<Report | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [view,      setView]      = useState<'list' | 'detail'>('list');

  // ── Filtres ────────────────────────────────────────────────────────────────
  const [search,          setSearch]          = useState('');
  const [filterGrade,     setFilterGrade]     = useState('all');
  const [filterStatus,    setFilterStatus]    = useState('all');
  const [filterClass,     setFilterClass]     = useState('all');
  const [filterStudent,   setFilterStudent]   = useState('all');
  const [filterSuspect,   setFilterSuspect]   = useState('');
  const [filterVictim,   setFilterVictim]   = useState('');
  const [filterDateFrom,  setFilterDateFrom]  = useState('');
  const [filterDateTo,    setFilterDateTo]    = useState('');
  const [currentPage,     setCurrentPage]     = useState(1);
  const [resetKey,        setResetKey]        = useState(0);

  // ── Notes ──────────────────────────────────────────────────────────────────
  const [notes,              setNotes]              = useState<Note[]>([]);
  const [newNote,            setNewNote]            = useState('');
  const [convocationDate,    setConvocationDate]    = useState('');
  const [convocationMessage, setConvocationMessage] = useState('');

  // ── Chargement initial ─────────────────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    try {
      const data = await getAllReports();
      setReports(data);
    } catch {
      console.error('Erreur chargement signalements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // ── Mise à jour statut ─────────────────────────────────────────────────────
  const handleUpdateStatus = useCallback(async (id: string, status: string) => {
    setSaving(true);
    try {
      await updateReport(id, { status, adminNote });
      await fetchReports();
      setAdminNote('');
      setView('list');
      setSelected(null);
    } catch {
      console.error('Erreur mise à jour statut');
    } finally {
      setSaving(false);
    }
  }, [adminNote, fetchReports]);

  // ── Notes ──────────────────────────────────────────────────────────────────
  const loadNotes = useCallback(async (reportId: string) => {
    try {
      const data = await getNotes(reportId);
      setNotes(data);
    } catch {
      console.error('Erreur chargement notes');
    }
  }, []);

  const goTo = useCallback((report: Report | null) => {
    setSelected(report);
    if (report) loadNotes(report.id);
  }, [loadNotes]);

  const handleAddNote = useCallback(async (type = 'note') => {
    if (!selected) return;
    let content = type === 'convocation' ? convocationMessage : newNote;
    if (!content.trim()) return;
    if (type === 'convocation' && convocationDate) {
      const formatted = new Date(convocationDate).toLocaleString('fr-FR', {
        dateStyle: 'long', timeStyle: 'short',
      });
      content = ` ${formatted}\n\n${content}`;
    }
    try {
      await addNote(selected.id, content, type);
      await loadNotes(selected.id);
      if (type === 'convocation') { setConvocationMessage(''); setConvocationDate(''); }
      else setNewNote('');
    } catch {
      console.error('Erreur ajout note');
    }
  }, [selected, newNote, convocationMessage, convocationDate, loadNotes]);

  // ── Réinitialisation des filtres ───────────────────────────────────────────
  const handleReset = useCallback(() => {
    setFilterGrade('all');
    setFilterStatus('all');
    setFilterClass('all');
    setFilterStudent('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterSuspect('');
	setFilterVictim('');
    setSearch('');
    setCurrentPage(1);
    setResetKey(k => k + 1);
  }, []);

  // ── Valeurs calculées ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return reports.filter(r => {
      if (filterGrade !== 'all' && r.grade !== filterGrade) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (filterClass !== 'all') {
      const sc = r.student?.studentProfile?.schoolClass;
      const classLabel = sc ? `${sc.level} ${sc.section}` : '';
      if (classLabel !== filterClass) return false;
    }
      if (filterStudent !== 'all' && r.student?.id !== filterStudent) return false;
      if (filterSuspect) {
        const q = filterSuspect.toLowerCase();
        const match = r.suspects?.some(s => {
          const name = `${s.user?.firstName ?? ''} ${s.user?.lastName ?? ''}`.toLowerCase();
          return name.includes(q) || (s.freeText?.toLowerCase() ?? '').includes(q);
        });
        if (!match) return false;
      }
	   if (filterVictim) {
        const q = filterVictim.toLowerCase();
        const match = r.reports?.some(s => {
          const name = `${s.reports?.description ?? ''} ${s.user?.lastName ?? ''}`.toLowerCase();
          return name.includes(q) || (s.freeText?.toLowerCase() ?? '').includes(q);
        });
        if (!match) return false;
      }




      if (filterDateFrom && new Date(r.createdAt) < new Date(filterDateFrom)) return false;
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(r.createdAt) > to) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const name = `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`.toLowerCase();
        if (
          !name.includes(q) &&
          !(r.type ?? '').toLowerCase().includes(q) &&
          !(r.description ?? '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [reports, filterGrade, filterStatus, filterClass, filterStudent, filterSuspect, filterVictim, filterDateFrom, filterDateTo, search]);

  const totalPages = useMemo(() => Math.ceil(filtered.length / ITEMS_PER_PAGE), [filtered]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);


  // a modifier
  const stats = useMemo<ReportStats>(() => ({
    total:     reports.length,
    critical:  reports.filter(r => severityFromApiGrade(r.grade) === 'critical').length,
    high:      reports.filter(r => severityFromApiGrade(r.grade) === 'high').length,
    pending:   reports.filter(r => r.status === 'pending').length,
  }), [reports]);

  return {
    reports, loading, fetchReports,
    view, setView, selected, setSelected, goTo,
    saving, adminNote, setAdminNote, handleUpdateStatus,
    search, setSearch,
    filterGrade, setFilterGrade,
    filterStatus, setFilterStatus,
    filterClass, setFilterClass,
    filterStudent, setFilterStudent,
    filterSuspect, setFilterSuspect,
    filterDateFrom, setFilterDateFrom,
    filterDateTo, setFilterDateTo,
    currentPage, setCurrentPage,
    resetKey, handleReset,
    filtered, totalPages, paginated, stats,
    notes, newNote, setNewNote,
    convocationDate, setConvocationDate,
    convocationMessage, setConvocationMessage,
    loadNotes, handleAddNote,
  };
}
