import { createContext, useCallback, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type DialogMode = "alert" | "confirm" | "prompt";
interface DialogRequest { mode: DialogMode; title: string; message: string; placeholder?: string; confirmLabel?: string }
interface WarkaDialogApi {
  alert: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, title?: string, confirmLabel?: string) => Promise<boolean>;
  prompt: (message: string, title?: string, placeholder?: string) => Promise<string | null>;
}

const DialogContext = createContext<WarkaDialogApi | null>(null);

export const WarkaDialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const [promptValue, setPromptValue] = useState("");
  const resolveRef = useRef<((value: boolean | string | null) => void) | null>(null);

  const request = useCallback((next: DialogRequest) => new Promise<boolean | string | null>(resolve => {
    resolveRef.current = resolve;
    setPromptValue("");
    setDialog(next);
  }), []);
  const close = useCallback((value: boolean | string | null) => {
    setDialog(null);
    resolveRef.current?.(value);
    resolveRef.current = null;
  }, []);
  const alert = useCallback(async (message: string, title = "Warka") => { await request({ mode: "alert", title, message }); }, [request]);
  const confirm = useCallback(async (message: string, title = "Please confirm", confirmLabel = "Continue") => Boolean(await request({ mode: "confirm", title, message, confirmLabel })), [request]);
  const prompt = useCallback(async (message: string, title = "Warka", placeholder = "") => {
    const value = await request({ mode: "prompt", title, message, placeholder });
    return typeof value === "string" ? value : null;
  }, [request]);

  useEffect(() => {
    if (!dialog) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") close(dialog.mode === "confirm" ? false : null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialog, close]);

  const submitPrompt = (event: FormEvent) => { event.preventDefault(); close(promptValue); };
  return <DialogContext.Provider value={{ alert, confirm, prompt }}>
    {children}
    {dialog && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onMouseDown={event => { if (event.target === event.currentTarget) close(dialog.mode === "confirm" ? false : null); }}>
      <form onSubmit={dialog.mode === "prompt" ? submitPrompt : event => { event.preventDefault(); close(dialog.mode === "confirm"); }} role={dialog.mode === "confirm" ? "alertdialog" : "dialog"} aria-modal="true" aria-labelledby="warka-dialog-title" className="w-full max-w-md rounded-2xl p-5 shadow-2xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2" style={{ color: dialog.mode === "confirm" ? "#d97706" : "var(--accent)" }}>
            {dialog.mode === "confirm" ? <AlertTriangle size={20} /> : dialog.mode === "prompt" ? <Info size={20} /> : <CheckCircle2 size={20} />}
            <h2 id="warka-dialog-title" className="text-lg font-bold" style={{ color: "var(--text)" }}>{dialog.title}</h2>
          </div>
          <button type="button" aria-label="Close dialog" onClick={() => close(dialog.mode === "confirm" ? false : null)} className="rounded-lg p-1 hover:bg-[var(--surface2)]" style={{ color: "var(--muted)" }}><X size={18} /></button>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{dialog.message}</p>
        {dialog.mode === "prompt" && <input autoFocus value={promptValue} onChange={event => setPromptValue(event.target.value)} placeholder={dialog.placeholder} className="mt-4 w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ color: "var(--text)", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)" }} />}
        <div className="mt-5 flex justify-end gap-2">
          {dialog.mode !== "alert" && <button type="button" onClick={() => close(dialog.mode === "confirm" ? false : null)} className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-[var(--surface2)]" style={{ color: "var(--text)" }}>Cancel</button>}
          <button type="submit" className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>{dialog.mode === "alert" ? "OK" : dialog.mode === "confirm" ? dialog.confirmLabel : "Submit"}</button>
        </div>
      </form>
    </div>}
  </DialogContext.Provider>;
};

export const useWarkaDialog = (): WarkaDialogApi => {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useWarkaDialog must be used inside WarkaDialogProvider");
  return context;
};
