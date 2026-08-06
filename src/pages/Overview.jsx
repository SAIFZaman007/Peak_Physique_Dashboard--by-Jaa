import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Users, UserCheck, CalendarClock, Clock, DollarSign, ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import { formatCurrency, formatDateTime, STATUS_STYLES } from "../lib/utils";

export default function Overview() {
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
        // the whole Overview page failing to load.
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
    { icon: DollarSign, label: "Revenue", value: formatCurrency(stats.revenue_cents) },
  ];

  // Revenue grouped by month from succeeded payments
  const revByMonth = {};
  payments
    .filter((p) => p.status === "succeeded")
    .forEach((p) => {
      const key = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      revByMonth[key] = (revByMonth[key] || 0) + p.amount_cents;
    });
  const chartData = Object.entries(revByMonth).map(([month, cents]) => ({ month, revenue: cents / 100 }));

  const upcoming = bookings
    .filter((b) => b.status !== "cancelled" && new Date(b.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl tracking-[1px]">Dashboard</h2>
        <p className="text-sm text-white/40">A live snapshot of your coaching business.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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