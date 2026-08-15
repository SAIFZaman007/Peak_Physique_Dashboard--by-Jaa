import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  Users, UserCheck, CalendarClock, Clock, DollarSign, ArrowRight,
  NotebookPen, Apple, Dumbbell,
} from "lucide-react";
import { api } from "../lib/api";
import { formatCurrency, formatDateTime, STATUS_STYLES } from "../lib/utils";
import { useAuth } from "../context/AuthContext.jsx";

export default function Overview() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get("/admin/stats"),
      api.get("/bookings"),
      api.get("/admin/payments"),
    ])
      .then(([s, b, p]) => {
        if (s.status === "fulfilled") setStats(s.value.data);
        if (b.status === "fulfilled") setBookings(b.value.data);
        // Payments defaults to Admin-only in the Role Matrix — a trainer
        // without it simply sees an empty revenue chart below instead of
        // the whole Overview page failing to load. Moot for the KPI/chart
        // themselves now (Trainers never see revenue at all — see
        // dashboard_stats in admin.py), but /admin/payments still backs
        // other Admin-only views, so it stays fetched here defensively.
        if (p.status === "fulfilled") setPayments(p.value.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="card h-28 animate-pulse bg-ink-900" />)}
      </div>
    );
  }

  const kpis = [
    { icon: Users, label: "Total Clients", value: stats.total_clients },
    { icon: UserCheck, label: "Active Clients", value: stats.active_clients },
    { icon: CalendarClock, label: "Upcoming Sessions", value: stats.upcoming_bookings },
    // Includes sessions bought online that are still waiting on a time
    // slot (see Booking.start_time) as well as any awaiting confirmation
    // — same "pending" bucket the Bookings page filters on.
    { icon: Clock, label: "Pending Bookings", value: stats.pending_bookings },
    // Revenue is Admin-only, full stop — the backend never even sends
    // revenue_cents to a Trainer (see dashboard_stats in admin.py), so
    // this tile simply doesn't exist for them rather than being hidden
    // client-side after the fact.
    ...(isAdmin ? [{ icon: DollarSign, label: "Revenue", value: formatCurrency(stats.revenue_cents) }] : []),
  ];

  // Revenue grouped by month from succeeded payments (Admin view only).
  const revByMonth = {};
  payments
    .filter((p) => p.status === "succeeded")
    .forEach((p) => {
      const key = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      revByMonth[key] = (revByMonth[key] || 0) + p.amount_cents;
    });
  const chartData = Object.entries(revByMonth).map(([month, cents]) => ({ month, revenue: cents / 100 }));

  // Trainer's coaching workspace snapshot — what took the place of the
  // revenue chart below. Counts are scoped to the Trainer's own assigned
  // clients server-side (see dashboard_stats), never company-wide.
  const workspaceTiles = [
    { icon: NotebookPen, label: "Client Notes", value: stats.notes_count ?? 0 },
    { icon: Apple, label: "Nutrition Plans", value: stats.nutrition_plans_count ?? 0 },
    { icon: Dumbbell, label: "Workout Plans", value: stats.workout_plans_count ?? 0 },
  ];

  const upcoming = bookings
    .filter((b) => b.status !== "cancelled" && new Date(b.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-[1px]">Dashboard</h2>
          <p className="text-sm text-white/40">A live snapshot of your coaching business.</p>
        </div>
        {isAdmin && stats?.pending_approvals > 0 && (
          <Link
            to="/clients"
            className="flex items-center gap-2 rounded-sm border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 transition-colors"
          >
            <Clock size={14} />
            {stats.pending_approvals} Registration{stats.pending_approvals > 1 ? "s" : ""} Pending Approval
            <ArrowRight size={13} />
          </Link>
        )}
      </div>

      <div className={`grid gap-4 sm:grid-cols-2 ${isAdmin ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <div className="flex items-center gap-3 text-gold">
              <k.icon size={20} />
              <span className="text-xs uppercase tracking-wider text-white/40">{k.label}</span>
            </div>
            <div className="mt-3 font-display text-3xl tracking-[1px] text-white">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {isAdmin ? (
          <div className="card lg:col-span-3">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">Revenue</h3>
            {chartData.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="month" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip
                      cursor={{ fill: "rgba(245,166,35,0.08)" }}
                      contentStyle={{ background: "#111", border: "1px solid #222", borderRadius: 4 }}
                      labelStyle={{ color: "#F5A623" }}
                      formatter={(v) => [`$${v}`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="#F5A623" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-white/40">No revenue recorded yet.</p>
            )}
          </div>
        ) : (
          <div className="card lg:col-span-3">
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-white/50">Your Coaching Workspace</h3>
            <p className="mb-4 text-sm text-white/40">
              Notes, nutrition guidance and workout programs for your clients — open a client profile to add or edit.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {workspaceTiles.map((t) => (
                <Link
                  key={t.label}
                  to="/clients"
                  className="group rounded-sm border border-ink-800 p-4 transition-colors hover:border-gold/50"
                >
                  <div className="flex items-center gap-2 text-gold">
                    <t.icon size={18} />
                    <span className="text-xs uppercase tracking-wider text-white/40">{t.label}</span>
                  </div>
                  <div className="mt-3 font-display text-3xl tracking-[1px] text-white">{t.value}</div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-white/40 group-hover:text-gold">
                    Open a client <ArrowRight size={12} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Upcoming</h3>
            <Link to="/bookings" className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
              All <ArrowRight size={12} />
            </Link>
          </div>
          {upcoming.length ? (
            <div className="space-y-3">
              {upcoming.map((b) => (
                <div key={b.id} className="rounded-sm border border-ink-800 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{b.name || b.service}</span>
                    <span className={`rounded-sm border px-2 py-0.5 text-[11px] capitalize ${STATUS_STYLES[b.status] || ""}`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-white/40">{b.service} · {formatDateTime(b.start_time)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-white/40">No upcoming sessions.</p>
          )}
        </div>
      </div>
    </div>
  );
}