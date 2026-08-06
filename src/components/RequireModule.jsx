import { ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function RequireModule({ module, children }) {
  const { user, can } = useAuth();
  if (!user) return null; // ProtectedRoute above already handles signed-out visitors

  if (!can(module)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-ink-800 bg-ink-900 py-20 text-center">
        <ShieldAlert size={40} className="text-gold" />
        <h3 className="font-display text-2xl tracking-[1px]">Access Restricted</h3>
        <p className="max-w-sm text-sm text-white/50">
          You don't have permission to view this section. Ask an Admin to grant access from Role Matrix.
        </p>
      </div>
    );
  }

  return children;
}