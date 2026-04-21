.PHONY: lint format lint-all format-all

lint:
	@echo "Linting backend..."
	$(MAKE) -C backend lint
	@echo "Linting frontend..."
	$(MAKE) -C frontend lint

format:
	@echo "Formatting backend..."
	$(MAKE) -C backend format
	@echo "Formatting frontend..."
	$(MAKE) -C frontend format
