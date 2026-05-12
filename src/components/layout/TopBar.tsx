import { PanelLeft, Search, Bell } from "lucide-react";

export default function TopBar() {
  return (
    <header className="h-14 border-b border-slate-800 bg-[#0d0f14] flex items-center px-5 gap-4 shrink-0">
      <button className="text-slate-400 hover:text-white transition-colors">
        <PanelLeft size={18} />
      </button>

      <div className="flex-1 max-w-sm relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search ticker or company..."
          className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-slate-600"
        />
      </div>

      <div className="flex-1" />

      <span className="text-xs text-slate-500 hidden lg:block">
        US Stocks&nbsp;·&nbsp;Updated 2 min ago&nbsp;·&nbsp;Delayed data
      </span>

      <button className="text-sm text-slate-400 border border-slate-700 rounded-lg px-3 py-1.5 hover:border-slate-600 hover:text-white transition-colors hidden md:block">
        Universe: US Stocks
      </button>

      <button className="relative text-slate-400 hover:text-white transition-colors">
        <Bell size={18} />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none">
          3
        </span>
      </button>
    </header>
  );
}
