import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, CalendarDays, CreditCard, FileText, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  { to: "/", end: true, icon: LayoutDashboard, label: "Overview" },
  { to: "/clients", icon: Users, label: "Clients" },
  { to: "/bookings", icon: CalendarDays, label: "Bookings" },
  { to: "/payments", icon: CreditCard, label: "Payments" },
  { to: "/content", icon: FileText, label: "Site Content" },
];

export default function Sidebar({ onNavigate }) {
  const { logout } = useAuth();
  return (
    <div className="flex h-full flex-col p-6">
      <div className="font-display text-2xl tracking-[3px] text-gold">
        PEAK<span className="text-white">PHYSIQUE</span>
      </div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[3px] text-white/30">
        Coach Console
      </div>
      <nav className="mt-10 flex-1 space-y-1">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-sm px-4 py-3 text-sm font-medium transition-colors ${
                isActive ? "bg-gold text-ink-950" : "text-white/60 hover:bg-ink-800 hover:text-white"
              }`
            }
          >
            <n.icon size={18} /> {n.label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={logout}
        className="mt-6 flex items-center gap-3 rounded-sm border-t border-ink-800 px-4 py-3 pt-4 text-sm text-white/50 hover:text-danger"
      >
        <LogOut size={18} /> Sign out
      </button>
    </div>
  );
}
