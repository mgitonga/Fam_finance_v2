'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, LogOut, Menu, User } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { logout } from '@/lib/supabase/auth-actions';
import { useAuth } from '@/providers/auth-provider';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

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

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="User menu"
            data-testid="user-menu"
          >
            <User className="h-5 w-5" />
            {user && <span className="hidden text-sm md:inline">{user.email}</span>}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 z-50 mt-1 w-48 rounded-md border bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setShowUserMenu(false)}
              >
                Settings
              </Link>
              <button
                onClick={async () => {
                  setShowUserMenu(false);
                  await logout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                data-testid="logout-button"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
