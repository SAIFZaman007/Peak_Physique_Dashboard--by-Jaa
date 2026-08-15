import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ChevronRight,
  Users,
  UserCog,
  UserPlus,
  Trash2,
  CheckCircle,
  Clock,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { api, apiError } from "../lib/api";
import { formatDate } from "../lib/utils";
import { useAuth } from "../context/AuthContext.jsx";

const UNASSIGNED = "unassigned";

const INITIAL_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  phone: "",
  goal: "",
  assigned_trainer_id: UNASSIGNED,
};

export default function Clients() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [clients, setClients] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all"); // 'all' | 'pending' | 'active'
  const [loading, setLoading] = useState(true);

  // Bulk actions
  const [selected, setSelected] = useState(() => new Set());
  const [bulkTrainer, setBulkTrainer] = useState(UNASSIGNED);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [rowBusyId, setRowBusyId] = useState(null);
  const [rowError, setRowError] = useState("");

  // Create Client Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_FORM);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState("");

  // Delete Client Modal state
  const [clientToDelete, setClientToDelete] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = (search = "", currentTab = tab) => {
    setLoading(true);
    const params = {};
    if (search) params.q = search;
    if (currentTab === "pending") params.approval_status = "pending";
    else if (currentTab === "active") params.approval_status = "approved";

    api
      .get("/admin/clients", { params })
      .then(({ data }) => setClients(data))
      .catch((err) => setRowError(apiError(err, "Failed to load clients.")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(q.trim(), tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(q.trim(), tab), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Fetch staff roster for Admin assignment
  useEffect(() => {
    if (!isAdmin) return;
    api
      .get("/role-matrix/staff")
      .then(({ data }) => {
        setTrainers(data.filter((s) => s.role === "trainer"));
      })
      .catch(() => {});
  }, [isAdmin]);

  const trainerName = useMemo(() => {
    const map = new Map(
      trainers.map((t) => [t.id, `${t.first_name} ${t.last_name}`.trim()])
    );
    return (id) => (id ? map.get(id) || `Trainer #${id}` : "Unassigned");
  }, [trainers]);

  const pendingCount = useMemo(() => {
    return clients.filter((c) => c.is_approved === false).length;
  }, [clients]);

  const toggleSelected = (id) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((s) =>
      s.size === clients.length ? new Set() : new Set(clients.map((c) => c.id))
    );
  };

  const assignOne = async (clientId, trainerIdValue) => {
    setRowError("");
    setRowBusyId(clientId);
    try {
      const assigned_trainer_id =
        trainerIdValue === UNASSIGNED ? null : Number(trainerIdValue);
      await api.patch(`/admin/users/${clientId}`, { assigned_trainer_id });
      load(q.trim(), tab);
    } catch (err) {
      setRowError(apiError(err, "Could not update that assignment."));
    } finally {
      setRowBusyId(null);
    }
  };

  const approveClient = async (clientId) => {
    setRowError("");
    setRowBusyId(clientId);
    try {
      await api.patch(`/admin/clients/${clientId}/approve`);
      load(q.trim(), tab);
    } catch (err) {
      setRowError(apiError(err, "Could not approve this client."));
    } finally {
      setRowBusyId(null);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError("");
    if (!createForm.email || !createForm.first_name || !createForm.password) {
      setCreateError("First name, email, and password are required.");
      return;
    }
    if (createForm.password.length < 6) {
      setCreateError("Password must be at least 6 characters.");
      return;
    }

    setCreateBusy(true);
    try {
      const payload = {
        first_name: createForm.first_name.trim(),
        last_name: createForm.last_name.trim(),
        email: createForm.email.trim().toLowerCase(),
        password: createForm.password,
        phone: createForm.phone.trim() || null,
        goal: createForm.goal.trim() || null,
        assigned_trainer_id:
          createForm.assigned_trainer_id === UNASSIGNED
            ? null
            : Number(createForm.assigned_trainer_id),
      };
      await api.post("/admin/clients", payload);
      setShowCreateModal(false);
      setCreateForm(INITIAL_FORM);
      load(q.trim(), tab);
    } catch (err) {
      setCreateError(apiError(err, "Could not create client account."));
    } finally {
      setCreateBusy(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    setDeleteError("");
    setDeleteBusy(true);
    try {
      await api.delete(`/admin/clients/${clientToDelete.id}`);
      setClientToDelete(null);
      load(q.trim(), tab);
    } catch (err) {
      setDeleteError(apiError(err, "Could not delete client account."));
    } finally {
      setDeleteBusy(false);
    }
  };

  const applyBulkAssign = async () => {
    setBulkError("");
    setBulkBusy(true);
    try {
      const assigned_trainer_id =
        bulkTrainer === UNASSIGNED ? null : Number(bulkTrainer);
      await api.patch("/admin/clients/assign-trainer", {
        client_ids: [...selected],
        assigned_trainer_id,
      });
      setSelected(new Set());
      setBulkTrainer(UNASSIGNED);
      load(q.trim(), tab);
    } catch (err) {
      setBulkError(apiError(err, "Could not bulk-assign those clients."));
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-[1px]">Clients</h2>
          <p className="text-sm text-white/40">
            Manage your client accounts, approve registrations, and assign coaches.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or email…"
              className="field-input !pl-9 w-64 sm:w-72"
            />
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setCreateError("");
                setCreateForm(INITIAL_FORM);
                setShowCreateModal(true);
              }}
              className="btn-primary flex items-center gap-2 !px-4 !py-2.5 !text-xs font-semibold"
            >
              <UserPlus size={16} /> Add Client
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-800 pb-2">
        <button
          onClick={() => setTab("all")}
          className={`rounded-sm px-3.5 py-1.5 text-xs font-medium transition-colors ${
            tab === "all"
              ? "bg-gold/15 text-gold border border-gold/30"
              : "text-white/50 hover:text-white"
          }`}
        >
          All Clients
        </button>
        <button
          onClick={() => setTab("pending")}
          className={`relative rounded-sm px-3.5 py-1.5 text-xs font-medium transition-colors ${
            tab === "pending"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "text-white/50 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Clock size={13} />
            Pending Approval
            {pendingCount > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-ink-950">
                {pendingCount}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setTab("active")}
          className={`rounded-sm px-3.5 py-1.5 text-xs font-medium transition-colors ${
            tab === "active"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "text-white/50 hover:text-white"
          }`}
        >
          Approved / Active
        </button>
      </div>

      {/* Bulk actions bar for Admin */}
      {isAdmin && selected.size > 0 && (
        <div className="card flex flex-wrap items-center gap-3 !py-4">
          <UserCog size={18} className="text-gold" />
          <span className="text-sm text-white/70">
            {selected.size} client{selected.size > 1 ? "s" : ""} selected
          </span>
          <select
            value={bulkTrainer}
            onChange={(e) => setBulkTrainer(e.target.value)}
            className="rounded-sm border border-ink-700 bg-ink-950 px-3 py-2 text-sm outline-none focus:border-gold"
          >
            <option value={UNASSIGNED}>Unassign</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.first_name} {t.last_name}
              </option>
            ))}
          </select>
          <button
            onClick={applyBulkAssign}
            disabled={bulkBusy}
            className="btn-primary !px-5 !py-2.5 !text-xs"
          >
            {bulkBusy ? "Applying…" : "Apply"}
          </button>
          <button
            onClick={() => {
              setSelected(new Set());
              setBulkError("");
            }}
            className="text-xs text-white/40 hover:text-white"
          >
            Clear selection
          </button>
          {bulkError && <p className="w-full text-sm text-danger">{bulkError}</p>}
        </div>
      )}

      {/* Client Table Card */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-white/40">Loading clients…</div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Users size={40} className="text-gold/50" />
            <p className="mt-4 text-white/60">
              {q
                ? "No clients match your search."
                : tab === "pending"
                ? "No pending approvals at this time."
                : "No clients found."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {rowError && (
              <div className="px-6 pt-4">
                <p className="text-sm text-danger">{rowError}</p>
              </div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-white/40">
                  {isAdmin && (
                    <th className="px-6 py-3 font-medium">
                      <input
                        type="checkbox"
                        checked={
                          selected.size > 0 && selected.size === clients.length
                        }
                        onChange={toggleSelectAll}
                        className="accent-gold"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Goal</th>
                  {isAdmin && (
                    <th className="px-6 py-3 font-medium">Assigned Trainer</th>
                  )}
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium">Approval / Status</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-ink-800 hover:bg-ink-800/40 transition-colors"
                  >
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
                      <Link
                        to={`/clients/${c.id}`}
                        className="font-medium text-white hover:text-gold"
                      >
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
                            c.assigned_trainer_id
                              ? "border-ink-700 text-white"
                              : "border-gold/30 text-gold"
                          }`}
                        >
                          <option value={UNASSIGNED}>Unassigned</option>
                          {trainers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.first_name} {t.last_name}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td className="px-6 py-3 text-white/60">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {c.is_approved === false ? (
                          <span className="inline-flex items-center gap-1 rounded-sm border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                            <Clock size={11} /> Pending Approval
                          </span>
                        ) : c.is_active ? (
                          <span className="rounded-sm border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-sm border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white/50">
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && c.is_approved === false && (
                          <button
                            onClick={() => approveClient(c.id)}
                            disabled={rowBusyId === c.id}
                            title="Approve client account"
                            className="inline-flex items-center gap-1 rounded-sm bg-emerald-600/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={13} /> Approve
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setDeleteError("");
                              setClientToDelete(c);
                            }}
                            title="Delete client account"
                            className="p-1.5 text-white/40 hover:text-danger rounded hover:bg-ink-800 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        <Link
                          to={`/clients/${c.id}`}
                          className="p-1.5 text-white/30 hover:text-gold rounded hover:bg-ink-800 transition-colors"
                        >
                          <ChevronRight size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE CLIENT MODAL ────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-lg space-y-5 border border-ink-700 bg-ink-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-gold" />
                <h3 className="font-display text-xl text-white">
                  Add New Client
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="rounded-sm bg-danger/10 border border-danger/30 p-3 text-xs text-danger">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">First Name *</label>
                  <input
                    required
                    value={createForm.first_name}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        first_name: e.target.value,
                      })
                    }
                    placeholder="Jordan"
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="field-label">Last Name</label>
                  <input
                    value={createForm.last_name}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        last_name: e.target.value,
                      })
                    }
                    placeholder="Lee"
                    className="field-input"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Email Address *</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  placeholder="client@email.com"
                  className="field-input"
                />
              </div>

              <div>
                <label className="field-label">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  placeholder="At least 6 characters"
                  className="field-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Phone</label>
                  <input
                    value={createForm.phone}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, phone: e.target.value })
                    }
                    placeholder="(555) 000-0000"
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="field-label">Goal</label>
                  <input
                    value={createForm.goal}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, goal: e.target.value })
                    }
                    placeholder="e.g. Fat Loss"
                    className="field-input"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Assign Coach</label>
                <select
                  value={createForm.assigned_trainer_id}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      assigned_trainer_id: e.target.value,
                    })
                  }
                  className="field-input"
                >
                  <option value={UNASSIGNED}>Unassigned</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-white/40">
                * Clients created by an administrator are automatically approved for portal access.
              </p>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-outline !px-5 !py-2.5 !text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBusy}
                  className="btn-primary !px-6 !py-2.5 !text-xs font-semibold disabled:opacity-50"
                >
                  {createBusy ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={14} className="animate-spin" /> Creating…
                    </span>
                  ) : (
                    "Create Client Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CLIENT CONFIRMATION MODAL ──────────────────────── */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md space-y-4 border border-danger/30 bg-ink-950 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-danger">
              <AlertTriangle size={24} />
              <h3 className="font-display text-xl">Delete Client Account?</h3>
            </div>

            <p className="text-sm text-white/70">
              Are you sure you want to permanently delete{" "}
              <strong className="text-white">
                {clientToDelete.first_name} {clientToDelete.lastToDelete || clientToDelete.last_name}
              </strong>{" "}
              ({clientToDelete.email})?
            </p>

            <p className="text-xs text-white/40">
              This action cannot be undone. All assigned coaching notes, progress logs, and portal access will be permanently removed.
            </p>

            {deleteError && (
              <div className="rounded-sm bg-danger/10 border border-danger/30 p-2.5 text-xs text-danger">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="btn-outline !px-5 !py-2 !text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteBusy}
                className="rounded-sm bg-danger px-5 py-2 text-xs font-semibold text-white hover:bg-danger/80 disabled:opacity-50 transition-colors"
              >
                {deleteBusy ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={14} className="animate-spin" /> Deleting…
                  </span>
                ) : (
                  "Yes, Delete Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}