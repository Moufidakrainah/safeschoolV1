import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  API_REPORT_GRADES,
  SEVERITY_COLORS,
  severityFromApiGrade,
} from "@/utils/severity";
import type { Report } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  reports: Report[];
}

export default function StatsDashboard({ reports }: Props) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");

  // Labels traduits dynamiquement via t()
  const severityLabel = (s: string) => t(`severity.${s}`);

  const getVictimClass = (r: Report) => {
    if (r.reporter === "victime")
      return r.student?.studentProfile?.schoolClass ?? null;
    const resolved = r.victims?.find(
      (v: any) => v.resolvedUser?.studentProfile?.schoolClass,
    );
    return resolved?.resolvedUser?.studentProfile?.schoolClass ?? null;
  };

  const filtered = useMemo(() => {
    return reports
      .filter((r) => {
        const date = new Date(r.createdAt);
        const now = new Date();
        if (period === "7")
          return now.getTime() - date.getTime() <= 7 * 86400000;
        if (period === "30")
          return now.getTime() - date.getTime() <= 30 * 86400000;
        if (period === "90")
          return now.getTime() - date.getTime() <= 90 * 86400000;
        if (period === "365")
          return now.getTime() - date.getTime() <= 365 * 86400000;
        return true;
      })
      .filter((r) => {
        const sc = getVictimClass(r);
        const label = sc ? `${sc.level} ${sc.section}` : "";
        return filterClass === "all" || label === filterClass;
      })
      .filter((r) => filterGrade === "all" || r.grade === filterGrade);
  }, [reports, period, filterClass, filterGrade]);

  const gradeData = useMemo(() => {
    return API_REPORT_GRADES.map((apiGrade) => {
      const severity = severityFromApiGrade(apiGrade);
      return {
        name: severityLabel(severity),
        value: filtered.filter((r) => r.grade === apiGrade).length,
        color: SEVERITY_COLORS[severity],
      };
    }).filter((d) => d.value > 0);
  }, [filtered, t]);

  const allClasses = useMemo(
    () => [
      ...new Set(
        reports
          .map((r) => {
            const sc = getVictimClass(r);
            return sc ? `${sc.level} ${sc.section}` : null;
          })
          .filter(Boolean),
      ),
    ],
    [reports],
  );

  const classData = useMemo(() => {
    return allClasses.map((c) => ({
      classe: c,
      total: filtered.filter((r) => {
        const sc = getVictimClass(r);
        return sc ? `${sc.level} ${sc.section}` === c : false;
      }).length,
      critical: filtered.filter((r) => {
        const sc = getVictimClass(r);
        return sc
          ? `${sc.level} ${sc.section}` === c && r.grade === "critical"
          : false;
      }).length,
      high: filtered.filter((r) => {
        const sc = getVictimClass(r);
        return sc
          ? `${sc.level} ${sc.section}` === c && r.grade === "high"
          : false;
      }).length,
      medium: filtered.filter((r) => {
        const sc = getVictimClass(r);
        return sc
          ? `${sc.level} ${sc.section}` === c && r.grade === "medium"
          : false;
      }).length,
      low: filtered.filter((r) => {
        const sc = getVictimClass(r);
        return sc
          ? `${sc.level} ${sc.section}` === c && r.grade === "low"
          : false;
      }).length,
    }));
  }, [allClasses, filtered]);

  const typeData = useMemo(() => {
    const types = ["physique", "verbal", "cyber", "exclusion", "sexuel"];
    return types
      .map((tp) => ({
        type: tp.charAt(0).toUpperCase() + tp.slice(1),
        count: filtered.filter((r) => r.type?.toLowerCase() === tp).length,
      }))
      .filter((d) => d.count > 0);
  }, [filtered]);

  const statusData = useMemo(() => {
    const statuses = [
      { name: t("stats.statusNew"), key: "new", color: "#6366f1" },
      { name: t("stats.statusPending"), key: "pending", color: "#eab308" },
      {
        name: t("stats.statusInProgress"),
        key: "in_progress",
        color: "#0f3460",
      },
      { name: t("stats.statusResolved"), key: "resolved", color: "#22c55e" },
      {
        name: t("stats.statusRejected"),
        key: "false_report",
        color: SEVERITY_COLORS.critical,
      },
    ];
    return statuses
      .map((s) => ({
        name: s.name,
        value: filtered.filter((r) => r.status === s.key).length,
        color: s.color,
      }))
      .filter((d) => d.value > 0);
  }, [filtered, t]);

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayStr = date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      });
      return {
        date: dayStr,
        count: filtered.filter(
          (r) =>
            new Date(r.createdAt).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
            }) === dayStr,
        ).length,
      };
    });
  }, [filtered]);

  const periodLabel: Record<string, string> = {
    all: t("stats.allPeriod"),
    "7": t("stats.last7"),
    "30": t("stats.last30"),
    "90": t("stats.last90"),
    "365": t("stats.last365"),
  };

  return (
    <section className="page-section">
      {/* ── Filtres ── */}
      <div className="flex flex-col md:flex-row flex-wrap gap-3 items-start md:items-end mb-6">
        <Select
          value={period}
          onValueChange={(v) => {
            if (v !== null) setPeriod(v);
          }}
        >
          <SelectTrigger className="w-full md:w-48 bg-white">
            <SelectValue>{periodLabel[period]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("stats.allPeriod")}</SelectItem>
            <SelectItem value="7">{t("stats.last7")}</SelectItem>
            <SelectItem value="30">{t("stats.last30")}</SelectItem>
            <SelectItem value="90">{t("stats.last90")}</SelectItem>
            <SelectItem value="365">{t("stats.last365")}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterClass}
          onValueChange={(v) => {
            if (v !== null) setFilterClass(v);
          }}
        >
          <SelectTrigger className="w-full md:w-48 bg-white">
            <SelectValue>
              {filterClass === "all" ? t("stats.allClasses") : filterClass}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("stats.allClasses")}</SelectItem>
            {allClasses.map((c) => (
              <SelectItem key={c} value={c!}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterGrade}
          onValueChange={(v) => {
            if (v !== null) setFilterGrade(v);
          }}
        >
          <SelectTrigger className="w-full md:w-48 bg-white">
            <SelectValue>
              {filterGrade === "all"
                ? t("stats.allGrades")
                : severityLabel(severityFromApiGrade(filterGrade))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("stats.allGrades")}</SelectItem>
            {API_REPORT_GRADES.map((grade) => (
              <SelectItem key={grade} value={grade}>
                {severityLabel(severityFromApiGrade(grade))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="text-sm px-3 py-2 md:ml-auto">
          {t("stats.reportsFound", { count: filtered.length })}
        </div>
      </div>

      {/* ── Ligne 1 : Grade + Statut ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface shadow-sm rounded-sm px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {t("stats.byGrade")}
          </h3>
          {gradeData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {t("stats.noData")}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={gradeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                >
                  {gradeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-surface shadow-sm rounded-sm px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {t("stats.byStatus")}
          </h3>
          {statusData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {t("stats.noData")}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Ligne 2 : Par classe ── */}
      <div className="bg-surface shadow-sm rounded-sm px-6 py-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          {t("stats.byClass")}
        </h3>
        {classData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            {t("stats.noData")}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={classData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="classe" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name={t("stats.total")} fill="#0f3460" />
              <Bar
                dataKey="critical"
                name={severityLabel("critical")}
                fill={SEVERITY_COLORS.critical}
              />
              <Bar
                dataKey="high"
                name={severityLabel("high")}
                fill={SEVERITY_COLORS.high}
              />
              <Bar
                dataKey="medium"
                name={severityLabel("medium")}
                fill={SEVERITY_COLORS.medium}
              />
              <Bar
                dataKey="low"
                name={severityLabel("low")}
                fill={SEVERITY_COLORS.low}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Ligne 3 : Type + Évolution ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface shadow-sm rounded-sm px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {t("stats.byType")}
          </h3>
          {typeData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {t("stats.noData")}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="type" type="category" width={100} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  name={t("stats.reportsLabel")}
                  fill="var(--color-primary)"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-surface shadow-sm rounded-sm px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {t("stats.evolution")}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                name={t("stats.reportsLabel")}
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={{ fill: "var(--color-primary)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
