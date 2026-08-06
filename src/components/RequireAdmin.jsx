import { ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (!user) return null; // ProtectedRoute above already handles signed-out visitors

  if (user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-ink-800 bg-ink-900 py-20 text-center">
        <ShieldAlert size={40} className="text-gold" />
        <h3 className="font-display text-2xl tracking-[1px]">Admins Only</h3>
        <p className="max-w-sm text-sm text-white/50">Role Matrix is only available to Admin accounts.</p>
      </div>
    );
  }

  return children;
}