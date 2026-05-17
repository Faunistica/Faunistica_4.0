.PHONY: format lint isort install sync migrate test

run: install
	uv run fastapi dev src/app.py

install:
	uv sync

format: isort
	uv run ruff format src/ alembic/ tests/ scripts/

isort:
	uv run ruff check --select I --fix src/ alembic/ tests/ scripts/

lint:
	uv run ruff check src/ alembic/ tests/ scripts/;\
	uv run ty check src/ alembic/ tests/ scripts/

check-schema:
	uv run python -m scripts.check_schema

migrate:
	uv run alembic upgrade head

test:
	uv run pytest tests/ -v
