#!/usr/bin/env bash
set -e

export PYTHON_VERSION=3.11.9

echo "==> Installing Python dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "==> Installing frontend dependencies..."
cd frontend
npm install

echo "==> Building frontend..."
npm run build

cd ..

echo "==> Copying frontend build to backend/static..."
mkdir -p backend/static
cp -r frontend/dist/* backend/static/
cp frontend/public/logo.png backend/static/logo.png 2>/dev/null || true

echo "==> Build complete!"
