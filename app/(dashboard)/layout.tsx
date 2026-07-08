'use client';

import Navbar from '@/components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <main className="flex-1 bg-background overflow-y-auto">
        <Navbar />
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
