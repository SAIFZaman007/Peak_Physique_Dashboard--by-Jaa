import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, Users, UserCog } from "lucide-react";
import { api, apiError } from "../lib/api";
import { formatDate } from "../lib/utils";
import { useAuth } from "../context/AuthContext.jsx";

const UNASSIGNED = "unassigned";

export default function Clients() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [clients, setClients] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(() => new Set());
  const [bulkTrainer, setBulkTrainer] = useState(UNASSIGNED);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [rowBusyId, setRowBusyId] = useState(null);
  const [rowError, setRowError] = useState("");

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

  // Only Admins can reassign clients, so only Admins need the trainer
  // roster — Trainers already only ever see their own assigned clients.
  useEffect(() => {
    if (!isAdmin) return;
    api.get("/role-matrix/staff").then(({ data }) => {
      setTrainers(data.filter((s) => s.role === "trainer"));
    }).catch(() => {});
  }, [isAdmin]);

  const trainerName = useMemo(() => {
    const map = new Map(trainers.map((t) => [t.id, `${t.first_name} ${t.last_name}`.trim()]));
    return (id) => (id ? map.get(id) || `Trainer #${id}` : "Unassigned");
  }, [trainers]);

  const toggleSelected = (id) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((s) => (s.size === clients.length ? new Set() : new Set(clients.map((c) => c.id))));
  };

  const assignOne = async (clientId, trainerIdValue) => {
    setRowError("");
    setRowBusyId(clientId);
    try {
      const assigned_trainer_id = trainerIdValue === UNASSIGNED ? null : Number(trainerIdValue);
      await api.patch(`/admin/users/${clientId}`, { assigned_trainer_id });
      load(q.trim());
    } catch (err) {
      setRowError(apiError(err, "Could not update that assignment."));
    } finally {
      setRowBusyId(null);
    }
  };

  const applyBulkAssign = async () => {
    setBulkError("");
    setBulkBusy(true);
    try {
      const assigned_trainer_id = bulkTrainer === UNASSIGNED ? null : Number(bulkTrainer);
      await api.patch("/admin/clients/assign-trainer", {
        client_ids: [...selected],
        assigned_trainer_id,
      });
      setSelected(new Set());
      setBulkTrainer(UNASSIGNED);
      load(q.trim());
    } catch (err) {
      setBulkError(apiError(err, "Could not bulk-assign those clients."));
    } finally {
      setBulkBusy(false);
    }
  };

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

      {isAdmin && selected.size > 0 && (
        <div className="card flex flex-wrap items-center gap-3 !py-4">
          <UserCog size={18} className="text-gold" />
          <span className="text-sm text-white/70">{selected.size} client{selected.size > 1 ? "s" : ""} selected</span>
          <select
            value={bulkTrainer}
            onChange={(e) => setBulkTrainer(e.target.value)}
            className="rounded-sm border border-ink-700 bg-ink-950 px-3 py-2 text-sm outline-none focus:border-gold"
          >
            <option value={UNASSIGNED}>Unassign</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
            ))}
          </select>
          <button onClick={applyBulkAssign} disabled={bulkBusy} className="btn-primary !px-5 !py-2.5 !text-xs">
            {bulkBusy ? "Applying…" : "Apply"}
          </button>
          <button
            onClick={() => { setSelected(new Set()); setBulkError(""); }}
            className="text-xs text-white/40 hover:text-white"
          >
            Clear selection
          </button>
          {bulkError && <p className="w-full text-sm text-danger">{bulkError}</p>}
        </div>
      )}

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
            {rowError && <div className="px-6 pt-4"><p className="text-sm text-danger">{rowError}</p></div>}
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-white/40">
                  {isAdmin && (
                    <th className="px-6 py-3 font-medium">
                      <input
                        type="checkbox"
                        checked={selected.size > 0 && selected.size === clients.length}
                        onChange={toggleSelectAll}
                        className="accent-gold"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Goal</th>
                  {isAdmin && <th className="px-6 py-3 font-medium">Assigned Trainer</th>}
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-t border-ink-800 hover:bg-ink-800/40">
                    {isAdmin && (
                      <td className="px-6 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggleSelected(c.id)}
                          className="accent-gold"
                        />
                      </td>
                    )}
                    <td className="px-6 py-3">
                      <Link to={`/clients/${c.id}`} className="font-medium hover:text-gold">
                        {c.first_name} {c.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-white/60">{c.email}</td>
                    <td className="px-6 py-3 text-white/60">{c.goal || "—"}</td>
                    {isAdmin && (
                      <td className="px-6 py-3">
                        <select
                          value={c.assigned_trainer_id ?? UNASSIGNED}
                          onChange={(e) => assignOne(c.id, e.target.value)}
                          disabled={rowBusyId === c.id}
                          className={`rounded-sm border bg-ink-950 px-2 py-1.5 text-xs outline-none focus:border-gold disabled:opacity-40 ${
                            c.assigned_trainer_id ? "border-ink-700" : "border-gold/30 text-gold"
                          }`}
                        >
                          <option value={UNASSIGNED}>Unassigned</option>
                          {trainers.map((t) => (
                            <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                          ))}
                        </select>
                      </td>
                    )}
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