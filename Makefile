.PHONY: lint format test diagrams

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

test:
	@echo "Running backend tests..."
	$(MAKE) -C backend test
	@echo "Running frontend tests..."
	$(MAKE) -C frontend test

diagrams:
	@echo "Generating mermaid diagrams..."
	mmdc -i docs/diagrams/registration.mmd -o docs/diagrams/registration.svg -b transparent -c docs/diagrams/mermaid-config.json
	mmdc -i docs/diagrams/auth-login.mmd -o docs/diagrams/auth-login.svg -b transparent -c docs/diagrams/mermaid-config.json
	mmdc -i docs/diagrams/auth-telegram.mmd -o docs/diagrams/auth-telegram.svg -b transparent -c docs/diagrams/mermaid-config.json
	mmdc -i docs/diagrams/record-filling.mmd -o docs/diagrams/record-filling.svg -b transparent -c docs/diagrams/mermaid-config.json
	mmdc -i docs/diagrams/geocoding.mmd -o docs/diagrams/geocoding.svg -b transparent -c docs/diagrams/mermaid-config.json
	mmdc -i docs/diagrams/taxonomy.mmd -o docs/diagrams/taxonomy.svg -b transparent -c docs/diagrams/mermaid-config.json
	mmdc -i docs/diagrams/architecture.mmd -o docs/diagrams/architecture.svg -b transparent -c docs/diagrams/mermaid-config.json
	mmdc -i docs/diagrams/support.mmd -o docs/diagrams/support.svg -b transparent -c docs/diagrams/mermaid-config.json
	mmdc -i docs/diagrams/db-schema.mmd -o docs/diagrams/db-schema.svg -b transparent -c docs/diagrams/mermaid-config.json
