import {
  LayoutDashboard,
  Radar,
  Star,
  Bell,
  LineChart,
  Sparkles,
  Settings,
} from "lucide-react";
import { mockUser } from "@/src/lib/mock-data";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Scanner", icon: Radar, active: false },
  { label: "Watchlist", icon: Star, active: false },
  { label: "Alerts", icon: Bell, active: false, badge: 3 },
  { label: "Stocks", icon: LineChart, active: false },
  { label: "AI Insights", icon: Sparkles, active: false },
];

export default function AppSidebar() {
  return (
    <aside className="w-60 shrink-0 bg-[#0d0f14] border-r border-slate-800 flex flex-col h-full">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            FF
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">FomoFilter</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-left transition-colors ${
                item.active
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-purple-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800 flex flex-col gap-0.5">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors w-full text-left">
          <Settings size={16} className="shrink-0" />
          <span>Settings</span>
        </button>

        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {mockUser.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{mockUser.name}</p>
            <p className="text-slate-500 text-xs truncate">{mockUser.email}</p>
          </div>
          <span className="text-xs font-medium text-purple-400 border border-purple-800 px-1.5 py-0.5 rounded-full">
            PRO
          </span>
        </div>
      </div>
    </aside>
  );
}
