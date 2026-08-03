import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiError } from "../lib/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.message?.includes("coaches") ? err.message : apiError(err, "Invalid email or password."));
    } finally {
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
          <h1 className="h-display text-3xl">Sign In</h1>
          <p className="mt-1 text-sm text-white/50">Trainer &amp; admin access only.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="field-label">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" placeholder="coach@trainpeakphysique.com" />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field-input" placeholder="••••••••" />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button disabled={busy} className="btn-primary w-full">
              {busy ? <><Loader2 size={18} className="animate-spin" /> Signing in…</> : "Enter Dashboard"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-white/30">
          Login to manage bookings, clients, payments, and site content. Only authorized coaches and admins may access this console.
        </p>
      </div>
    </div>
  );
}
