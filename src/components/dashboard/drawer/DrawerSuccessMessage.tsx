import { CheckCircle2, X } from "lucide-react";

interface DrawerSuccessMessageProps {
  message: string;
  onDismiss: () => void;
}

export default function DrawerSuccessMessage({ message, onDismiss }: DrawerSuccessMessageProps) {
  return (
    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-600/40 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
        <span className="text-sm text-emerald-400 font-medium">{message}</span>
      </div>
      <button
        onClick={onDismiss}
        className="text-emerald-600 hover:text-emerald-400 transition-colors ml-3 p-0.5"
      >
        <X size={13} />
      </button>
    </div>
  );
}
