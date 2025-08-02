#!/bin/bash

# Download Inter font files for local hosting
# This eliminates the need for external Google Fonts dependencies

echo "Downloading Inter font files..."

# Create fonts directory if it doesn't exist
mkdir -p public/assets/fonts

# Download the required Inter font files
echo "Downloading Inter-Regular.woff2..."
curl -L "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.woff2" -o public/assets/fonts/Inter-Regular.woff2

echo "Downloading Inter-Medium.woff2..."
curl -L "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Medium.woff2" -o public/assets/fonts/Inter-Medium.woff2

echo "Downloading Inter-SemiBold.woff2..."
curl -L "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-SemiBold.woff2" -o public/assets/fonts/Inter-SemiBold.woff2

echo "Downloading Inter-Bold.woff2..."
curl -L "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.woff2" -o public/assets/fonts/Inter-Bold.woff2

echo "✅ Font files downloaded successfully!"
echo "The application will now use local Inter fonts instead of Google Fonts."
echo "This eliminates external dependency timeouts in production." 