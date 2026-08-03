import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, Users } from "lucide-react";
import { api } from "../lib/api";
import { formatDate } from "../lib/utils";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (search = "") => {
    setLoading(true);
    api
      .get("/admin/clients", { params: search ? { q: search } : {} })
      .then(({ data }) => setClients(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-[1px]">Clients</h2>
          <p className="text-sm text-white/40">Everyone you're coaching, in one place.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email…"
            className="field-input !pl-9 w-72"
          />
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-white/40">Loading…</div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Users size={40} className="text-gold" />
            <p className="mt-4 text-white/60">{q ? "No clients match your search." : "No clients yet."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Goal</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-t border-ink-800 hover:bg-ink-800/40">
                    <td className="px-6 py-3">
                      <Link to={`/clients/${c.id}`} className="font-medium hover:text-gold">
                        {c.first_name} {c.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-white/60">{c.email}</td>
                    <td className="px-6 py-3 text-white/60">{c.goal || "—"}</td>
                    <td className="px-6 py-3 text-white/60">{formatDate(c.created_at)}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-sm border px-2 py-0.5 text-xs ${
                        c.is_active ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400" : "border-white/20 bg-white/10 text-white/50"
                      }`}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link to={`/clients/${c.id}`} className="text-white/30 hover:text-gold">
                        <ChevronRight size={18} />
                      </Link>
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
