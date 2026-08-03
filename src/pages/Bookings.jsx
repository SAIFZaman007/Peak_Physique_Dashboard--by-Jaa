import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { api } from "../lib/api";
import { formatDateTime, STATUS_STYLES } from "../lib/utils";

const FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"];
const NEXT_STATUS = ["pending", "confirmed", "completed", "cancelled"];

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = (status = "all") => {
    setLoading(true);
    api
      .get("/bookings", { params: status !== "all" ? { status } : {} })
      .then(({ data }) => setBookings(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  const setStatus = async (id, status) => {
    await api.patch(`/bookings/${id}`, { status });
    load(filter);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl tracking-[1px]">Bookings</h2>
        <p className="text-sm text-white/40">Manage every session and intro call.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-sm border px-4 py-2 text-xs font-medium capitalize transition-colors ${
              filter === f ? "border-gold bg-gold text-ink-950" : "border-ink-700 text-white/60 hover:border-gold/50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-white/40">Loading…</div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <CalendarDays size={40} className="text-gold" />
            <p className="mt-4 text-white/60">No {filter !== "all" ? filter : ""} bookings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium">Service</th>
                  <th className="px-6 py-3 font-medium">When</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Set status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-ink-800">
                    <td className="px-6 py-3">
                      <div className="font-medium">{b.name}</div>
                      <div className="text-xs text-white/40">{b.email}</div>
                    </td>
                    <td className="px-6 py-3 text-white/70">{b.service}</td>
                    <td className="px-6 py-3 text-white/60">{formatDateTime(b.start_time)}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-sm border px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[b.status] || ""}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <select
                        value={b.status}
                        onChange={(e) => setStatus(b.id, e.target.value)}
                        className="rounded-sm border border-ink-700 bg-ink-950 px-2 py-1.5 text-xs capitalize outline-none focus:border-gold"
                      >
                        {NEXT_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
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
