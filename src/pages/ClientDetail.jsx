import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { ArrowLeft, Mail, Target, Scale, CalendarDays, Activity, MessageSquare, UserCog } from "lucide-react";
import { api, apiError } from "../lib/api";
import { formatDate } from "../lib/utils";
import { useAuth } from "../context/AuthContext.jsx";

const UNASSIGNED = "unassigned";

export default function ClientDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [detail, setDetail] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [trainers, setTrainers] = useState([]);
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignError, setAssignError] = useState("");

  useEffect(() => {
    Promise.all([api.get(`/admin/clients/${id}`), api.get(`/progress/user/${id}`)])
      .then(([d, p]) => {
        setDetail(d.data);
        setProgress(p.data);
      })
      .catch(() => setError("Could not load this client."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!isAdmin) return;
    api.get("/role-matrix/staff").then(({ data }) => {
      setTrainers(data.filter((s) => s.role === "trainer"));
    }).catch(() => {});
  }, [isAdmin]);

  const assignTrainer = async (value) => {
    setAssignError("");
    setAssignBusy(true);
    try {
      const assigned_trainer_id = value === UNASSIGNED ? null : Number(value);
      const { data } = await api.patch(`/admin/users/${id}`, { assigned_trainer_id });
      setDetail((d) => ({ ...d, user: data }));
    } catch (err) {
      setAssignError(apiError(err, "Could not update the assigned trainer."));
    } finally {
      setAssignBusy(false);
    }
  };

  if (loading) return <div className="card text-sm text-white/40">Loading…</div>;
  if (error || !detail) return <div className="card text-sm text-danger">{error || "Not found."}</div>;

  const u = detail.user;
  const chartData = progress
    .filter((e) => e.weight_lbs != null)
    .map((e) => ({ date: formatDate(e.entry_date, { month: "short", day: "numeric" }), weight: e.weight_lbs }));

  const stat = [
    { icon: Scale, label: "Latest Weight", value: detail.latest_weight_lbs ? `${detail.latest_weight_lbs} lbs` : "—" },
    { icon: Activity, label: "Progress Logs", value: detail.progress_count },
    { icon: CalendarDays, label: "Bookings", value: detail.bookings_count },
  ];

  return (
    <div className="space-y-8">
      <Link to="/clients" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-gold">
        <ArrowLeft size={16} /> Back to clients
      </Link>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-gold text-lg font-bold text-ink-950">
              {`${u.first_name?.[0] || ""}${u.last_name?.[0] || ""}`.toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-3xl tracking-[1px]">{u.first_name} {u.last_name}</h2>
              <div className="mt-1 flex flex-wrap gap-4 text-sm text-white/50">
                <span className="flex items-center gap-1.5"><Mail size={14} className="text-gold" /> {u.email}</span>
                <span className="flex items-center gap-1.5"><Target size={14} className="text-gold" /> {u.goal || "No goal set"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <div className="flex items-center gap-2">
                <UserCog size={14} className="text-gold" />
                <select
                  value={u.assigned_trainer_id ?? UNASSIGNED}
                  onChange={(e) => assignTrainer(e.target.value)}
                  disabled={assignBusy}
                  className={`rounded-sm border bg-ink-950 px-2 py-1.5 text-xs outline-none focus:border-gold disabled:opacity-40 ${
                    u.assigned_trainer_id ? "border-ink-700" : "border-gold/30 text-gold"
                  }`}
                >
                  <option value={UNASSIGNED}>Unassigned</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>
            )}
            <Link
              to={`/messages?client=${u.id}`}
              className="btn-outline !px-4 !py-2 !text-xs"
            >
              <MessageSquare size={14} /> Message
            </Link>
            <span className={`rounded-sm border px-3 py-1 text-xs ${
              u.is_active ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400" : "border-white/20 bg-white/10 text-white/50"
            }`}>
              {u.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        {assignError && <p className="mt-3 text-sm text-danger">{assignError}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stat.map((s) => (
          <div key={s.label} className="card">
            <div className="flex items-center gap-2 text-gold">
              <s.icon size={18} />
              <span className="text-xs uppercase tracking-wider text-white/40">{s.label}</span>
            </div>
            <div className="mt-2 font-display text-2xl text-white">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
          Weight Progress <span className="text-white/30">(live client data)</span>
        </h3>
        {chartData.length > 1 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} domain={["dataMin - 3", "dataMax + 3"]} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #222", borderRadius: 4 }}
                  labelStyle={{ color: "#F5A623" }}
                />
                <Line type="monotone" dataKey="weight" stroke="#F5A623" strokeWidth={2.5} dot={{ fill: "#F5A623", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-white/40">This client hasn't logged enough progress yet.</p>
        )}
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="border-b border-ink-800 px-6 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Progress History</h3>
        </div>
        {progress.length === 0 ? (
          <div className="p-8 text-center text-sm text-white/40">No entries logged.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Weight</th>
                  <th className="px-6 py-3 font-medium">Body Fat</th>
                  <th className="px-6 py-3 font-medium">Workouts</th>
                </tr>
              </thead>
              <tbody>
                {[...progress].reverse().map((e) => (
                  <tr key={e.id} className="border-t border-ink-800">
                    <td className="px-6 py-3">{formatDate(e.entry_date)}</td>
                    <td className="px-6 py-3">{e.weight_lbs ? `${e.weight_lbs} lbs` : "—"}</td>
                    <td className="px-6 py-3">{e.body_fat_pct != null ? `${e.body_fat_pct}%` : "—"}</td>
                    <td className="px-6 py-3">{e.workouts_completed ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}