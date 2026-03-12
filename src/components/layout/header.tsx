'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, LogOut, Menu, User, Check } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { logout } from '@/lib/supabase/auth-actions';
import { useAuth } from '@/providers/auth-provider';
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/use-notifications';
import { ThemeToggle } from './theme-toggle';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: notifData } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = notifData?.data || [];
  const unreadCount = notifData?.unreadCount || 0;

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
        <Link href="/dashboard" className="lg:hidden">
          <Logo size={28} />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Notifications"
            data-testid="notification-bell"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
                data-testid="notification-badge"
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 z-50 mt-1 w-80 rounded-md border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
              data-testid="notification-panel"
            >
              <div className="flex items-center justify-between border-b px-4 py-2">
                <span className="text-sm font-medium">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-primary flex items-center gap-1 text-xs hover:underline"
                    data-testid="mark-all-read"
                  >
                    <Check className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-gray-500">No notifications</p>
                ) : (
                  notifications
                    .slice(0, 20)
                    .map(
                      (n: {
                        id: string;
                        title: string;
                        message: string;
                        is_read: boolean;
                        created_at: string;
                        action_url: string | null;
                      }) => (
                        <div
                          key={n.id}
                          className={`cursor-pointer border-b px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                          onClick={() => {
                            if (!n.is_read) markRead.mutate(n.id);
                            if (n.action_url) window.location.href = n.action_url;
                            setShowNotifications(false);
                          }}
                        >
                          <p
                            className={`font-medium ${!n.is_read ? 'text-foreground' : 'text-gray-500'}`}
                          >
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">{n.message}</p>
                        </div>
                      ),
                    )
                )}
              </div>
            </div>
          )}
        </div>

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
