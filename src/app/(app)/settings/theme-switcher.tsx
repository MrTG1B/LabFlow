
'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Button
        variant={theme === 'light' ? 'default' : 'outline'}
        onClick={() => setTheme('light')}
        className="h-24"
      >
        <div className="flex flex-col items-center gap-2">
          <Sun className="h-8 w-8" />
          <span>Light</span>
        </div>
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'outline'}
        onClick={() => setTheme('dark')}
        className="h-24"
      >
        <div className="flex flex-col items-center gap-2">
          <Moon className="h-8 w-8" />
          <span>Dark</span>
        </div>
      </Button>
    </div>
  );
}
