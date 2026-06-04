FROM ghcr.io/astral-sh/uv:python3.13-alpine AS builder
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN echo "# Faunistica Backend" > README.md && \
    uv sync --no-dev --frozen --no-install-project --no-editable --compile-bytecode
COPY alembic/ alembic/
COPY alembic.ini config.yaml ./
COPY src/ src/
COPY data/ data/
RUN uv sync --no-dev --frozen --no-editable --compile-bytecode

FROM python:3.13-alpine
WORKDIR /app
ENV PATH="/app/.venv/bin:$PATH"
COPY --from=builder /app/.venv /app/.venv
COPY alembic/ alembic/
COPY alembic.ini config.yaml ./
COPY data/ data/
ARG GIT_COMMIT=unknown
ARG GIT_TAG=unknown
ARG GIT_BRANCH=unknown
RUN echo "{\"commit\":\"$GIT_COMMIT\",\"tag\":\"$GIT_TAG\",\"branch\":\"$GIT_BRANCH\"}" > build_info.json
COPY scripts/entrypoint.sh scripts/healthcheck.py /scripts/
RUN chmod +x /scripts/entrypoint.sh /scripts/healthcheck.py
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD ["/scripts/healthcheck.py"]
ENTRYPOINT ["/scripts/entrypoint.sh"]
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5001"]
