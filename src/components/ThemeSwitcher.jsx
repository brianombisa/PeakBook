import React from 'react';
import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';
import { Palette, Sun, Moon, Waves, Crown, Mountain } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
  { 
    key: 'light', 
    name: 'Light', 
    icon: Sun, 
    description: 'Clean & bright',
    gradient: 'from-slate-100 to-white'
  },
  { 
    key: 'dark', 
    name: 'Dark', 
    icon: Moon, 
    description: 'Easy on eyes',
    gradient: 'from-slate-800 to-slate-900'
  },
  { 
    key: 'blue', 
    name: 'Ocean', 
    icon: Waves, 
    description: 'Professional blue',
    gradient: 'from-blue-500 to-indigo-600'
  },
  { 
    key: 'golden', 
    name: 'Sunrise', 
    icon: Crown, 
    description: 'Warm & elegant',
    gradient: 'from-amber-400 to-yellow-500'
  },
  { 
    key: 'slate', 
    name: 'Professional', 
    icon: Mountain, 
    description: 'Corporate gray',
    gradient: 'from-slate-600 to-slate-700'
  }
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const currentTheme = themes.find(t => t.key === theme) || themes[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start p-3 h-auto">
          <div className="flex items-center gap-3 w-full">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${currentTheme.gradient}`}>
              <currentTheme.icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Theme: {currentTheme.name}</p>
              <p className="text-xs text-slate-500">{currentTheme.description}</p>
            </div>
            <Palette className="w-4 h-4 text-slate-400" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="p-2">
          <p className="text-sm font-semibold text-slate-700 mb-2 px-2">Choose Theme</p>
          {themes.map((themeOption) => (
            <DropdownMenuItem 
              key={themeOption.key}
              onClick={() => setTheme(themeOption.key)}
              className={`p-3 cursor-pointer rounded-lg mb-1 ${
                theme === themeOption.key ? 'bg-blue-50 border border-blue-200' : ''
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${themeOption.gradient} shadow-sm`}>
                  <themeOption.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{themeOption.name}</p>
                  <p className="text-xs text-slate-500">{themeOption.description}</p>
                </div>
                {theme === themeOption.key && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}