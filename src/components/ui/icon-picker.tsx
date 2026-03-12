'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { ICON_MAP, ICON_NAMES, DynamicIcon } from './dynamic-icon';

interface IconPickerProps {
  value: string | null;
  onChange: (icon: string) => void;
  className?: string;
}

export function IconPicker({ value, onChange, className = '' }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search) return ICON_NAMES;
    const q = search.toLowerCase();
    return ICON_NAMES.filter((name) => name.includes(q));
  }, [search]);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open]);

  function handleSelect(name: string) {
    onChange(name);
    setOpen(false);
    setSearch('');
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        data-testid="icon-picker-trigger"
      >
        {value && ICON_MAP[value] ? (
          <>
            <DynamicIcon name={value} className="h-5 w-5" />
            <span className="text-gray-600 dark:text-gray-400">{value}</span>
          </>
        ) : (
          <span className="text-gray-400">Select icon...</span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-80 rounded-lg border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="relative border-b p-2 dark:border-gray-700">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons..."
              className="w-full rounded-md border py-1.5 pr-8 pl-8 text-sm dark:border-gray-700 dark:bg-gray-800"
              data-testid="icon-picker-search"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">No icons found</p>
            ) : (
              <div className="grid grid-cols-6 gap-1">
                {filtered.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelect(name)}
                    title={name}
                    className={`flex items-center justify-center rounded-md p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      value === name ? 'bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-900/30' : ''
                    }`}
                  >
                    <DynamicIcon name={name} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
