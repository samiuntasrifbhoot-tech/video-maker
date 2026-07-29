import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AccordionSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function AccordionSection({
  title,
  subtitle,
  icon,
  badge,
  defaultOpen = false,
  children,
  className = '',
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-slate-800/80 bg-slate-900/60 rounded-2xl overflow-hidden transition-all duration-300 shadow-md ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left bg-slate-900/90 hover:bg-slate-850 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && <div className="text-amber-500 shrink-0">{icon}</div>}
          <div className="flex flex-col min-w-0">
            <span className="font-sans font-bold text-slate-100 text-xs sm:text-sm truncate flex items-center gap-2">
              {title}
              {badge && (
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0">
                  {badge}
                </span>
              )}
            </span>
            {subtitle && <span className="text-[11px] font-sans text-slate-400 truncate">{subtitle}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 shrink-0">
          <span className="text-[11px] font-sans font-semibold text-amber-400/80 hidden sm:inline">
            {isOpen ? 'ফোল্ড করুন ▲' : 'আনফোল্ড করুন ▼'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/40 animate-fade-in space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}
