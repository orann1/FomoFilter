"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Radar,
  Star,
  Bell,
  LineChart,
  Sparkles,
  Settings,
  X,
} from "lucide-react";
import type { DashboardUser } from "@/src/lib/data/dashboard";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Scanner", icon: Radar, href: "/scanner" },
  { label: "Watchlist", icon: Star, href: "/watchlist" },
  { label: "Alerts", icon: Bell, href: "/alerts", badge: 3 },
  { label: "Stocks", icon: LineChart, href: "/stocks" },
  { label: "AI Insights", icon: Sparkles, href: "/ai-insights" },
];

interface AppSidebarProps {
  user: DashboardUser;
  isOpen?: boolean;
  isCollapsed?: boolean;
  onClose?: () => void;
}

export default function AppSidebar({
  user,
  isOpen = false,
  isCollapsed = false,
  onClose,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`
        shrink-0 bg-[#0d0f14] border-r border-slate-800 flex flex-col h-full
        fixed md:relative inset-y-0 left-0 z-50
        overflow-hidden
        transition-[width,transform] duration-300 ease-in-out
        ${isCollapsed ? "md:w-14" : "md:w-60"}
        w-60
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
    >
      {/* Header */}
      <div className="px-3 py-4 border-b border-slate-800 flex items-center justify-between min-h-[64px]">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            FF
          </div>
          <span
            className={`text-white font-semibold text-sm tracking-wide whitespace-nowrap transition-[opacity,max-width] duration-300 overflow-hidden ${
              isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[160px]"
            }`}
          >
            FomoFilter
          </span>
        </div>

        {/* Mobile close button */}
        <button
          className="md:hidden text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 shrink-0"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center py-2.5 rounded-lg text-sm w-full transition-colors ${
                isCollapsed ? "justify-center px-0" : "gap-3 px-3"
              } ${
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              <span
                className={`flex-1 text-left whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-300 ${
                  isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[160px]"
                }`}
              >
                {item.label}
              </span>
              {item.badge && !isCollapsed && (
                <span className="bg-purple-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full leading-none shrink-0">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-4 border-t border-slate-800 flex flex-col gap-0.5">
        <button
          title={isCollapsed ? "Settings" : undefined}
          className={`flex items-center py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors w-full ${
            isCollapsed ? "justify-center px-0" : "gap-3 px-3"
          }`}
        >
          <Settings size={16} className="shrink-0" />
          <span
            className={`whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-300 ${
              isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[160px]"
            }`}
          >
            Settings
          </span>
        </button>

        <div
          className={`flex items-center py-2.5 mt-1 ${
            isCollapsed ? "justify-center px-0" : "gap-3 px-3"
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {user.initials}
          </div>
          <div
            className={`flex items-center gap-2 overflow-hidden transition-[opacity,max-width] duration-300 ${
              isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[160px]"
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.name}</p>
              <p className="text-slate-500 text-xs truncate">{user.email}</p>
            </div>
            <span className="text-xs font-medium text-purple-400 border border-purple-800 px-1.5 py-0.5 rounded-full shrink-0">
              {user.plan}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
