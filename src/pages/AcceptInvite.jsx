import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck, XCircle } from "lucide-react";
import { api, apiError, tokenStore } from "../lib/api";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [preview, setPreview] = useState(null); // { email, role } | null
  const [previewError, setPreviewError] = useState("");
  const [checking, setChecking] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setPreviewError("This invitation link is missing its token.");
      setChecking(false);
      return;
    }
    api
      .get("/role-matrix/invitations/accept", { params: { token } })
      .then(({ data }) => setPreview(data))
      .catch((err) => setPreviewError(apiError(err, "This invitation link is invalid or has expired.")))
      .finally(() => setChecking(false));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!firstName.trim()) {
      setError("Enter your first name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/role-matrix/invitations/accept", {
        token,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
      });
      tokenStore.set(data);
      // Full reload so AuthContext re-initializes cleanly with the new
      // session, same pattern the axios interceptor uses on refresh failure.
      window.location.href = "/";
    } catch (err) {
      setError(apiError(err, "Could not accept this invitation."));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6"
      style={{ background: "linear-gradient(135deg,#1a1000,#0A0A0A)" }}>
      <div className="gold-grid pointer-events-none fixed inset-0 opacity-40" />
      <div className="relative w-full max-w-sm">
        <div className="text-center">
          <div className="font-display text-3xl tracking-[3px] text-gold">
            PEAK<span className="text-white">PHYSIQUE</span>
          </div>
          <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[3px] text-white/40">
            <ShieldCheck size={13} className="text-gold" /> Coach Console
          </div>
        </div>

        <div className="mt-8 rounded-sm border border-ink-700 bg-ink-900/80 p-7 backdrop-blur">
          {checking ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center text-white/50">
              <Loader2 size={24} className="animate-spin text-gold" />
              Checking your invitation…
            </div>
          ) : previewError ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <XCircle size={40} className="text-danger" />
              <p className="text-sm text-white/60">{previewError}</p>
              <a href="/login" className="btn-outline mt-2">Back to Sign In</a>
            </div>
          ) : (
            <>
              <h1 className="h-display text-3xl">Join the Team</h1>
              <p className="mt-1 text-sm text-white/50">
                You're invited as <span className="capitalize text-gold">{preview.role}</span> — set a password to
                activate <span className="text-white">{preview.email}</span>.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">First name</label>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="field-input" placeholder="Jordan" />
                  </div>
                  <div>
                    <label className="field-label">Last name</label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="field-input" placeholder="Ade" />
                  </div>
                </div>
                <div>
                  <label className="field-label">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field-input" placeholder="••••••••" />
                </div>
                <div>
                  <label className="field-label">Confirm password</label>
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="field-input" placeholder="••••••••" />
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <button disabled={busy} className="btn-primary w-full">
                  {busy ? <><Loader2 size={18} className="animate-spin" /> Setting up…</> : "Activate Account"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}