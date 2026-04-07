.PHONY: format lint isort install sync

run: install
	uv run fastapi dev src/app.py

install:
	uv sync

sync:
	uv sync

format: isort
	uv run ruff format src/

isort:
	uv run ruff check --select I --fix src/

lint:
	uv run ruff check src/
	uv run pylint src/
