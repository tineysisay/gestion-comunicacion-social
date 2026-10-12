import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { IconCheck, IconClose, IconExclamation } from "./Icons";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const STYLES: Record<ToastType, { bg: string; border: string; icon: string; iconBg: string }> = {
  success: { bg: "bg-white", border: "border-green-200", icon: "text-green-600", iconBg: "bg-green-100" },
  error:   { bg: "bg-white", border: "border-red-200",   icon: "text-red-600",   iconBg: "bg-red-100" },
  warning: { bg: "bg-white", border: "border-amber-200", icon: "text-amber-600", iconBg: "bg-amber-100" },
  info:    { bg: "bg-white", border: "border-blue-200",  icon: "text-blue-600",  iconBg: "bg-blue-100" },
};

function ToastIcon({ type }: { type: ToastType }) {
  const cls = "w-4 h-4";
  if (type === "success") return <IconCheck className={cls} />;
  if (type === "error") return <IconClose className={cls} />;
  return <IconExclamation className={cls} />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const success = useCallback((title: string, message?: string) => toast("success", title, message), [toast]);
  const error = useCallback((title: string, message?: string) => toast("error", title, message), [toast]);
  const warning = useCallback((title: string, message?: string) => toast("warning", title, message), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none" style={{ maxWidth: 360 }}>
        {toasts.map((t) => {
          const s = STYLES[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 ${s.bg} border ${s.border} rounded-xl shadow-lg px-4 py-3.5 w-full`}
              style={{ animation: "slideInToast 0.2s ease" }}
            >
              <div className={`${s.iconBg} ${s.icon} w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5`}>
                <ToastIcon type={t.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                {t.message && <p className="text-xs text-slate-500 mt-0.5 leading-snug">{t.message}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 mt-0.5 transition-colors"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
