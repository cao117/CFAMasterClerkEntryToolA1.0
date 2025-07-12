import React, { useState, useRef, useEffect } from 'react';

/**
 * CustomSelect - A modern, accessible, fully custom dropdown select component.
 * @param {string[]} options - List of string options to choose from
 * @param {string} value - Currently selected value
 * @param {(val: string) => void} onChange - Callback when value changes
 * @param {string} className - Additional classes for the select box
 * @param {string} placeholder - Placeholder text
 * @param {string} ariaLabel - ARIA label for accessibility
 * @param {React.ReactNode} selectedIcon - Icon to show in selected value
 * @param {string} dropdownMenuClassName - Additional classes for dropdown menu
 * @param {string} highlightBg - Background color class for highlighted items
 * @param {string} highlightText - Text color class for highlighted items
 * @param {string} selectedBg - Background color class for selected items
 * @param {string} selectedText - Text color class for selected items
 * @param {string} hoverBg - Background color class for hover states
 * @param {string} hoverText - Text color class for hover states
 */
const CustomSelect: React.FC<{
  options: string[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  selectedIcon?: React.ReactNode;
  dropdownMenuClassName?: string;
  highlightBg?: string;
  highlightText?: string;
  selectedBg?: string;
  selectedText?: string;
  hoverBg?: string;
  hoverText?: string;
}> = ({ 
  options, 
  value, 
  onChange, 
  className = '', 
  placeholder = 'Select...', 
  ariaLabel, 
  selectedIcon, 
  dropdownMenuClassName = '',
  highlightBg = 'bg-violet-50',
  highlightText = 'text-violet-900',
  selectedBg = 'bg-violet-100',
  selectedText = 'text-violet-800',
  hoverBg = 'bg-violet-50',
  hoverText = 'text-violet-900'
}) => {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      setOpen(true);
      setHighlighted(options.findIndex(opt => opt === value));
      e.preventDefault();
    } else if (open) {
      if (e.key === 'ArrowDown') {
        setHighlighted(h => (h + 1) % options.length);
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setHighlighted(h => (h - 1 + options.length) % options.length);
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (highlighted >= 0) {
          onChange(options[highlighted]);
          setOpen(false);
        }
        e.preventDefault();
      } else if (e.key === 'Escape') {
        setOpen(false);
        e.preventDefault();
      }
    }
  };

  // When opening, highlight current value
  useEffect(() => {
    if (open) setHighlighted(options.findIndex(opt => opt === value));
  }, [open, value, options]);

  return (
    <div
      ref={ref}
      tabIndex={0}
      className={`relative select-none outline-none ${className}`}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={`w-full flex items-center justify-between rounded-full px-3 py-1.5 bg-white text-sm font-medium text-slate-800 transition-all duration-200 outline-none focus:outline-none ${open ? 'scale-[1.02]' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={value ? 'flex items-center' : 'text-zinc-400 flex items-center'}>
          {selectedIcon && <span className="mr-2 flex items-center">{selectedIcon}</span>}
          {value || placeholder}
        </span>
        <svg className={`w-4 h-4 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul
          className={`absolute z-20 mt-1 w-full rounded-xl bg-white py-1 max-h-[384px] overflow-auto animate-fade-in text-base font-semibold outline-none ${dropdownMenuClassName}`}
          role="listbox"
        >
          {options.map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={value === opt}
              className={`px-4 py-2 cursor-pointer text-base font-semibold transition-all duration-150 rounded-lg mx-1 my-0.5 outline-none
                ${highlighted === i
                  ? `${highlightBg} ${highlightText} font-bold`
                  : value === opt
                    ? `${selectedBg} ${selectedText}`
                    : ''}
                hover:${hoverBg} hover:${hoverText} hover:font-bold
              `}
              onMouseEnter={() => setHighlighted(i)}
              onMouseDown={e => { e.preventDefault(); onChange(opt); setOpen(false); }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect; 