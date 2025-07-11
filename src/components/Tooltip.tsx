import React, { useState, useRef } from 'react';

/**
 * Tooltip component for premium, instant, styled tooltips.
 * @param {React.ReactNode} children - The trigger element.
 * @param {string} content - The tooltip text.
 * @param {"top"|"bottom"|"left"|"right"} [placement] - Tooltip position (default: bottom).
 */
export default function Tooltip({ children, content, placement = 'bottom' }: {
  children: React.ReactNode;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Show instantly on hover/focus
  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  };
  // Hide instantly on mouse leave/blur
  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  // Tooltip position classes
  const positionClass =
    placement === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-3'
    : placement === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-3'
    : placement === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-3'
    : 'left-full top-1/2 -translate-y-1/2 ml-3';

  // Arrow for bottom placement
  const arrow = placement === 'bottom' ? (
    <span
      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-2"
      style={{ zIndex: 51 }}
    >
      <svg width="16" height="7" viewBox="0 0 16 7" fill="none" style={{ filter: 'drop-shadow(0 1px 2px rgba(40,44,52,0.10))' }}>
        <path
          d="M2 0 Q8 10 14 0"
          fill="#fff"
          stroke="#23272f"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  ) : null;

  return (
    <span className="relative inline-block" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} tabIndex={-1}>
      {children}
      {visible && (
        <span
          className={`absolute z-50 ${positionClass} px-4 py-2 rounded-xl bg-white/98 border border-black text-sm font-medium font-sans shadow-xl pointer-events-none select-none whitespace-nowrap transition-opacity duration-75 opacity-100`}
          role="tooltip"
          style={{ minWidth: 'max-content', maxWidth: 280, textAlign: 'center', lineHeight: 1.5, color: '#2a9d90', boxShadow: '0 4px 16px 0 rgba(40,44,52,0.10)' }}
        >
          {arrow}
          {content}
        </span>
      )}
    </span>
  );
} 