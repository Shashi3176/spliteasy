import Link from 'next/link';
import { LayoutDashboard, Users, User } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold">SplitEasy</h1>
        </div>
        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                href="/groups"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
              >
                <Users className="h-5 w-5" />
                <span>Groups</span>
              </Link>
            </li>
            <li>
              <Link
                href="/profile"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 bg-slate-50">
        <Navbar />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}