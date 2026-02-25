'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Repeat,
  Target,
  CreditCard,
  Bell,
  BarChart3,
  Upload,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/budgets', label: 'Budgets', icon: PiggyBank },
  { href: '/recurring', label: 'Recurring', icon: Repeat },
  { href: '/savings', label: 'Savings', icon: Target },
  { href: '/debts', label: 'Debts', icon: CreditCard },
  { href: '/bills', label: 'Bills', icon: Bell },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/import', label: 'Import', icon: Upload },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-gray-50 dark:lg:bg-gray-900">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-primary text-xl font-bold">
          FamFin
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4" data-testid="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
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
    </aside>
  );
}
