import { useEffect, useState } from "react";
import {
  Loader2, Mail, Send, RotateCw, X, ShieldCheck, Users as UsersIcon, LayoutGrid,
} from "lucide-react";
import { api, apiError } from "../lib/api";
import { formatDate, formatDateTime, STATUS_STYLES } from "../lib/utils";

const ROLES = ["trainer", "admin"];

// ── Small shared bits ────────────────────────────────────────────────────

function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="rounded-sm border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{message}</div>;
}

function SavedBanner({ show, children }) {
  if (!show) return null;
  return (
    <div className="rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
      {children || "Saved."}
    </div>
  );
}

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
        checked ? "border-gold bg-gold" : "border-ink-700 bg-ink-950"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ── Invite team member ───────────────────────────────────────────────────

function InviteForm({ onInvited }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("trainer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!email.trim()) {
      setError("Enter an email address to invite.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/role-matrix/invitations", { email: email.trim(), role });
      setEmail("");
      setSaved(true);
      onInvited();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(apiError(err, "Could not send that invitation."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Invite Your Team</h3>
      <p className="mt-1 text-sm text-white/40">
        Send an email invite — they'll set their own password and land straight in the console.
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="field-label">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input"
            placeholder="coach@trainpeakphysique.com"
          />
        </div>
        <div className="sm:w-40">
          <label className="field-label">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="field-input capitalize">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button type="submit" disabled={busy} className="btn-primary sm:w-auto">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Send Invite
        </button>
      </form>
      <div className="mt-3 space-y-2">
        <ErrorBanner message={error} />
        <SavedBanner show={saved}>Invitation sent.</SavedBanner>
      </div>
    </div>
  );
}

// ── Pending / past invitations ──────────────────────────────────────────

function InvitationsTable({ invitations, loading, onChanged }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const resend = async (id) => {
    setError("");
    setBusyId(id);
    try {
      await api.post(`/role-matrix/invitations/${id}/resend`);
      onChanged();
    } catch (err) {
      setError(apiError(err, "Could not resend that invitation."));
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (id) => {
    setError("");
    setBusyId(id);
    try {
      await api.delete(`/role-matrix/invitations/${id}`);
      onChanged();
    } catch (err) {
      setError(apiError(err, "Could not cancel that invitation."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="px-6 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Invitations</h3>
      </div>
      {error && <div className="px-6 pb-3"><ErrorBanner message={error} /></div>}
      {loading ? (
        <div className="px-6 pb-6 text-sm text-white/40">Loading…</div>
      ) : invitations.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <Mail size={36} className="text-gold" />
          <p className="mt-4 text-white/60">No invitations sent yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-white/40">
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Expires</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id} className="border-t border-ink-800">
                  <td className="px-6 py-3">{inv.email}</td>
                  <td className="px-6 py-3 capitalize text-white/70">{inv.role}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-sm border px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[inv.status] || ""}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-white/50">{formatDate(inv.expires_at)}</td>
                  <td className="px-6 py-3">
                    {inv.status === "pending" || inv.status === "expired" ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resend(inv.id)}
                          disabled={busyId === inv.id}
                          title="Resend invitation"
                          className="rounded-sm border border-ink-700 p-1.5 text-white/60 hover:border-gold hover:text-gold disabled:opacity-40"
                        >
                          <RotateCw size={14} />
                        </button>
                        {inv.status === "pending" && (
                          <button
                            onClick={() => cancel(inv.id)}
                            disabled={busyId === inv.id}
                            title="Cancel invitation"
                            className="rounded-sm border border-ink-700 p-1.5 text-white/60 hover:border-danger hover:text-danger disabled:opacity-40"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-white/30">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Staff roster ─────────────────────────────────────────────────────────

function StaffRoster({ staff, loading, onChanged }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const updateUser = async (id, payload) => {
    setError("");
    setBusyId(id);
    try {
      await api.patch(`/admin/users/${id}`, payload);
      onChanged();
    } catch (err) {
      setError(apiError(err, "Could not update that account."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="px-6 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Team &amp; Access</h3>
      </div>
      {error && <div className="px-6 pb-3"><ErrorBanner message={error} /></div>}
      {loading ? (
        <div className="px-6 pb-6 text-sm text-white/40">Loading…</div>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <UsersIcon size={36} className="text-gold" />
          <p className="mt-4 text-white/60">No staff accounts yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-white/40">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Active</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-t border-ink-800">
                  <td className="px-6 py-3 font-medium">{s.first_name} {s.last_name}</td>
                  <td className="px-6 py-3 text-white/60">{s.email}</td>
                  <td className="px-6 py-3">
                    <select
                      value={s.role}
                      onChange={(e) => updateUser(s.id, { role: e.target.value })}
                      disabled={busyId === s.id}
                      className="rounded-sm border border-ink-700 bg-ink-950 px-2 py-1.5 text-xs capitalize outline-none focus:border-gold disabled:opacity-40"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-3">
                    <Toggle
                      checked={s.is_active}
                      disabled={busyId === s.id}
                      onChange={(next) => updateUser(s.id, { is_active: next })}
                      label={`${s.email} active`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Permission matrix ────────────────────────────────────────────────────

function AccessMatrix({ rules, loading, onChanged }) {
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState("");

  const setAccess = async (moduleKey, canAccess) => {
    setError("");
    setBusyKey(moduleKey);
    try {
      await api.put(`/role-matrix/rules/${moduleKey}`, { can_access: canAccess });
      onChanged();
    } catch (err) {
      setError(apiError(err, "Could not update that permission."));
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="px-6 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Edit Matrix</h3>
        <p className="mt-1 text-sm text-white/40">
          Control which dashboard sections Trainers can see. Admins always have full access.
        </p>
      </div>
      {error && <div className="px-6 pb-3"><ErrorBanner message={error} /></div>}
      {loading ? (
        <div className="px-6 pb-6 text-sm text-white/40">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-white/40">
                <th className="px-6 py-3 font-medium">Module / Page</th>
                <th className="px-6 py-3 font-medium">Admin</th>
                <th className="px-6 py-3 font-medium">Trainer</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((row) => (
                <tr key={row.module_key} className="border-t border-ink-800">
                  <td className="px-6 py-3 font-medium">{row.label}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-sm border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs text-gold">
                      <ShieldCheck size={12} /> Always on
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <Toggle
                      checked={row.trainer_access}
                      disabled={busyKey === row.module_key}
                      onChange={(next) => setAccess(row.module_key, next)}
                      label={`Trainer access to ${row.label}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function RoleMatrix() {
  const [invitations, setInvitations] = useState([]);
  const [staff, setStaff] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      api.get("/role-matrix/invitations"),
      api.get("/role-matrix/staff"),
      api.get("/role-matrix/rules"),
    ])
      .then(([inv, st, ru]) => {
        setInvitations(inv.data);
        setStaff(st.data);
        setRules(ru.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl tracking-[1px]">Role Matrix</h2>
        <p className="text-sm text-white/40">
          Invite new Admins or Trainers, and control what each role can access.
        </p>
      </div>

      <InviteForm onInvited={load} />
      <InvitationsTable invitations={invitations} loading={loading} onChanged={load} />
      <StaffRoster staff={staff} loading={loading} onChanged={load} />
      <AccessMatrix rules={rules} loading={loading} onChanged={load} />

      <p className="flex items-center gap-2 text-xs text-white/30">
        <LayoutGrid size={12} /> Access changes apply immediately — no redeploy needed.
      </p>
    </div>
  );
}