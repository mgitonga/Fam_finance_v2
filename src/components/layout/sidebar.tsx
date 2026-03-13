'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  Building2,
  PiggyBank,
  Repeat,
  Target,
  CreditCard,
  Bell,
  BarChart3,
  Upload,
  Download,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { X } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/accounts', label: 'Accounts', icon: Landmark },
  { href: '/budgets', label: 'Budgets', icon: Target },
  { href: '/recurring', label: 'Recurring', icon: Repeat },
  { href: '/savings', label: 'Savings', icon: PiggyBank },
  { href: '/debts', label: 'Debts', icon: CreditCard },
  { href: '/assets', label: 'Assets', icon: Building2 },
  { href: '/bills', label: 'Bills', icon: Bell },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/import', label: 'Import', icon: Upload },
  { href: '/export', label: 'Export', icon: Download },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const navContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/dashboard" onClick={onMobileClose}>
          <Logo size={28} />
        </Link>
        <button
          onClick={onMobileClose}
          className="rounded-md p-1 hover:bg-gray-200 lg:hidden dark:hover:bg-gray-700"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4" data-testid="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-gray-50 dark:lg:bg-gray-900">
        {navContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onMobileClose} aria-hidden="true" />
          <aside className="fixed inset-y-0 left-0 flex w-64 flex-col bg-gray-50 shadow-lg dark:bg-gray-900">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
