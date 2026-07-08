'use client';

import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LayoutDashboard, Users, User, Moon, Sun, LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/groups', label: 'Groups', icon: Users },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function Navbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="flex justify-between items-center border-b bg-background px-4 py-3 md:px-6">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-base md:text-lg font-bold">SplitEasy</Link>
        <div className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                  isActive ? 'bg-accent text-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="inline-flex items-center justify-center rounded-md p-2 hover:bg-accent"
          aria-label="Toggle theme"
        >
          {mounted && theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            await signOut({ callbackUrl: '/signin' });
          }}
          className="inline-flex items-center justify-center rounded-md p-2 hover:bg-accent"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{session?.user?.name}</span>
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.avatar || ''} alt={session?.user?.name || 'User'} />
            <AvatarFallback>{getInitials(session?.user?.name)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  );
}