'use client';

import Link from 'next/link';
import { Bell, Menu, User } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header
      className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6 dark:bg-gray-950"
      data-testid="app-header"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-md p-2 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
          aria-label="Toggle menu"
          data-testid="menu-toggle"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="text-primary text-xl font-bold lg:hidden">
          {APP_NAME}
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="relative rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Notifications"
          data-testid="notification-bell"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="User menu"
          data-testid="user-menu"
        >
          <User className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
