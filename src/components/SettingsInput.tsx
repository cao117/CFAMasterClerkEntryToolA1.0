import React, { forwardRef } from 'react';

/**
 * Modern, fashionable input component for settings panel
 * Features:
 * - Glassmorphism design with subtle gradients
 * - Smooth focus animations with glow effects
 * - Auto-text selection on focus
 * - Responsive design with proper spacing
 * - Consistent styling across all input types
 * @param glowColor - Tailwind color name (e.g. 'amber', 'teal', 'purple', 'pink', 'emerald', 'orange') for focus/hover glow
 */
interface SettingsInputProps {
  type?: 'number' | 'text' | 'email' | 'password';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  width?: 'sm' | 'md' | 'lg' | string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
  name?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
  /**
   * Glow color for focus/hover states (Tailwind color name, e.g. 'amber', 'teal', 'purple', etc.)
   * Defaults to 'amber' if not provided.
   */
  glowColor?: 'amber' | 'teal' | 'purple' | 'pink' | 'emerald' | 'orange' | 'cyan' | 'blue' | 'yellow' | 'indigo';
}

const colorMap = {
  amber: {
    ring: 'focus:ring-amber-300/40',
    border: 'focus:border-amber-400/60',
    shadow: 'focus:shadow-amber-200/30',
    glow: 'from-amber-400/8 via-yellow-400/6 to-orange-400/8',
    inner: 'from-amber-400/3 via-yellow-400/2 to-orange-400/3',
  },
  teal: {
    ring: 'focus:ring-teal-300/40',
    border: 'focus:border-teal-400/60',
    shadow: 'focus:shadow-teal-200/30',
    glow: 'from-teal-400/10 via-cyan-400/8 to-blue-400/10',
    inner: 'from-teal-400/3 via-cyan-400/2 to-blue-400/3',
  },
  purple: {
    ring: 'focus:ring-purple-300/40',
    border: 'focus:border-purple-400/60',
    shadow: 'focus:shadow-purple-200/30',
    glow: 'from-purple-400/10 via-indigo-400/8 to-blue-400/10',
    inner: 'from-purple-400/3 via-indigo-400/2 to-blue-400/3',
  },
  pink: {
    ring: 'focus:ring-pink-300/40',
    border: 'focus:border-pink-400/60',
    shadow: 'focus:shadow-pink-200/30',
    glow: 'from-pink-400/10 via-rose-400/8 to-red-400/10',
    inner: 'from-pink-400/3 via-rose-400/2 to-red-400/3',
  },
  emerald: {
    ring: 'focus:ring-emerald-300/40',
    border: 'focus:border-emerald-400/60',
    shadow: 'focus:shadow-emerald-200/30',
    glow: 'from-emerald-400/10 via-green-400/8 to-lime-400/10',
    inner: 'from-emerald-400/3 via-green-400/2 to-lime-400/3',
  },
  orange: {
    ring: 'focus:ring-orange-300/40',
    border: 'focus:border-orange-400/60',
    shadow: 'focus:shadow-orange-200/30',
    glow: 'from-orange-400/10 via-amber-400/8 to-yellow-400/10',
    inner: 'from-orange-400/3 via-amber-400/2 to-yellow-400/3',
  },
  cyan: {
    ring: 'focus:ring-cyan-300/40',
    border: 'focus:border-cyan-400/60',
    shadow: 'focus:shadow-cyan-200/30',
    glow: 'from-cyan-400/10 via-blue-400/8 to-teal-400/10',
    inner: 'from-cyan-400/3 via-blue-400/2 to-teal-400/3',
  },
  blue: {
    ring: 'focus:ring-blue-300/40',
    border: 'focus:border-blue-400/60',
    shadow: 'focus:shadow-blue-200/30',
    glow: 'from-blue-400/10 via-cyan-400/8 to-teal-400/10',
    inner: 'from-blue-400/3 via-cyan-400/2 to-teal-400/3',
  },
  yellow: {
    ring: 'focus:ring-yellow-300/40',
    border: 'focus:border-yellow-400/60',
    shadow: 'focus:shadow-yellow-200/30',
    glow: 'from-yellow-400/10 via-amber-400/8 to-orange-400/10',
    inner: 'from-yellow-400/3 via-amber-400/2 to-orange-400/3',
  },
  indigo: {
    ring: 'focus:ring-indigo-300/40',
    border: 'focus:border-indigo-400/60',
    shadow: 'focus:shadow-indigo-200/30',
    glow: 'from-indigo-400/10 via-purple-400/8 to-blue-400/10',
    inner: 'from-indigo-400/3 via-purple-400/2 to-blue-400/3',
  },
};

const SettingsInput = forwardRef<HTMLInputElement, SettingsInputProps>(
  (
    {
      type = 'text',
      value,
      onChange,
      placeholder,
      min,
      max,
      width = 'md',
      className = '',
      disabled = false,
      autoFocus = false,
      id,
      name,
      onKeyDown,
      onBlur,
      onInput,
      glowColor = 'amber',
    },
    ref
  ) => {
    // Width mapping for consistent sizing
    const widthClasses = {
      sm: 'w-20',
      md: 'w-24',
      lg: 'w-32',
    };
    const widthClass = typeof width === 'string' && width in widthClasses 
      ? widthClasses[width as keyof typeof widthClasses]
      : width;

    // Pick color classes for glow
    const color = colorMap[glowColor] || colorMap['amber'];

    // Base input styling with premium glassmorphism design
    const baseClasses = `
      relative
      text-center
      text-lg
      font-bold
      text-gray-800
      bg-gradient-to-br
      from-white/95
      via-gray-50/90
      to-white/95
      backdrop-blur-md
      border
      border-gray-200/40
      rounded-2xl
      py-2.5
      px-4
      transition-all
      duration-500
      ease-out
      focus:outline-none
      ${color.ring}
      ${color.border}
      ${color.shadow}
      focus:shadow-xl
      hover:border-gray-300/60
      hover:shadow-lg
      hover:shadow-gray-200/40
      hover:bg-gradient-to-br
      hover:from-white
      hover:via-gray-50/95
      hover:to-white
      disabled:opacity-50
      disabled:cursor-not-allowed
      disabled:hover:border-gray-200/40
      disabled:hover:shadow-none
      ${widthClass}
      ${className}
    `.trim();

    // Handle focus with auto-select
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
    };

    return (
      <div className="relative group">
        {/* Premium background glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${color.glow} rounded-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-500 pointer-events-none blur-sm`} />
        
        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        {/* Main input element */}
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          onInput={onInput}
          placeholder={placeholder}
          min={min}
          max={max}
          disabled={disabled}
          autoFocus={autoFocus}
          id={id}
          name={name}
          className={baseClasses}
        />
        
        {/* Premium inner glow on focus */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${color.inner} opacity-0 group-focus-within:opacity-100 transition-all duration-500 pointer-events-none`} />
      </div>
    );
  }
);

SettingsInput.displayName = 'SettingsInput';

export default SettingsInput; 