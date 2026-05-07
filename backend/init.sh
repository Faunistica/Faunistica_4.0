#!/usr/bin/env bash

set -e

echo "Populating dev DB with sample data (using Python seed script)..."

source .env
scripts/seed.py

echo "Sample data created successfully."
