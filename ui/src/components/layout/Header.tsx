import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Menu, Upload, Search, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';

export function Header() {
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const setIsLoaded = useUIStore((s) => s.setIsLoaded);
  const { resolvedTheme, setTheme } = useTheme();

  const [localQuery, setLocalQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSearchQuery(value);
      }, 300);
    },
    [setSearchQuery],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4">
      {/* Sidebar toggle (desktop: collapse sidebar, mobile: open sheet) */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <Menu className="size-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="size-5" />
      </Button>

      {/* Logo / Title */}
      <div className="flex items-center gap-2">
        <BookOpen className="size-5 text-primary" />
        <h1 className="hidden text-lg font-semibold sm:inline">
          Kobo Highlights
        </h1>
      </div>

      {/* Search */}
      <div className="relative ml-auto flex max-w-sm flex-1 items-center">
        <Search className="absolute left-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search highlights…"
          value={localQuery}
          onChange={handleSearchChange}
          className="pl-8"
        />
      </div>

      {/* Dark mode toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle dark mode"
      >
        <Sun className="size-5 rotate-0 scale-100 transition-transform dark:rotate-90 dark:scale-0" />
        <Moon className="absolute size-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      </Button>

      {/* New Import */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsLoaded(false)}
        className="hidden sm:inline-flex"
      >
        <Upload className="size-4" />
        New Import
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsLoaded(false)}
        className="sm:hidden"
        aria-label="New Import"
      >
        <Upload className="size-4" />
      </Button>
    </header>
  );
}
