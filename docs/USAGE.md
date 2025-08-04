
# CFA Entry - Usage Guide

_Last updated: 2025-08-04_

## Overview

CFA Entry is a comprehensive web application for managing Cat Fanciers' Association (CFA) show data. This guide covers all features and functionality available in the application.

## Getting Started

### Accessing the Application
1. Open your web browser
2. Navigate to the CFA Entry application URL
3. The application will load with the General tab active by default

### Interface Overview
The application uses a tabbed interface with the following main sections:
- **General Tab**: Show information, judge management, and data controls
- **Settings Panel**: Configuration and customization options

## General Tab Usage

### Show Information Section
**Purpose**: Manage basic show details and configuration

**Fields**:
- **Show Date**: Select the date of the show (required)
- **Club Name**: Enter the hosting club's name (required)
- **Master Clerk**: Enter the master clerk's name (required)
- **# of Judges**: Set the number of judges (required, max 50)

**Features**:
- Real-time validation with visual feedback
- Auto-highlight on focus for easy editing
- Responsive design for mobile devices

### Show Count Management
**Purpose**: Track championship, kitten, and premiership counts

**Championship Counts**:
- **Longhair GCs**: Number of longhair grand champions
- **Longhair CHs**: Number of longhair champions
- **Longhair NOVs**: Number of longhair novices
- **Shorthair GCs**: Number of shorthair grand champions
- **Shorthair CHs**: Number of shorthair champions
- **Shorthair NOVs**: Number of shorthair novices

**Features**:
- Automatic total calculations
- Input validation with min/max limits
- Color-coded visual feedback

### Judge Information Table
**Purpose**: Manage individual judge details and ring assignments

**Features**:
- **Smart Dropdown Positioning**: Ring Type dropdowns automatically position above ActionButtons
- **Dynamic Positioning**: Dropdowns appear above or below based on available space
- **Scroll Behavior**: Dropdowns close automatically when scrolling
- **Real-time Updates**: Changes reflect immediately in the interface

**Table Columns**:
- **Judge Name**: Enter judge's full name
- **Acronym**: Auto-generated from judge's name
- **Ring Type**: Select from dropdown (Longhair, Shorthair, etc.)
- **Ring Number**: Assign ring number for the judge

**Ring Type Selection**:
- Click the dropdown to open options
- Dropdown appears above ActionButtons for proper layering
- Options include: Longhair, Shorthair, All Breeds, Household Pet
- Smart positioning prevents clipping in constrained containers

### Action Buttons
**Purpose**: Data management and export functionality

**Available Actions**:
- **Save to Excel**: Export current data to Excel format
- **Load from Excel**: Import data from Excel file
- **Reset**: Clear all form data with confirmation
- **Fill Test Data**: Populate with sample data for testing

**Features**:
- All buttons positioned above dropdown elements
- Confirmation dialogs for destructive actions
- Progress indicators for import/export operations

## Advanced Features

### Smart Dropdown Technology
The application uses React Portal technology for optimal dropdown positioning:

**Benefits**:
- **Proper Z-Index Layering**: Dropdowns appear above all other elements
- **Dynamic Positioning**: Automatically positions above or below based on space
- **Scroll Handling**: Closes dropdowns when scrolling to prevent positioning issues
- **Responsive Design**: Adapts to different screen sizes and orientations

**How It Works**:
1. Dropdowns render outside the table DOM using React Portal
2. Position calculated based on trigger button location
3. Height determined dynamically using actual rendered content
4. Scroll events automatically close dropdowns for better UX

### Form Validation
**Real-time Validation**:
- Required field indicators (red asterisks)
- Immediate feedback on input errors
- Color-coded input states (red for errors, blue for focus)
- Clear error messages and descriptions

**Validation Rules**:
- Show date must be selected
- Club name and master clerk are required
- Judge count must be between 0 and maximum allowed
- All championship counts must be non-negative numbers

### Keyboard Navigation
**Accessibility Features**:
- Tab navigation through all form fields
- Enter key to open dropdowns
- Arrow keys for dropdown navigation
- Escape key to close dropdowns
- Full keyboard support for all interactions

## Troubleshooting

### Common Issues

**Dropdown Not Visible**:
- Ensure you're not scrolling while dropdown is open
- Check that the dropdown trigger button is visible
- Try clicking the dropdown again

**Data Not Saving**:
- Verify all required fields are completed
- Check for validation errors (red borders)
- Ensure you have proper permissions

**Import/Export Issues**:
- Verify Excel file format is compatible
- Check file size limits
- Ensure proper file permissions

### Performance Tips
- Close dropdowns when not in use
- Avoid scrolling while dropdowns are open
- Use keyboard navigation for faster data entry
- Save data regularly using Excel export

## Browser Compatibility

**Supported Browsers**:
- Chrome (recommended)
- Firefox
- Safari
- Edge

**Mobile Support**:
- Responsive design for tablets
- Touch-friendly interface
- Optimized for mobile browsers

## Data Management

### Exporting Data
1. Click "Save to Excel" button
2. Choose save location on your device
3. File will contain all current form data
4. Use for backup or sharing with others

### Importing Data
1. Click "Load from Excel" button
2. Select your Excel file
3. Data will populate all form fields
4. Verify imported data is correct

### Resetting Data
1. Click "Reset" button
2. Confirm action in dialog
3. All form fields will be cleared
4. Start fresh with new data

## Support

For technical support or feature requests:
- Check the troubleshooting section above
- Review browser compatibility requirements
- Ensure all required fields are completed
- Try refreshing the page if issues persist 