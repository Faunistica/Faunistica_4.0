.PHONY: format lint isort install sync

run: install
	uv run --directory . fastapi dev

install:
	uv sync

sync:
	uv sync

format: isort
	uv run ruff format .

isort:
	uv run ruff check --select I --fix .

lint:
	uv run ruff check .
