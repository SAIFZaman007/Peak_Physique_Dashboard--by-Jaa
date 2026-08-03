import { useEffect, useState } from "react";
import { Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { api, apiError } from "../lib/api";
import ImageUploader from "../components/ImageUploader.jsx";

const TABS = [
  { key: "services", label: "Services" },
  { key: "testimonials", label: "Testimonials" },
  { key: "copy", label: "Page Sections" },
];

export default function Content() {
  const [tab, setTab] = useState("services");
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl tracking-[1px]">Site Content</h2>
        <p className="text-sm text-white/40">
          Everything here is live on the marketing site immediately — no deploy needed.
        </p>
      </div>

      <div className="flex gap-2 border-b border-ink-800">
        {TABS.map((t) => (
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

      {tab === "services" && <ServicesPanel />}
      {tab === "testimonials" && <TestimonialsPanel />}
      {tab === "copy" && <SectionsPanel />}
    </div>
  );
}

// ── Shared bits ────────────────────────────────────────────────────────

function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="rounded-sm border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{message}</div>;
}

function SavedBanner({ show }) {
  if (!show) return null;
  return (
    <div className="rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
      Saved — live on the site now.
    </div>
  );
}

// ── Services ───────────────────────────────────────────────────────────

const EMPTY_SERVICE = {
  icon: "Dumbbell", name: "", price_label: "", price_suffix: "starting",
  description: "", image_url: "", is_featured: false, is_active: true, sort_order: 0,
};

function ServicesPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit
  const [error, setError] = useState("");

  const load = () =>
    api.get("/admin/services").then(({ data }) => setItems(data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const save = async () => {
    setError("");
    try {
      if (editing.id) {
        await api.patch(`/admin/services/${editing.id}`, editing);
      } else {
        await api.post("/admin/services", editing);
      }
      setEditing(null);
      load();
    } catch (e) {
      setError(apiError(e));
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this service? This can't be undone.")) return;
    await api.delete(`/admin/services/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing({ ...EMPTY_SERVICE })} className="btn-primary !px-5 !py-2.5 !text-xs">
          <Plus size={16} /> Add Service
        </button>
      </div>

      {editing && (
        <div className="card space-y-4">
          <ErrorBanner message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Name</label>
              <input className="field-input" value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Icon (lucide name)</label>
              <input className="field-input" placeholder="Dumbbell" value={editing.icon}
                onChange={(e) => setEditing({ ...editing, icon: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Price label</label>
              <input className="field-input" placeholder="$149" value={editing.price_label}
                onChange={(e) => setEditing({ ...editing, price_label: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Price suffix</label>
              <input className="field-input" placeholder="starting / session / month" value={editing.price_suffix}
                onChange={(e) => setEditing({ ...editing, price_suffix: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Description</label>
              <textarea className="field-input min-h-[80px]" value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <ImageUploader
                label="Image"
                folder="services"
                value={editing.image_url || ""}
                onChange={(url) => setEditing({ ...editing, image_url: url })}
              />
            </div>
            <div>
              <label className="field-label">Sort order</label>
              <input type="number" className="field-input" value={editing.sort_order}
                onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
            </div>
            <div className="flex items-end gap-6 pb-2">
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={editing.is_featured}
                  onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                Active (visible on site)
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} className="btn-primary !px-6 !py-2.5 !text-xs">Save</button>
            <button onClick={() => setEditing(null)} className="btn-outline !px-6 !py-2.5 !text-xs">Cancel</button>
          </div>
        </div>
      )}

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-white/40">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-white/40">
                <th className="px-6 py-3 font-medium">Image</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Price</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-t border-ink-800">
                  <td className="px-6 py-3">
                    {s.image_url ? (
                      <img src={s.image_url} alt="" className="h-10 w-10 rounded-sm object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-sm border border-dashed border-ink-700" />
                    )}
                  </td>
                  <td className="px-6 py-3 font-medium">{s.name}{s.is_featured && <span className="ml-2 rounded-sm bg-gold/15 px-2 py-0.5 text-[10px] text-gold">FEATURED</span>}</td>
                  <td className="px-6 py-3 text-white/60">{s.price_label} / {s.price_suffix}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-sm border px-2 py-0.5 text-xs ${s.is_active ? "border-emerald-500/30 text-emerald-400" : "border-white/20 text-white/40"}`}>
                      {s.is_active ? "Live" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setEditing(s)} className="text-white/50 hover:text-gold"><Pencil size={16} /></button>
                      <button onClick={() => remove(s.id)} className="text-white/50 hover:text-danger"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Testimonials ───────────────────────────────────────────────────────

const EMPTY_TESTIMONIAL = {
  name: "", role: "", quote: "", rating: 5, result_tag: "", avatar_url: "", is_active: true, sort_order: 0,
};

function TestimonialsPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    api.get("/admin/testimonials").then(({ data }) => setItems(data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const save = async () => {
    setError("");
    try {
      if (editing.id) {
        await api.patch(`/admin/testimonials/${editing.id}`, editing);
      } else {
        await api.post("/admin/testimonials", editing);
      }
      setEditing(null);
      load();
    } catch (e) {
      setError(apiError(e));
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this testimonial?")) return;
    await api.delete(`/admin/testimonials/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing({ ...EMPTY_TESTIMONIAL })} className="btn-primary !px-5 !py-2.5 !text-xs">
          <Plus size={16} /> Add Testimonial
        </button>
      </div>

      {editing && (
        <div className="card space-y-4">
          <ErrorBanner message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Client name</label>
              <input className="field-input" value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Role / tag line</label>
              <input className="field-input" placeholder="Sophomore · Lost 18 lbs" value={editing.role}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Quote</label>
              <textarea className="field-input min-h-[80px]" value={editing.quote}
                onChange={(e) => setEditing({ ...editing, quote: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Result tag</label>
              <input className="field-input" placeholder="Lost 18 lbs" value={editing.result_tag || ""}
                onChange={(e) => setEditing({ ...editing, result_tag: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Rating (1-5)</label>
              <input type="number" min={1} max={5} className="field-input" value={editing.rating}
                onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })} />
            </div>
            <div className="sm:col-span-2">
              <ImageUploader
                label="Avatar (optional)"
                folder="testimonials"
                value={editing.avatar_url || ""}
                onChange={(url) => setEditing({ ...editing, avatar_url: url })}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} className="btn-primary !px-6 !py-2.5 !text-xs">Save</button>
            <button onClick={() => setEditing(null)} className="btn-outline !px-6 !py-2.5 !text-xs">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="text-sm text-white/40">Loading…</div>
        ) : (
          items.map((t) => (
            <div key={t.id} className="card flex flex-col">
              <div className="flex gap-1 text-gold">
                {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="mt-3 flex-1 text-sm text-white/70 line-clamp-4">"{t.quote}"</p>
              <div className="mt-4 flex items-center justify-between border-t border-ink-800 pt-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-display text-gold">
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{t.name}</div>
                    <div className="truncate text-xs text-white/40">{t.role}</div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => setEditing(t)} className="text-white/50 hover:text-gold"><Pencil size={15} /></button>
                  <button onClick={() => remove(t.id)} className="text-white/50 hover:text-danger"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Page sections (hero / about / cta_bottom / focus_strip / booking) ────
// Structured, field-by-field forms — replaces the old raw-JSON textarea
// editor. Each section is still stored as one JSON blob server-side
// (SiteContent.data), so no migration is needed; this just gives the
// trainer real inputs (and image uploads) instead of hand-editing JSON.

const SECTION_TABS = [
  { key: "hero", label: "Hero" },
  { key: "about", label: "About / Mission" },
  { key: "cta_bottom", label: "CTA Band" },
  { key: "focus_strip", label: "Focus Strip" },
  { key: "booking", label: "Booking Panel" },
];

function StatsEditor({ stats = [], onChange }) {
  const set = (i, patch) => onChange(stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const add = () => onChange([...stats, { num: "", label: "" }]);
  const remove = (i) => onChange(stats.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="field-label">Stats row</label>
      <div className="space-y-2">
        {stats.map((s, i) => (
          <div key={i} className="flex gap-2">
            <input className="field-input w-24" placeholder="100%" value={s.num}
              onChange={(e) => set(i, { num: e.target.value })} />
            <input className="field-input flex-1" placeholder="Label" value={s.label}
              onChange={(e) => set(i, { label: e.target.value })} />
            <button type="button" onClick={() => remove(i)} className="px-2 text-white/40 hover:text-danger">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-2 text-xs font-semibold text-gold hover:underline">
        + Add stat
      </button>
    </div>
  );
}

function TagsEditor({ tags = [], onChange }) {
  const [draft, setDraft] = useState("");
  const addTag = () => {
    const v = draft.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setDraft("");
  };
  return (
    <div>
      <label className="field-label">Tags / pills</label>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1.5 rounded-full border border-ink-700 px-3 py-1 text-xs text-white/70">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="text-white/40 hover:text-danger">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className="field-input flex-1"
          placeholder="Add a tag and press Enter"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
        />
        <button type="button" onClick={addTag} className="btn-outline !px-4 !py-2 !text-xs">Add</button>
      </div>
    </div>
  );
}

function HeroForm({ data, onChange }) {
  const set = (k) => (e) => onChange({ [k]: e.target.value });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Eyebrow badge</label>
          <input className="field-input" value={data.eyebrow || ""} onChange={set("eyebrow")} />
        </div>
        <div />
        <div>
          <label className="field-label">Heading — line 1</label>
          <input className="field-input" value={data.heading_line1 || ""} onChange={set("heading_line1")} />
        </div>
        <div>
          <label className="field-label">Heading — line 2 (gold)</label>
          <input className="field-input" value={data.heading_line2 || ""} onChange={set("heading_line2")} />
        </div>
      </div>
      <div>
        <label className="field-label">Subheading</label>
        <textarea className="field-input min-h-[80px]" value={data.subheading || ""} onChange={set("subheading")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Primary button text</label>
          <input className="field-input" value={data.cta_primary || ""} onChange={set("cta_primary")} />
        </div>
        <div>
          <label className="field-label">Secondary button text</label>
          <input className="field-input" value={data.cta_secondary || ""} onChange={set("cta_secondary")} />
        </div>
      </div>
      <StatsEditor stats={data.stats || []} onChange={(stats) => onChange({ stats })} />
    </div>
  );
}

function AboutForm({ data, onChange }) {
  const set = (k) => (e) => onChange({ [k]: e.target.value });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Eyebrow</label>
          <input className="field-input" value={data.eyebrow || ""} onChange={set("eyebrow")} />
        </div>
        <div>
          <label className="field-label">Heading</label>
          <input className="field-input" value={data.heading || ""} onChange={set("heading")} />
        </div>
      </div>
      <div>
        <label className="field-label">Body — leave a blank line between paragraphs</label>
        <textarea className="field-input min-h-[160px]" value={data.body || ""} onChange={set("body")} />
      </div>
      <ImageUploader
        label="Mission photo"
        folder="site-content"
        value={data.image_url || ""}
        onChange={(url) => onChange({ image_url: url })}
      />
      <div>
        <label className="field-label">Image caption badge</label>
        <input className="field-input" value={data.image_caption || ""} onChange={set("image_caption")} />
      </div>
      <TagsEditor tags={data.tags || []} onChange={(tags) => onChange({ tags })} />
      <StatsEditor stats={data.stats || []} onChange={(stats) => onChange({ stats })} />
    </div>
  );
}

function CtaBottomForm({ data, onChange }) {
  const set = (k) => (e) => onChange({ [k]: e.target.value });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Eyebrow</label>
          <input className="field-input" value={data.eyebrow || ""} onChange={set("eyebrow")} />
        </div>
        <div>
          <label className="field-label">Button text</label>
          <input className="field-input" value={data.cta_label || ""} onChange={set("cta_label")} />
        </div>
        <div>
          <label className="field-label">Heading — line 1</label>
          <input className="field-input" value={data.heading_line1 || ""} onChange={set("heading_line1")} />
        </div>
        <div>
          <label className="field-label">Heading — line 2 (gold)</label>
          <input className="field-input" value={data.heading_line2 || ""} onChange={set("heading_line2")} />
        </div>
      </div>
      <div>
        <label className="field-label">Body</label>
        <textarea className="field-input min-h-[80px]" value={data.body || ""} onChange={set("body")} />
      </div>
      <ImageUploader
        label="Background photo"
        folder="site-content"
        value={data.background_image_url || ""}
        onChange={(url) => onChange({ background_image_url: url })}
      />
    </div>
  );
}

function FocusStripForm({ data, onChange }) {
  const items = data.items || [];
  const set = (i, patch) => onChange({ items: items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  const add = () => onChange({ items: [...items, { label: "", image_url: "", alt: "" }] });
  const remove = (i) => onChange({ items: items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/40">
        The 4-photo strip shown between the About and Training Tools sections.
      </p>
      {items.map((it, i) => (
        <div key={i} className="rounded-sm border border-ink-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Photo {i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-white/40 hover:text-danger">
              <Trash2 size={15} />
            </button>
          </div>
          <div>
            <label className="field-label">Label</label>
            <input className="field-input" placeholder="Strength" value={it.label || ""}
              onChange={(e) => set(i, { label: e.target.value })} />
          </div>
          <ImageUploader
            label="Photo"
            folder="site-content"
            value={it.image_url || ""}
            onChange={(url) => set(i, { image_url: url })}
          />
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs font-semibold text-gold hover:underline">
        + Add photo
      </button>
    </div>
  );
}

function BookingForm({ data, onChange }) {
  const set = (k) => (e) => onChange({ [k]: e.target.value });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Eyebrow</label>
          <input className="field-input" value={data.eyebrow || ""} onChange={set("eyebrow")} />
        </div>
        <div />
        <div>
          <label className="field-label">Heading — line 1</label>
          <input className="field-input" value={data.heading_line1 || ""} onChange={set("heading_line1")} />
        </div>
        <div>
          <label className="field-label">Heading — line 2</label>
          <input className="field-input" value={data.heading_line2 || ""} onChange={set("heading_line2")} />
        </div>
      </div>
      <div>
        <label className="field-label">Body</label>
        <textarea className="field-input min-h-[80px]" value={data.body || ""} onChange={set("body")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Contact email</label>
          <input className="field-input" value={data.email || ""} onChange={set("email")} />
        </div>
        <div>
          <label className="field-label">Location line</label>
          <input className="field-input" value={data.location || ""} onChange={set("location")} />
        </div>
      </div>
      <ImageUploader
        label="Panel photo"
        folder="site-content"
        value={data.image_url || ""}
        onChange={(url) => onChange({ image_url: url })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Quote (overlaid on photo)</label>
          <input className="field-input" value={data.quote || ""} onChange={set("quote")} />
        </div>
        <div>
          <label className="field-label">Quote attribution</label>
          <input className="field-input" value={data.quote_author || ""} onChange={set("quote_author")} />
        </div>
      </div>
    </div>
  );
}

const SECTION_FORMS = {
  hero: HeroForm,
  about: AboutForm,
  cta_bottom: CtaBottomForm,
  focus_strip: FocusStripForm,
  booking: BookingForm,
};

function SectionsPanel() {
  const [sections, setSections] = useState({});
  const [active, setActive] = useState("hero");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/admin/content")
      .then(({ data }) => {
        const map = Object.fromEntries(data.map((row) => [row.section_key, row.data]));
        setSections(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const switchSection = (key) => {
    setActive(key);
    setError("");
    setSaved(false);
  };

  const patch = (fields) => {
    setSaved(false);
    setSections((prev) => ({ ...prev, [active]: { ...(prev[active] || {}), ...fields } }));
  };

  const save = async () => {
    setError("");
    setSaved(false);
    try {
      await api.put(`/admin/content/${active}`, { data: sections[active] || {} });
      setSaved(true);
    } catch (e) {
      setError(apiError(e));
    }
  };

  const Form = SECTION_FORMS[active];

  return (
    <div className="card space-y-5">
      <div className="flex flex-wrap gap-2">
        {SECTION_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => switchSection(t.key)}
            className={`rounded-sm border px-3 py-1.5 text-xs ${
              active === t.key ? "border-gold text-gold" : "border-ink-700 text-white/60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ErrorBanner message={error} />
      <SavedBanner show={saved} />

      {loading ? (
        <div className="text-sm text-white/40">Loading…</div>
      ) : (
        <Form data={sections[active] || {}} onChange={patch} />
      )}

      <button onClick={save} className="btn-primary !px-6 !py-2.5 !text-xs">Save Section</button>
    </div>
  );
}