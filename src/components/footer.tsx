
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Users, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function Footer() {
  const pathname = usePathname();

  useEffect(() => {
    // This effect updates a CSS variable whenever the footer is mounted (i.e., on mobile)
    // to allow other components to account for its height.
    document.documentElement.style.setProperty('--footer-height', '64px');
    return () => {
      document.documentElement.style.setProperty('--footer-height', '0px');
    };
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden h-16">
      <nav className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center w-full h-full">
              <item.icon className={cn('w-6 h-6 mb-1 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn('text-xs transition-colors', isActive ? 'text-primary font-semibold' : 'text-muted-foreground')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
