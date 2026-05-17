 // ── Section suivi dossiers ─────────────────────────────────────────────────
  if (viewSection === 'cases') return (
    <>
      <Header />
      <main className="max-w-xl mx-auto mt-8 px-5 pb-10">
        <h2 className="text-gray-800 font-bold text-2xl mb-2">Mes dossiers</h2>
        <p className="text-gray-500 text-sm mb-6">Suivi de vos signalements en cours</p>

        {loadingReports ? (
          <p className="text-center py-10 text-gray-400">Chargement...</p>
        ) : myReports.length === 0 ? (
          <Card className="text-center">
            <p className="text-gray-400 text-sm">Aucun signalement trouvé</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {myReports
              .filter((report: any) => report.reporter !== 'temoin')
              .map((report: any) => {
                const severity = severityFromApiGrade(report.grade);
                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-xl px-6 py-5 shadow-sm"
                    style={{ borderLeft: `4px solid ${SEVERITY_COLORS[severity]}` }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-primary">{report.caseNumber}</span>
                          <span className="text-white text-xs px-3 py-0.5 rounded-full" style={{ background: SEVERITY_COLORS[severity] }}>
                            {SEVERITY_BADGES[severity]}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 font-semibold mb-1">{report.type} — {report.reporter === 'victime' ? 'Je suis victime' : 'Je suis témoin'}</div>
                        <div className="text-xs text-gray-400">📅 {new Date(report.createdAt).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <Badge variant={statusToBadgeVariant(report.status)} />
                    </div>

                    {report.adminNote && (
                      <div className="mt-3 bg-surface rounded-lg px-4 py-2 text-sm text-gray-600">
                        💬 <strong>Note de l'administration :</strong> {report.adminNote}
                      </div>
                    )}

                    {reportNotes[report.id]?.filter((n: any) => n.type === 'convocation').map((note: any) => {
                      const MONTHS_FR: Record<string, number> = {
                        'janvier':1,'février':2,'mars':3,'avril':4,'mai':5,'juin':6,
                        'juillet':7,'août':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12
                      };
                      const match = note.content.match(/Rendez-vous le (\d{2}) (\w+) (\d{4}) à (\d{2})h(\d{2})/);
                      let isPast = true;
                      let displayDate = '';
                      let message = note.content;

                      if (match) {
                        const [, day, monthStr, year, hours, minutes] = match;
                        const monthNum = MONTHS_FR[monthStr.toLowerCase()];
                        const yearNum = Number(year);
                        if (monthNum && yearNum >= 2020 && yearNum <= 2100) {
                          const rdvDate = new Date(yearNum, monthNum - 1, Number(day), Number(hours), Number(minutes));
                          isPast = rdvDate < new Date();
                          displayDate = `${String(day).padStart(2,'0')}/${String(monthNum).padStart(2,'0')}/${year} à ${hours}h${minutes}`;
                          const msgMatch = note.content.match(/Rendez-vous le .+?\. (.+)/s);
                          message = msgMatch ? msgMatch[1] : '';
                        }
                      }

                      return (
                        <div
                          key={note.id}
                          className={`mt-3 rounded-lg px-4 py-2 text-sm ${isPast ? 'bg-gray-50' : 'bg-surface'}`}
                          style={{ borderLeft: `3px solid ${isPast ? '#ccc' : '#7c3aed'}` }}
                        >
                          {!displayDate ? (
                            <span className="text-primary">📅 Convocation : {note.content}</span>
                          ) : isPast ? (
                            <span className="text-gray-400">📋 Un rendez-vous a eu lieu le <strong>{displayDate}</strong></span>
                          ) : (
                            <span className="text-primary">📅 Convocation : Vous êtes convoqué(e) le <strong>{displayDate}</strong>{message ? ` — ${message}` : ''}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
          </div>
        )}
      </main>
    </>
  );