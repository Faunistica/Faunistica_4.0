.PHONY: format lint isort install sync migrate test

run: install
	uv run fastapi dev src/app.py

install:
	uv sync

sync:
	uv sync

format: isort
	uv run ruff format src/ alembic/

isort:
	uv run ruff check --select I --fix src/ alembic/

lint:
	uv run ruff check src/ alembic/ tests/
	uv run ty check src/ alembic/ tests/

migrate:
	uv run alembic upgrade head

test:
	uv run pytest tests/ -v
