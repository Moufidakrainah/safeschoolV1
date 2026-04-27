import { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid, ResponsiveContainer } from 'recharts';
import { API_GRADE_BADGE_LABELS, API_REPORT_GRADES, SEVERITY_COLORS, SEVERITY_LABELS, severityFromApiGrade } from '../utils/severity';

interface Props { reports: any[] }

export default function StatsDashboard({ reports }: Props) {
  const [period, setPeriod] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');

  const filtered = reports.filter(r => {
    const date = new Date(r.createdAt);
    const now = new Date();
    if (period === '7')   return (now.getTime() - date.getTime()) <= 7 * 86400000;
    if (period === '30')  return (now.getTime() - date.getTime()) <= 30 * 86400000;
    if (period === '90')  return (now.getTime() - date.getTime()) <= 90 * 86400000;
    if (period === '365') return (now.getTime() - date.getTime()) <= 365 * 86400000;
    return true;
  })
    .filter(r => filterClass === 'all' || r.student?.studentProfile?.schoolClass === filterClass)
    .filter(r => filterGrade === 'all' || r.grade === filterGrade);

  const gradeData = API_REPORT_GRADES.map((apiGrade) => {
    const severity = severityFromApiGrade(apiGrade);
    return {
      name: SEVERITY_LABELS[severity],
      value: filtered.filter(r => r.grade === apiGrade).length,
      color: SEVERITY_COLORS[severity],
    };
  }).filter(d => d.value > 0);

  const classes = [...new Set(reports.map(r => r.student?.studentProfile?.schoolClass).filter(Boolean))];
  const classData = classes.map(c => ({
    classe: c,
    total:    filtered.filter(r => r.student?.studentProfile?.schoolClass === c).length,
    critical: filtered.filter(r => r.student?.studentProfile?.schoolClass === c && r.grade === 'critique').length,
    high:     filtered.filter(r => r.student?.studentProfile?.schoolClass === c && r.grade === 'grave').length,
  }));

  const typeData = ['Physique', 'Verbal', 'Cyber', 'Exclusion sociale', 'Sexuel', 'Autre'].map(t => ({
    type: t, count: filtered.filter(r => r.title.includes(t)).length,
  })).filter(d => d.count > 0);

  const statusData = [
    { name: 'En attente', value: filtered.filter(r => r.status === 'pending').length,     color: '#eab308' },
    { name: 'En cours',   value: filtered.filter(r => r.status === 'in_progress').length, color: '#0f3460' },
    { name: 'Escaladé',   value: filtered.filter(r => r.status === 'escalated').length,   color: '#7c3aed' },
    { name: 'Clôturé',    value: filtered.filter(r => r.status === 'closed').length,      color: '#22c55e' },
    { name: 'Rejeté',     value: filtered.filter(r => r.status === 'rejected').length,    color: '#dc2626' },
  ].filter(d => d.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    return {
      date: dayStr,
      count: filtered.filter(r => new Date(r.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) === dayStr).length,
    };
  });

  const allClasses = [...new Set(reports.map(r => r.student?.studentProfile?.schoolClass).filter(Boolean))];

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', background: 'white', color: '#333' }}>
          <option value="all">Toute la période</option>
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">3 derniers mois</option>
          <option value="365">1 an</option>
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', background: 'white', color: '#333' }}>
          <option value="all">Toutes les classes</option>
          {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', background: 'white', color: '#333' }}>
          <option value="all">Tous les grades</option>
          {API_REPORT_GRADES.map((grade) => (
            <option key={grade} value={grade}>{API_GRADE_BADGE_LABELS[grade]}</option>
          ))}
        </select>
        <div style={{ background: '#f0f4ff', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', color: '#0f3460', fontWeight: 600 }}>
          {filtered.length} signalement{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px' }}>📊 Répartition par grade</h3>
          {gradeData.length === 0 ? <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>Aucune donnée</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={gradeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {gradeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px' }}>📋 Répartition par statut</h3>
          {statusData.length === 0 ? <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>Aucune donnée</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px' }}>🏫 Signalements par classe</h3>
        {classData.length === 0 ? <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>Aucune donnée</p> : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={classData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="classe" /><YAxis allowDecimals={false} />
              <Tooltip /><Legend />
              <Bar dataKey="total" name="Total" fill="#0f3460" />
              <Bar dataKey="critical" name={SEVERITY_LABELS.critical} fill={SEVERITY_COLORS.critical} />
              <Bar dataKey="high" name={SEVERITY_LABELS.high} fill={SEVERITY_COLORS.high} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px' }}>⚠️ Signalements par type</h3>
          {typeData.length === 0 ? <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>Aucune donnée</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="type" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" name="Signalements" fill="#7c3aed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px' }}>📈 Évolution (7 derniers jours)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" /><YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Signalements" stroke="#0f3460" strokeWidth={2} dot={{ fill: '#0f3460' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
