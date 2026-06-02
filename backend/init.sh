#!/usr/bin/env bash

set -e

echo "Populating dev DB with sample data (using Python seed script)..."

source .env
uv run scripts/seed.py

echo "Sample data created successfully."
