# CFA Entry

A comprehensive web application for managing Cat Fanciers' Association (CFA) show data with modern UI and advanced dropdown positioning technology.

## Features

### Core Functionality
- **Show Information Management**: Date, club name, master clerk, and judge count tracking
- **Judge Information Table**: Comprehensive judge management with Ring Type selection
- **Smart Dropdown Positioning**: Intelligent dropdown positioning using React Portal technology
- **Excel Integration**: Import/export functionality for show data
- **Form Validation**: Comprehensive validation system with real-time feedback

### Advanced Technology
- **React Portal Implementation**: Dropdowns render outside table DOM for proper z-index layering
- **Dynamic Positioning**: Smart positioning logic prevents dropdown clipping in constrained containers
- **Scroll Behavior**: Automatic dropdown closure on scroll prevents positioning issues
- **Responsive Design**: Mobile and tablet compatible interface
- **Modern UI**: Card-based design with hover effects and smooth animations

## Technical Highlights

### Smart Dropdown Technology
The application uses React Portal technology to solve complex z-index layering issues:

1. **Portal Rendering**: Dropdowns render at document.body level, outside table DOM
2. **Dynamic Positioning**: Calculates position based on trigger element location
3. **Smart Height**: Uses actual rendered height instead of CSS max-height
4. **Scroll Handling**: Closes dropdown on scroll to prevent positioning issues

### Key Components
- **GeneralTab**: Main show management interface
- **CustomSelect**: Reusable dropdown component with portal rendering
- **ActionButtons**: Excel import/export and data management
- **SettingsPanel**: Configuration and customization options

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production
```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## Usage

### Judge Information Management
- **Ring Type Selection**: Dropdown with smart positioning that appears above ActionButtons
- **Real-time Validation**: Immediate feedback on form inputs
- **Responsive Layout**: Adapts to different screen sizes
- **Smooth Interactions**: Hover effects and transitions

### Data Management
- **Excel Integration**: Seamless import/export of show data
- **Fill Test Data**: Quick data population for testing
- **Reset Functionality**: Clear form data with confirmation
- **Auto-save**: Automatic data persistence

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Support**: Responsive design for tablets and phones
- **Accessibility**: Screen reader compatible
- **Keyboard Navigation**: Full keyboard support

## Development

### Project Structure
```
src/
├── components/          # React components
│   ├── CustomSelect.tsx # Portal-based dropdown component
│   ├── GeneralTab.tsx   # Main show management interface
│   └── ActionButtons.tsx # Data management buttons
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── validation/         # Form validation logic
└── types/              # TypeScript type definitions
```

### Key Technologies
- **React 18**: Modern component-based architecture
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling framework
- **React Portal**: DOM rendering outside component hierarchy for proper layering

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a complete list of changes and improvements.

### Recent Updates (v1.2.1)
- **Fixed**: Judge Information dropdown positioning using React Portal
- **Enhanced**: Smart positioning logic for dynamic dropdown placement
- **Improved**: Scroll behavior with automatic dropdown closure
- **Added**: Dynamic height calculation for accurate positioning

## Support

For technical support or feature requests, please check the documentation or create an issue in the repository.
