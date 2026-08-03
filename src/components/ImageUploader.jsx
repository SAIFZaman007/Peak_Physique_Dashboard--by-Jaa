import { useRef, useState } from "react";
import { ImagePlus, Link as LinkIcon, Loader2, RefreshCw, X } from "lucide-react";
import { api, apiError } from "../lib/api";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Dual-mode image field: drag-and-drop or browse to upload a file directly
 * (POST /admin/uploads/image, multipart), or paste an external https://
 * URL. Either way, `onChange` just receives the final URL — from the
 * parent form's point of view this is a text field that fills itself in.
 *
 * Works identically whether the dashboard is running against the API over
 * http://localhost:8000 in dev or https://api.trainpeakphysique.com in
 * production — the backend returns a fully-qualified URL either way.
 */
export default function ImageUploader({ label, value, onChange, folder = "misc" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const upload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPEG, PNG, or WEBP).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Images must be under 5MB.");
      return;
    }
    setError("");
    setBusy(true);
    const body = new FormData();
    body.append("file", file);
    body.append("folder", folder);
    try {
      const { data } = await api.post("/admin/uploads/image", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data.url);
    } catch (e) {
      setError(apiError(e, "Upload failed. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {label && <label className="field-label">{label}</label>}

      {value ? (
        <div className="flex items-center gap-3 rounded-sm border border-ink-700 bg-ink-950 p-2">
          <img src={value} alt="" className="h-16 w-16 shrink-0 rounded-sm border border-ink-800 object-cover" />
          <input
            className="field-input min-w-0 flex-1 !border-0 !bg-transparent !px-0 !py-0 text-xs text-white/50"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="shrink-0 text-white/40 hover:text-gold"
            aria-label="Replace image"
            title="Replace"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 text-white/40 hover:text-danger"
            aria-label="Remove image"
            title="Remove"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              upload(e.dataTransfer.files?.[0]);
            }}
            onClick={() => !busy && inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed px-4 py-6 text-center transition-colors ${
              dragOver ? "border-gold bg-gold/5" : "border-ink-700 hover:border-ink-600"
            }`}
          >
            {busy ? (
              <Loader2 size={22} className="animate-spin text-gold" />
            ) : (
              <ImagePlus size={22} className="text-white/30" />
            )}
            <p className="text-xs text-white/40">
              {busy ? "Uploading…" : "Drag an image here, or click to browse"}
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <LinkIcon size={13} className="shrink-0 text-white/30" />
            <input
              className="field-input !py-2 !text-xs"
              placeholder="…or paste an image URL (https://)"
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}