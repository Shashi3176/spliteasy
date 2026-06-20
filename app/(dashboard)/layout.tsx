'use client';

import Link from 'next/link';
import { LayoutDashboard, Users, User, Menu, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed top-4 z-50 inline-flex items-center justify-center rounded-md p-2 bg-background border md:hidden ${sidebarOpen ? 'left-64' : 'left-4'}`}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col
          transform transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold">SplitEasy</h1>
        </div>
        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                href="/groups"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <Users className="h-5 w-5" />
                <span>Groups</span>
              </Link>
            </li>
            <li>
              <Link
                href="/profile"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 bg-background md:pl-0">
        <Navbar />
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
