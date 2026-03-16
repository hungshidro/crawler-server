#!/usr/bin/env bash
# exit on error
set -o errexit

# Cài đặt dependencies
npm install

# Puppeteer sẽ tự động download Chrome
# Render đã hỗ trợ Chrome dependencies
echo "✅ Build completed successfully"
