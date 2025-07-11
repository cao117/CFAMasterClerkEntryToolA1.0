import React, { useState, useRef, useEffect } from 'react';

/**
 * CustomSelect - A modern, accessible, fully custom dropdown select component.
 * @param {string[]} options - List of string options to choose from
 * @param {string} value - Currently selected value
 * @param {(val: string) => void} onChange - Callback when value changes
 * @param {string} className - Additional classes for the select box
 * @param {string} placeholder - Placeholder text
 * @param {string} ariaLabel - ARIA label for accessibility
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
}> = ({ options, value, onChange, className = '', placeholder = 'Select...', ariaLabel, selectedIcon, dropdownMenuClassName = '' }) => {
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
                  ? 'bg-violet-50 text-violet-900 font-bold'
                  : value === opt
                    ? 'bg-violet-100 text-violet-800'
                    : ''}
                hover:bg-violet-50 hover:text-violet-900 hover:font-bold
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