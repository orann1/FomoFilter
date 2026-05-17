"use client";

import { useState } from "react";
import AppSidebar from "./AppSidebar";
import TopBar from "./TopBar";
import type { DashboardUser } from "@/src/lib/data/dashboard";

interface ClientAppShellProps {
  user: DashboardUser;
  children: React.ReactNode;
}

export default function ClientAppShell({ user, children }: ClientAppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#0a0b0f] overflow-hidden">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <AppSidebar
        user={user}
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          onMenuToggle={() => setIsSidebarOpen((v) => !v)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
