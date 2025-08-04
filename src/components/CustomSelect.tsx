import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * CustomSelect - A modern, accessible, fully custom dropdown select component.
 * Now supports theme border and text color for perfect parity across all tabs.
 * Features smart positioning to prevent dropdown clipping in constrained containers.
 * Uses React Portal to render dropdown outside table DOM for proper z-index layering.
 * @param {string} borderColor - Tailwind border color class for the select box (e.g., 'border-violet-300')
 * @param {string} focusBorderColor - Tailwind border color class for focus state (e.g., 'focus:border-violet-500')
 * @param {string} textColor - Tailwind text color class for the select value (e.g., 'text-violet-700')
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
  borderColor?: string; // NEW: theme border
  focusBorderColor?: string; // NEW: theme border on focus
  textColor?: string; // NEW: theme text color for value
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
  hoverText = 'text-violet-900',
  borderColor = 'border-violet-300', // Default: violet
  focusBorderColor = 'focus:border-violet-500',
  textColor = 'text-violet-700',
}) => {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<'above' | 'below'>('below');
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const [dropdownHeight, setDropdownHeight] = useState<number>(0);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  /**
   * Calculate optimal dropdown position based on available viewport space
   * @param triggerElement - The dropdown trigger element
   */
  const calculateDropdownPosition = (triggerElement: HTMLElement) => {
    const rect = triggerElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedDropdownHeight = Math.min(options.length * 40, 240); // ~6 options * 40px each, max 240px
    
    // Position above if insufficient space below and sufficient space above
    if (spaceBelow < estimatedDropdownHeight && spaceAbove > estimatedDropdownHeight) {
      setDropdownPosition('above');
    } else {
      setDropdownPosition('below');
    }
  };

  /**
   * Handle dropdown toggle with smart positioning and portal positioning
   */
  const handleDropdownToggle = () => {
    if (!open && buttonRef.current) {
      calculateDropdownPosition(buttonRef.current);
      setDropdownRect(buttonRef.current.getBoundingClientRect());
    }
    setOpen(!open);
  };

  // Update dropdown height when it opens
  useEffect(() => {
    if (open && dropdownRef.current) {
      setDropdownHeight(dropdownRef.current.scrollHeight);
    }
  }, [open]);

  // Close dropdown on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (open) {
        setOpen(false); // Close dropdown when user scrolls
      }
    };

    if (open) {
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [open]);

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
      handleDropdownToggle();
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
        ref={buttonRef}
        type="button"
        className={`w-full flex items-center justify-between rounded-full px-3 py-1.5 bg-white text-sm font-medium transition-all duration-200 outline-none focus:outline-none border ${borderColor} ${focusBorderColor} ${textColor} text-[15px] font-medium h-9 min-w-[70px] ${open ? 'scale-[1.02]' : ''}`}
        onClick={handleDropdownToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{ boxShadow: open ? '0 0 0 2px rgba(0,0,0,0.04)' : undefined }}
      >
        <span className={value ? 'flex items-center' : 'text-zinc-400 flex items-center'}>
          {selectedIcon && <span className="mr-2 flex items-center">{selectedIcon}</span>}
          {value || placeholder}
        </span>
        <svg className={`w-4 h-4 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && createPortal(
        <ul
          ref={dropdownRef}
          className={`fixed z-50 rounded-xl bg-white py-1 max-h-[384px] overflow-auto animate-fade-in text-base font-semibold outline-none shadow-lg border border-gray-200 ${dropdownMenuClassName}`}
          style={{
            left: dropdownRect?.left || 0,
            top: dropdownPosition === 'above' 
              ? (dropdownRect?.top || 0) - (dropdownHeight + 8)  // Use actual height
              : (dropdownRect?.bottom || 0) + 4,                 // Position below with gap
            width: dropdownRect?.width || 'auto',
            minWidth: dropdownRect?.width || 'auto'
          }}
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
        </ul>,
        document.body
      )}
    </div>
  );
};

export default CustomSelect; 