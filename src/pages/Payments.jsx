import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { api } from "../lib/api";
import { formatCurrency, formatDate, STATUS_STYLES } from "../lib/utils";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/payments").then(({ data }) => setPayments(data)).finally(() => setLoading(false));
  }, []);

  const succeeded = payments.filter((p) => p.status === "succeeded");
  const total = succeeded.reduce((s, p) => s + p.amount_cents, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl tracking-[1px]">Payments</h2>
        <p className="text-sm text-white/40">All transactions across your clients.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <span className="text-xs uppercase tracking-wider text-white/40">Total Revenue</span>
          <div className="mt-2 font-display text-3xl text-gold">{formatCurrency(total)}</div>
        </div>
        <div className="card">
          <span className="text-xs uppercase tracking-wider text-white/40">Successful</span>
          <div className="mt-2 font-display text-3xl text-white">{succeeded.length}</div>
        </div>
        <div className="card">
          <span className="text-xs uppercase tracking-wider text-white/40">Total Records</span>
          <div className="mt-2 font-display text-3xl text-white">{payments.length}</div>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-white/40">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <CreditCard size={40} className="text-gold" />
            <p className="mt-4 text-white/60">No payments recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Client ID</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-ink-800">
                    <td className="px-6 py-3">{formatDate(p.created_at)}</td>
                    <td className="px-6 py-3 text-white/60">#{p.user_id ?? "—"}</td>
                    <td className="px-6 py-3 text-white/70">{p.description || "—"}</td>
                    <td className="px-6 py-3 font-medium">{formatCurrency(p.amount_cents)}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-sm border px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[p.status] || ""}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
