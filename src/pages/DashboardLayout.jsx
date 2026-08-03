import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "../components/Sidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const initials = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-ink-950 lg:flex">
      <aside className="hidden lg:block w-64 shrink-0 border-r border-ink-800 bg-ink-900">
        <Sidebar />
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-ink-800 bg-ink-900 px-5 py-4 lg:hidden">
        <span className="font-display text-xl tracking-[3px] text-gold">PEAK<span className="text-white">PHYSIQUE</span></span>
        <button onClick={() => setOpen(true)} className="text-white"><Menu size={24} /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-ink-800 bg-ink-900">
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4 z-10 text-white/60"><X size={22} /></button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1">
        <header className="hidden items-center justify-end gap-3 border-b border-ink-800 px-8 py-4 lg:flex">
          <div className="text-right">
            <div className="text-sm font-medium">{user?.first_name} {user?.last_name}</div>
            <div className="text-xs capitalize text-gold">{user?.role}</div>
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gold text-sm font-bold text-ink-950">
            {initials || "PP"}
          </div>
        </header>
        <div className="p-5 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
