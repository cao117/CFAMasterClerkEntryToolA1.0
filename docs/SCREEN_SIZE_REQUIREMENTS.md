# Screen Size Requirements & Fallback UX

## Overview

The CFA Master Clerk Entry Tool is designed as a desktop-first, Tauri-based web application that requires a minimum screen size of **1280 pixels** on at least one dimension (typically width) to function properly.

## Screen Size Logic

The application implements a two-tier screen size validation system:

### 1. Physical Device Capability Check
- **Metric**: `Math.max(screen.width, screen.height)`
- **Requirement**: Device must be capable of displaying at least 1280px in any direction
- **Fallback**: Shows "tooSmall" message if device is physically incapable

### 2. Current Layout Check
- **Metric**: `window.innerWidth`
- **Requirement**: Current visible area must be at least 1280px wide
- **Fallback**: Shows "rotateOrResize" message if device is capable but layout is too narrow

## Implementation Details

### Components
- **`FallbackNotice.tsx`**: Full-screen fallback component with animated cat and contextual messages
- **`useScreenGuard.ts`**: Custom hook that monitors screen size and determines fallback type

### Integration
- Screen validation occurs at the top level of `App.tsx`
- Uses `useEffect()` with `window.onresize` and `window.onorientationchange` for dynamic re-evaluation
- Automatically re-renders full app when screen becomes valid

## Fallback Messages

### Device Too Small
```
🐾 Oops! This tool needs a bit more space.
Your device screen is too small to run the CFA Master Clerk Entry Tool.
Please switch to a desktop or larger display.
More info: https://cfa.org
```

### Layout Too Narrow
```
🐾 Oops! This tool needs a bit more room to stretch.
It looks like your screen is currently too narrow.
Try rotating your device to landscape mode or maximizing your browser window.
More info: https://cfa.org
```

## Design Features

### Visual Consistency
- Reuses the jumping cat animation from General Info tab
- Matches existing color palette and typography
- Uses consistent border radius, shadows, and spacing

### Responsive Design
- Full-screen layout (100vh)
- Centered content with proper padding
- Animated background elements for visual appeal
- Backdrop blur effects for modern appearance

### User Experience
- Clear, actionable messaging
- Professional yet friendly tone
- Links to CFA website for additional information
- Smooth transitions and animations

## Technical Constraints

### Non-Interference Policy
The fallback system is designed to be completely non-intrusive:
- Does not affect any existing tab functionality
- Preserves all form data and CSV logic
- Maintains all existing state management
- No impact on core layout components

### Performance Considerations
- Lightweight screen size monitoring
- Efficient event listener management
- Minimal re-renders when screen size changes
- Cleanup of event listeners on component unmount

## Browser Compatibility

The screen size validation works across all modern browsers:
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)
- Tauri desktop applications

## Future Considerations

- Potential for configurable minimum screen sizes
- Analytics tracking for fallback usage
- Progressive enhancement for smaller screens
- Accessibility improvements for screen readers 