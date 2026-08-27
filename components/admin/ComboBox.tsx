"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, X, Check } from "lucide-react";

export interface ComboOption {
  name: string;
  /** Present only on operator-added entries — those are the deletable ones. */
  id?: string;
}

interface ComboBoxProps {
  value: string;
  options: ComboOption[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
  onChange: (name: string) => void;
  /** Omit to make the box a plain picker with no way to add. */
  onCreate?: (name: string) => Promise<void> | void;
  onDelete?: (id: string, name: string) => Promise<void> | void;
}

/**
 * A picker you can also type into.
 *
 * The shipped country/province/town lists will never be complete — a new border
 * post or mine opens and the form has to be able to name it that day. So an
 * exact match selects, and anything else offers to add itself to the list for
 * everyone.
 */
export default function ComboBox({
  value, options, placeholder, disabled, className = "",
  onChange, onCreate, onDelete,
}: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  const fold = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  const typed = query.trim().replace(/\s+/g, " ");

  const shown = typed
    ? options.filter(o => fold(o.name).includes(fold(typed)))
    : options;

  // Only offer to add what is genuinely new — otherwise typing a town that is
  // already shipped would file a duplicate of it under the operator's spelling.
  const exists = options.some(o => fold(o.name) === fold(typed));
  const canAdd = Boolean(onCreate) && Boolean(typed) && !exists;

  const openList = () => {
    if (disabled) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setQuery("");
    setOpen(true);
  };
  // Deferred so a click on a row lands before the list is torn down.
  const closeSoon = () => { hideTimer.current = setTimeout(() => setOpen(false), 150); };

  const pick = (name: string) => { onChange(name); setOpen(false); setQuery(""); };

  const add = async () => {
    if (!onCreate || !typed || busy) return;
    setBusy(true);
    try {
      await onCreate(typed);
      pick(typed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <input
        value={open ? query : value}
        placeholder={value && !open ? value : placeholder}
        disabled={disabled}
        onFocus={openList}
        onBlur={closeSoon}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (shown.length === 1) pick(shown[0].name);
            else if (canAdd) add();
          }
          if (e.key === "Escape") setOpen(false);
        }}
        className={`${className} pr-7`}
      />
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-300 pointer-events-none" />

      {open && (shown.length > 0 || canAdd) && (
        <div className="absolute left-0 right-0 top-full mt-1 z-40 rounded-xl border border-neutral-200 bg-white shadow-xl overflow-hidden">
          <div className="max-h-44 overflow-y-auto">
            {shown.map(o => (
              <div
                key={o.id || o.name}
                className="flex items-center gap-1 border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors"
              >
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); pick(o.name); }}
                  className="flex-1 text-left px-3 py-2 text-[12px] text-slate-700 truncate"
                >
                  {o.name}
                  {o.name === value && <Check className="inline w-3 h-3 ml-1.5 text-emerald-500" />}
                </button>
                {o.id && onDelete && (
                  <button
                    type="button"
                    title={`Remove "${o.name}" from the list`}
                    onMouseDown={async e => {
                      e.preventDefault();
                      e.stopPropagation();
                      await onDelete(o.id!, o.name);
                    }}
                    className="px-2 py-2 text-neutral-300 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {canAdd && (
            <button
              type="button"
              disabled={busy}
              onMouseDown={e => { e.preventDefault(); add(); }}
              className="w-full flex items-center gap-1.5 px-3 py-2.5 border-t border-neutral-100 bg-primary/5 text-[11px] font-bold text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              <Plus className="w-3 h-3 shrink-0" />
              <span className="truncate">{busy ? "Adding…" : `Add "${typed}"`}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
