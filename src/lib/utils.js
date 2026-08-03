export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(cents, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format((cents || 0) / 100);
}

export function formatDate(value, opts = { month: "short", day: "numeric", year: "numeric" }) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", opts);
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const STATUS_STYLES = {
  pending: "bg-gold/15 text-gold border-gold/30",
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  completed: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  cancelled: "bg-danger/15 text-danger border-danger/30",
  succeeded: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  failed: "bg-danger/15 text-danger border-danger/30",
  refunded: "bg-white/10 text-white/60 border-white/20",
};
