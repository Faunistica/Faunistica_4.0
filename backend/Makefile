.PHONY: format lint isort install sync

install:
	uv sync

sync:
	uv sync

run:
	uv run --directory . fastapi dev

format: isort
	uv run ruff format .

isort:
	uv run ruff check --select I --fix .

lint:
	uv run ruff check .
