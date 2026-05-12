"use client";

import { useState } from "react";
import AppSidebar from "./AppSidebar";
import TopBar from "./TopBar";

export default function ClientAppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0a0b0f] overflow-hidden">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuToggle={() => setIsSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
