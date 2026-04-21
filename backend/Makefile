.PHONY: format lint isort install sync

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
	uv run ruff check src/ alembic/
	uv run ty check src/ alembic/
