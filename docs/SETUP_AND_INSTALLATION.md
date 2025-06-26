# Setup and Installation

## Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **pnpm** package manager
- **Rust & Cargo** (for Tauri desktop app development)

## Local Development Setup
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 99_Cursor_CFA_ENTRY
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173/`

## Desktop App Development
- **Run in desktop mode**: `npm run tauri:dev`
- **Build desktop app**: `npm run tauri:build`
- **Output binaries** for Windows, macOS, and Linux

## Available Scripts
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run tauri:dev` - Run Tauri in development mode
- `npm run tauri:build` - Build Tauri desktop app 