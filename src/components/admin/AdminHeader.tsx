'use client';

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
 

interface AdminHeaderProps {
  onMobileMenuClick?: () => void;
}

export function AdminHeader({ onMobileMenuClick }: AdminHeaderProps) {
  const pathname = usePathname();

  const getPageTitle = (path: string) => {
    if (path === '/admin') return 'Dashboard';
    const segments = path.split('/');
    const segment = segments[segments.length - 1];
    return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : 'Admin';
  };

  return (
    <header className="border-b bg-card px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2"
            onClick={onMobileMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div>
            <h1 className="text-xl sm:text-2xl font-semibold">{getPageTitle(pathname || '')}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Admin Panel • {getPageTitle(pathname || '')}
            </p>
          </div>
        </div>

      </div>
    </header>
  );
}