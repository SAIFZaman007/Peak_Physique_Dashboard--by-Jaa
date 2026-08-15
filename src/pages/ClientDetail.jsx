import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  ArrowLeft, Mail, Target, Scale, CalendarDays, Activity, MessageSquare, UserCog,
  NotebookPen, Apple, Dumbbell, Plus, Pencil, Trash2, CheckCircle, Clock,
  AlertTriangle, Loader2,
} from "lucide-react";
import { api, apiError } from "../lib/api";
import { formatDate, formatDateTime } from "../lib/utils";
import { useAuth } from "../context/AuthContext.jsx";

const UNASSIGNED = "unassigned";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [detail, setDetail] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [trainers, setTrainers] = useState([]);
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignError, setAssignError] = useState("");

  const [approveBusy, setApproveBusy] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadData = () => {
    Promise.all([api.get(`/admin/clients/${id}`), api.get(`/progress/user/${id}`)])
      .then(([d, p]) => {
        setDetail(d.data);
        setProgress(p.data);
      })
      .catch(() => setError("Could not load this client."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
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

  const approveClient = async () => {
    setAssignError("");
    setApproveBusy(true);
    try {
      const { data } = await api.patch(`/admin/clients/${id}/approve`);
      setDetail((d) => ({ ...d, user: data }));
    } catch (err) {
      setAssignError(apiError(err, "Could not approve this client account."));
    } finally {
      setApproveBusy(false);
    }
  };

  const handleDeleteClient = async () => {
    setDeleteError("");
    setDeleteBusy(true);
    try {
      await api.delete(`/admin/clients/${id}`);
      navigate("/clients", { replace: true });
    } catch (err) {
      setDeleteError(apiError(err, "Could not delete client account."));
      setDeleteBusy(false);
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
          <div className="flex flex-wrap items-center gap-3">
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

            {u.is_approved === false ? (
              <span className="inline-flex items-center gap-1 rounded-sm border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
                <Clock size={12} /> Pending Approval
              </span>
            ) : (
              <span className={`rounded-sm border px-3 py-1 text-xs ${
                u.is_active ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400" : "border-white/20 bg-white/10 text-white/50"
              }`}>
                {u.is_active ? "Active" : "Inactive"}
              </span>
            )}

            {isAdmin && u.is_approved === false && (
              <button
                onClick={approveClient}
                disabled={approveBusy}
                className="inline-flex items-center gap-1.5 rounded-sm bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {approveBusy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                Approve Client
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => {
                  setDeleteError("");
                  setShowDeleteModal(true);
                }}
                className="p-2 text-white/40 hover:text-danger rounded border border-ink-800 hover:border-danger/40 transition-colors"
                title="Delete this client"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
        {assignError && <p className="mt-3 text-sm text-danger">{assignError}</p>}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md space-y-4 border border-danger/30 bg-ink-950 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-danger">
              <AlertTriangle size={24} />
              <h3 className="font-display text-xl">Delete Client Account?</h3>
            </div>
            <p className="text-sm text-white/70">
              Are you sure you want to permanently delete <strong className="text-white">{u.first_name} {u.last_name}</strong> ({u.email})?
            </p>
            <p className="text-xs text-white/40">
              All personal logs, notes, plans, and portal access will be permanently deleted. This cannot be undone.
            </p>
            {deleteError && (
              <div className="rounded-sm bg-danger/10 border border-danger/30 p-2.5 text-xs text-danger">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn-outline !px-5 !py-2 !text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
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

      <CoachingWorkspace clientId={u.id} />
    </div>
  );
}

// ── Coaching Workspace — Notes / Nutrition / Workouts ────────────────────
//
// Replaced the revenue widget on the Trainer dashboard home page (see
// Overview.jsx) — this is where that work actually happens, one client at
// a time. Each tab is its own small CRUD panel talking to
// app/api/routes/coaching.py; visibility of a tab follows the same Role
// Matrix module a Trainer's sidebar/dashboard already respects (see
// AuthContext.can), and each entry's Edit/Delete controls only appear for
// its original author or an Admin — mirroring the backend's own rule so
// nobody sees a control that would just 403.

const WORKSPACE_TABS = [
  { key: "notes", label: "Notes", module: "notes" },
  { key: "nutrition", label: "Nutrition", module: "nutrition" },
  { key: "workouts", label: "Workouts", module: "workouts" },
];

function CoachingWorkspace({ clientId }) {
  const { can } = useAuth();
  const visibleTabs = WORKSPACE_TABS.filter((t) => can(t.module));
  const [tab, setTab] = useState(visibleTabs[0]?.key || null);

  useEffect(() => {
    if (!visibleTabs.some((t) => t.key === tab)) {
      setTab(visibleTabs[0]?.key || null);
    }
    // Re-check only when the client changes or the visible tab set itself
    // changes shape — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, visibleTabs.map((t) => t.key).join(",")]);

  if (visibleTabs.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Coaching Workspace</h3>
      <div className="flex gap-2 border-b border-ink-800">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-gold text-gold" : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "notes" && <NotesPanel clientId={clientId} />}
      {tab === "nutrition" && <NutritionPanel clientId={clientId} />}
      {tab === "workouts" && <WorkoutsPanel clientId={clientId} />}
    </div>
  );
}

// A staff member may edit/delete only what they authored — Admins can
// touch anything. Mirrors _ensure_author_or_admin on the backend so the
// UI never offers a control that would just come back 403.
function canEditRecord(record, user) {
  return user?.role === "admin" || record.trainer_id === user?.id;
}

// ── Notes ─────────────────────────────────────────────────────────────

const EMPTY_NOTE = { content: "" };

function NotesPanel({ clientId }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get(`/notes/client/${clientId}`).then(({ data }) => setItems(data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, [clientId]);

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      if (editing.id) {
        await api.patch(`/notes/${editing.id}`, { content: editing.content });
      } else {
        await api.post("/notes", { client_id: clientId, content: editing.content });
      }
      setEditing(null);
      load();
    } catch (e) {
      setError(apiError(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this note? This can't be undone.")) return;
    await api.delete(`/notes/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing({ ...EMPTY_NOTE })} className="btn-primary !px-5 !py-2.5 !text-xs">
          <Plus size={16} /> Add Note
        </button>
      </div>

      {editing && (
        <div className="card space-y-4">
          {error && <p className="text-sm text-danger">{error}</p>}
          <div>
            <label className="field-label">Note</label>
            <textarea
              className="field-input min-h-[110px]"
              placeholder="What did you cover with this client, what should you follow up on…"
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saving || !editing.content.trim()}
              className="btn-primary !px-6 !py-2.5 !text-xs disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setEditing(null)} className="btn-outline !px-6 !py-2.5 !text-xs">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-white/40">Loading…</p>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <NotebookPen size={32} className="text-gold" />
          <p className="mt-3 text-sm text-white/50">No notes yet — add the first one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{n.trainer_name}</p>
                  <p className="mt-0.5 text-[11px] text-white/30">{formatDateTime(n.created_at)}</p>
                </div>
                {canEditRecord(n, user) && (
                  <div className="flex gap-3">
                    <button onClick={() => setEditing({ id: n.id, content: n.content })} className="text-white/50 hover:text-gold">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(n.id)} className="text-white/50 hover:text-danger">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-white/80">{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Nutrition plans ───────────────────────────────────────────────────

const EMPTY_NUTRITION = {
  title: "Nutrition Plan", content: "",
  calories_target: "", protein_target_g: "", carbs_target_g: "", fat_target_g: "",
};

function toIntOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function NutritionPanel({ clientId }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get(`/nutrition-plans/client/${clientId}`).then(({ data }) => setItems(data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, [clientId]);

  const save = async () => {
    setError("");
    setSaving(true);
    const payload = {
      title: editing.title || "Nutrition Plan",
      content: editing.content,
      calories_target: toIntOrNull(editing.calories_target),
      protein_target_g: toIntOrNull(editing.protein_target_g),
      carbs_target_g: toIntOrNull(editing.carbs_target_g),
      fat_target_g: toIntOrNull(editing.fat_target_g),
    };
    try {
      if (editing.id) {
        await api.patch(`/nutrition-plans/${editing.id}`, payload);
      } else {
        await api.post("/nutrition-plans", { client_id: clientId, ...payload });
      }
      setEditing(null);
      load();
    } catch (e) {
      setError(apiError(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this nutrition plan? This can't be undone.")) return;
    await api.delete(`/nutrition-plans/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing({ ...EMPTY_NUTRITION })} className="btn-primary !px-5 !py-2.5 !text-xs">
          <Plus size={16} /> Add Nutrition Plan
        </button>
      </div>

      {editing && (
        <div className="card space-y-4">
          {error && <p className="text-sm text-danger">{error}</p>}
          <div>
            <label className="field-label">Title</label>
            <input
              className="field-input"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="field-label">Calories</label>
              <input type="number" min={0} className="field-input" value={editing.calories_target}
                onChange={(e) => setEditing({ ...editing, calories_target: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Protein (g)</label>
              <input type="number" min={0} className="field-input" value={editing.protein_target_g}
                onChange={(e) => setEditing({ ...editing, protein_target_g: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Carbs (g)</label>
              <input type="number" min={0} className="field-input" value={editing.carbs_target_g}
                onChange={(e) => setEditing({ ...editing, carbs_target_g: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Fat (g)</label>
              <input type="number" min={0} className="field-input" value={editing.fat_target_g}
                onChange={(e) => setEditing({ ...editing, fat_target_g: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="field-label">Plan details</label>
            <textarea
              className="field-input min-h-[140px]"
              placeholder="Meals, timing, substitutions, notes for the client…"
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saving || !editing.content.trim()}
              className="btn-primary !px-6 !py-2.5 !text-xs disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setEditing(null)} className="btn-outline !px-6 !py-2.5 !text-xs">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-white/40">Loading…</p>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <Apple size={32} className="text-gold" />
          <p className="mt-3 text-sm text-white/50">No nutrition plans yet — add the first one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{n.title}</p>
                  <p className="mt-0.5 text-[11px] text-white/30">{n.trainer_name} · {formatDateTime(n.created_at)}</p>
                </div>
                {canEditRecord(n, user) && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditing({
                        id: n.id, title: n.title, content: n.content,
                        calories_target: n.calories_target ?? "", protein_target_g: n.protein_target_g ?? "",
                        carbs_target_g: n.carbs_target_g ?? "", fat_target_g: n.fat_target_g ?? "",
                      })}
                      className="text-white/50 hover:text-gold"
                    >
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(n.id)} className="text-white/50 hover:text-danger">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
              {(n.calories_target != null || n.protein_target_g != null || n.carbs_target_g != null || n.fat_target_g != null) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {n.calories_target != null && (
                    <span className="rounded-sm border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] text-gold">{n.calories_target} kcal</span>
                  )}
                  {n.protein_target_g != null && (
                    <span className="rounded-sm border border-ink-700 px-2 py-0.5 text-[11px] text-white/60">P {n.protein_target_g}g</span>
                  )}
                  {n.carbs_target_g != null && (
                    <span className="rounded-sm border border-ink-700 px-2 py-0.5 text-[11px] text-white/60">C {n.carbs_target_g}g</span>
                  )}
                  {n.fat_target_g != null && (
                    <span className="rounded-sm border border-ink-700 px-2 py-0.5 text-[11px] text-white/60">F {n.fat_target_g}g</span>
                  )}
                </div>
              )}
              <p className="mt-3 whitespace-pre-wrap text-sm text-white/80">{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Workout plans ─────────────────────────────────────────────────────

const EMPTY_WORKOUT = { title: "Workout Plan", content: "" };

function WorkoutsPanel({ clientId }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get(`/workout-plans/client/${clientId}`).then(({ data }) => setItems(data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, [clientId]);

  const save = async () => {
    setError("");
    setSaving(true);
    const payload = { title: editing.title || "Workout Plan", content: editing.content };
    try {
      if (editing.id) {
        await api.patch(`/workout-plans/${editing.id}`, payload);
      } else {
        await api.post("/workout-plans", { client_id: clientId, ...payload });
      }
      setEditing(null);
      load();
    } catch (e) {
      setError(apiError(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this workout plan? This can't be undone.")) return;
    await api.delete(`/workout-plans/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing({ ...EMPTY_WORKOUT })} className="btn-primary !px-5 !py-2.5 !text-xs">
          <Plus size={16} /> Add Workout Plan
        </button>
      </div>

      {editing && (
        <div className="card space-y-4">
          {error && <p className="text-sm text-danger">{error}</p>}
          <div>
            <label className="field-label">Title</label>
            <input
              className="field-input"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Program</label>
            <textarea
              className="field-input min-h-[140px]"
              placeholder="Exercises, sets/reps, weekly split, progression notes…"
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saving || !editing.content.trim()}
              className="btn-primary !px-6 !py-2.5 !text-xs disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setEditing(null)} className="btn-outline !px-6 !py-2.5 !text-xs">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-white/40">Loading…</p>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <Dumbbell size={32} className="text-gold" />
          <p className="mt-3 text-sm text-white/50">No workout plans yet — add the first one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{n.title}</p>
                  <p className="mt-0.5 text-[11px] text-white/30">{n.trainer_name} · {formatDateTime(n.created_at)}</p>
                </div>
                {canEditRecord(n, user) && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditing({ id: n.id, title: n.title, content: n.content })}
                      className="text-white/50 hover:text-gold"
                    >
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(n.id)} className="text-white/50 hover:text-danger">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-white/80">{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}