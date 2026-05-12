import { Menu, Search, Bell, PanelLeft, PanelLeftClose } from "lucide-react";

interface TopBarProps {
  onMenuToggle?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function TopBar({ onMenuToggle, isSidebarCollapsed, onToggleCollapse }: TopBarProps) {
  return (
    <header className="border-b border-slate-800 bg-[#0d0f14] shrink-0">
      {/* Main row */}
      <div className="h-14 flex items-center px-4 md:px-5 gap-3">
        {/* Sidebar collapse toggle — desktop only */}
        <button
          className="hidden md:flex items-center justify-center text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 shrink-0"
          onClick={onToggleCollapse}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {/* Hamburger — mobile only */}
        <button
          className="md:hidden text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          onClick={onMenuToggle}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Search — hidden on mobile (shown in second row below) */}
        <div className="hidden md:block flex-1 max-w-sm relative">
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
      </div>

      {/* Mobile search row */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search ticker or company..."
            className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-slate-600"
          />
        </div>
        <p className="text-xs text-slate-600 mt-2">
          US Stocks&nbsp;·&nbsp;Updated 2 min ago&nbsp;·&nbsp;Delayed data
        </p>
      </div>
    </header>
  );
}
