#!/bin/bash

echo "🚀 DataToolkit - Project Setup and Test"
echo "========================================"
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
node --version || { echo "❌ Node.js not found"; exit 1; }

# Check npm
echo "✓ Checking npm..."
npm --version || { echo "❌ npm not found"; exit 1; }

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Type check
echo ""
echo "🔍 Running type check..."
npx tsc --noEmit || { echo "❌ Type check failed"; exit 1; }

echo ""
echo "✅ All checks passed!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To build for production:"
echo "  npm run build"
echo ""
echo "To deploy with Docker:"
echo "  docker-compose up -d"
echo ""
