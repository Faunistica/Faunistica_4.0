FROM ghcr.io/astral-sh/uv:python3.13-alpine
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN echo "# Faunistica Backend" > README.md && uv sync --no-dev --frozen --no-install-project
COPY alembic/ alembic/
COPY alembic.ini config.yaml ./
COPY src/ src/
COPY data/ data/
RUN uv sync --no-dev --frozen
ARG GIT_COMMIT=unknown
ARG GIT_TAG=unknown
ARG GIT_BRANCH=unknown
RUN echo "{\"commit\":\"$GIT_COMMIT\",\"tag\":\"$GIT_TAG\",\"branch\":\"$GIT_BRANCH\"}" > build_info.json
COPY scripts/entrypoint.sh scripts/healthcheck.py /scripts/
RUN chmod +x /scripts/entrypoint.sh /scripts/healthcheck.py
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD ["/scripts/healthcheck.py"]
ENTRYPOINT ["/scripts/entrypoint.sh"]
CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "5001"]
