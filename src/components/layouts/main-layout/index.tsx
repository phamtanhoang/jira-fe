"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

const STORAGE_KEY = "sidebar-collapsed";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header collapsed={collapsed} onToggleSidebar={toggle} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
