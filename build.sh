#!/usr/bin/env bash
set -e

echo "==> Installing Python dependencies..."
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

echo "==> Build complete!"
