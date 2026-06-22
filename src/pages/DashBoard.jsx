import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";
import { supabase } from '../services/SupabaseClient';
import "./DashBoard.css";
import LiveDashboard from "./LiveDashBoard";

function formatDateLabel(isoDate) {
  const d = new Date(isoDate);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${month}.${day}.`;
}

// Újrafelhasználható táblázat -- a három ismétlődő tábla helyett
function StatsTable({ headers, rows, emptyText }) {
  return (
    <table className="visitors-dashboard__table">
      <thead>
        <tr>
          {headers.map((h) => <th key={h}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="visitors-dashboard__empty">
              {emptyText}
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => <td key={i}>{cell}</td>)}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default function DashBoard() {
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState([]);
  const [statsDevice, setStatsDevice] = useState([]);
  const [statsCity, setStatsCity] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);

      const rangeStart = new Date();
      rangeStart.setDate(rangeStart.getDate() - (days - 1));
      rangeStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("matra_visitors")
        .select("path, created_at, device_type, city")
        .gte("created_at", rangeStart.toISOString());

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Segédfüggvény: egy mező alapján összeszámol és csökkenő sorrendbe rendez
      const countBy = (field) => {
        const counts = {};
        data.forEach((row) => {
          const key = row[field] ?? "ismeretlen";
          counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts)
          .map(([key, count]) => [key, count])
          .sort((a, b) => b[1] - a[1]);
      };

      // Napi összesítés a diagramhoz, hiányzó napok 0-val feltöltve
      const dayCounts = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dayCounts[d.toISOString().slice(0, 10)] = 0;
      }
      data.forEach(({ created_at }) => {
        const key = created_at.slice(0, 10);
        if (key in dayCounts) dayCounts[key] += 1;
      });

      setStats(countBy("path"));
      setStatsDevice(countBy("device_type"));
      setStatsCity(countBy("city"));
      setDailyData(
        Object.entries(dayCounts).map(([date, count]) => ({
          date: formatDateLabel(date),
          count,
        }))
      );
      setTotal(data.length);
      setLoading(false);
    };

    fetchStats();
  }, [days]);

  const emptyText = `Nincs adat az elmúlt ${days} napból.`;

  return (
    <div className="visitors-dashboard">

      {/* Élő nézők -- a lap tetején */}
      <LiveDashboard />

      <div className="visitors-dashboard__header">
        <h2>Látogatottság</h2>
        <select
          className="visitors-dashboard__select"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>utolsó 7 nap</option>
          <option value={30}>utolsó 30 nap</option>
        </select>
      </div>

      <div className="visitors-dashboard__total">
        <span className="visitors-dashboard__total-number">{total}</span>
        <span className="visitors-dashboard__total-label">összes látogatás</span>
      </div>

      {loading ? (
        <p className="dashboard-status">Betöltés…</p>
      ) : error ? (
        <p className="dashboard-status">Hiba: {error}</p>
      ) : (
        <>
          <div className="visitors-dashboard__chart">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dailyData} margin={{ top: 12, right: 0, left: -24, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#7A9E6F" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#7A9E6F" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: "#D4813A" }}
                  labelStyle={{ color: "#6f4e37" }}
                  contentStyle={{ fontSize: 12, border: "1px solid #7A9E6F", borderRadius: 4 }}
                />
                <Bar dataKey="count" fill="#7A9E6F" radius={[3, 3, 0, 0]}>
                  <LabelList
                    dataKey="count"
                    position="top"
                    fill="#7A9E6F"
                    fontSize={12}
                    formatter={(value) => value > 0 ? value : ""}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <StatsTable
            headers={["Oldal", "Darabszám"]}
            rows={stats}
            emptyText={emptyText}
          />
          <StatsTable
            headers={["Eszköz", "Darabszám"]}
            rows={statsDevice}
            emptyText={emptyText}
          />
          <StatsTable
            headers={["Város", "Darabszám"]}
            rows={statsCity}
            emptyText={emptyText}
          />
        </>
      )}
    </div>
  );
}