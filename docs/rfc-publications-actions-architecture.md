## Problem

The publications and actions logic in the Faunistica3x backend suffers from several architectural issues that make the codebase hard to navigate, test, and maintain:

- **Shallow modules**: `service/publications.py` (10 lines) and `repository/log.py` (16 lines) are trivial utilities that don't deserve standalone files. The interface is nearly as complex as the implementation, violating John Ousterhout's deep module principle.

- **Fragmented publication queue logic**: The concept of "publication queue" (stored as pipe-delimited `user.items`) is split across `service/publications.py`, `api/publications/current.py`, `api/publications/complete.py`, and `bot/handlers.py`. Understanding how the queue works requires bouncing between 5+ files.

- **Duplicated action logging**: Two competing implementations exist — `ActionService.save_action()` (used by API endpoints) and `repository/log.log_action()` (used by bot handlers). They have different signatures (IP logging, error handling), creating inconsistency in how actions are recorded.

- **Stringly-typed action types**: All 12 action types (`fau_win`, `publ_end_full`, `publ_rem_json`, `bot_auth`, etc.) are scattered as string literals across 6+ files. A typo silently breaks functionality with no compile-time or test-time check.

- **No transaction boundary in completion**: `api/publications/complete.py` logs an action and updates the user queue in separate commits. If `save_action` succeeds but `update_user` fails (or vice versa), the system state becomes inconsistent.

- **Duplicated access checks**: Three API endpoints repeat the same `if user.publ_id != publ_id: raise PublicationForbiddernError` pattern instead of centralizing it.

## Proposed Interface

### ActionService (deep module with typed methods)

```python
class ActionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # Command methods — use session.execute(insert(Action)...) NOT session.add()
    # All command methods do NOT commit — caller controls transaction

    def log_publ_complete(
        self, user_id: int, level: ProcessingLevel, publ_id: int, ip: str | None
    ) -> None:
        """Formats object as str(publ_id), action as f"publ_end_{level}"."""

    def log_publ_metadata(
        self, user_id: int, publ_id: int, metadata: dict, ip: str | None
    ) -> None:
        """Formats object as JSON with publ_id included."""

    def log_publ_comment(
        self, user_id: int, publ_id: int, comment: str, ip: str | None
    ) -> None:
        """Formats object as f"{publ_id}_comm:{comment}"."""

    def log_win(
        self, user_id: int, picfile: str, message: str, ip: str | None
    ) -> None:
        """Formats object as f"{picfile}|{message}"."""

    def log_login(self, user_id: int, ip: str | None) -> None: ...
    def log_logout(self, user_id: int, ip: str | None) -> None: ...
    def log_bot_auth(self, user_id: int, status: str, ip: str | None = None) -> None: ...
    def log_bot_rename(self, user_id: int, old: str, new: str, ip: str | None = None) -> None: ...
    def log_milestone(self, user_id: int, milestone: int, ip: str | None) -> None: ...

    # Query methods — unchanged logic, use session.execute(select(...)) style

    async def get_winner_info(self, user_id: int) -> WinnerInfo | None: ...
    async def is_publication_completed(self, user_id: int, publ_id: int) -> bool: ...
    async def get_last_milestone(self, user_id: int) -> MilestoneInfo | None: ...
```

### PublicationService (deep module, accepts TokenUser for API convenience)

```python
class PublicationService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.actions = ActionService(session)
        self.repo = PublicationRepository(session)

    async def complete(
        self, token_user: TokenUser, publ_id: int, level: ProcessingLevel, ip: str | None
    ) -> None:
        """
        Single transaction: validate access, log action, advance queue,
        update user.publ_id and user.items, commit.
        """

    async def get_current(
        self, token_user: TokenUser, list_all: bool = False
    ) -> list[Publication]:
        """
        Absorbs current.py logic: parse user.items queue, resolve publ_ids,
        return current publication or full queue.
        """

    async def validate_access(self, user_id: int, publ_id: int) -> None:
        """Raises PublicationForbiddernError if user.publ_id != publ_id."""
```

### Usage Example

```python
# FastAPI DI wiring
def get_action_service(session: DBSession) -> ActionService:
    return ActionService(session)

def get_pub_service(
    session: DBSession,
    action_service: ActionService = Depends(get_action_service),
) -> PublicationService:
    return PublicationService(session)

# API endpoint — becomes 3 lines
@router.post("/{publ_id}/complete", status_code=HTTP_204_NO_CONTENT)
async def complete_publication(
    publ_id: int, data: PublicationComplete,
    token: TokenUser, ip: ClientIP,
    pub_service: PublicationService = Depends(get_pub_service),
) -> None:
    await pub_service.complete(token, publ_id, data.processing_level, ip)

# Bot handler via aiogram middleware
async def handle_bot_auth(
    message: Message, user_id: int,
    action_service: ActionService = Depends(get_action_service),
) -> None:
    action_service.log_bot_auth(user_id, "success", ip=None)
```

### What Complexity Is Hidden

**ActionService**:
- `session.execute(insert(Action)...)` Core-style writes (no `session.add()`)
- Per-method object string formatting (`pic|msg`, `publ_id_comm:comment`, JSON metadata)
- ProcessingLevel → `publ_end_{level}` mapping inside `log_publ_complete()`
- No commit — caller controls transaction

**PublicationService**:
- Queue parsing (`pipe_to_array` / `array_to_pipe` logic absorbed internally)
- Access validation (raises `PublicationForbiddernError`)
- Completion orchestration (action log + queue advance + user update in one transaction)
- Current publication resolution (absorbs `current.py` logic)

## Dependency Strategy

**Category**: Local-substitutable (Postgres via testcontainers)

- **Session injection**: Both services receive `AsyncSession` via FastAPI dependency injection (service factory pattern). No session parameter in method signatures.
- **ActionService dependency**: PublicationService creates ActionService internally with the same session, ensuring same transaction.
- **Repository dependencies**: PublicationService imports `PublicationRepository` directly and creates it with the same session.
- **Bot handlers**: Receive ActionService via aiogram middleware injection (same `get_action_service` factory pattern).
- **Testing**: Existing testcontainers with real Postgres will be used. No InMemoryActionService — user is satisfied with current integration test approach.
- **ProcessingLevel enum**: Moved from `api/publications/complete.py` to `schema/common.py` so both services can import it without cross-layer dependencies.

## Testing Strategy

### New boundary tests to write

- **PublicationService.complete()**: Verify that after calling complete, the action is logged, the queue is advanced (first item popped), `user.publ_id` is updated to next publication, and `user.items` is correctly updated. Verify single transaction behavior: if an error occurs, nothing is committed.

- **PublicationService.get_current()**: Verify it returns the current publication when `list_all=False`, and returns current + queue when `list_all=True`. Verify it correctly parses `user.items` and resolves publication IDs.

- **PublicationService.validate_access()**: Verify it raises `PublicationForbiddernError` when `user.publ_id != publ_id`.

- **ActionService typed methods**: Verify each method formats the `object` string correctly and sets the right `action` type. Verify methods do not commit the session.

### Old tests to delete

- **test_publications.py**: Tests for `pipe_to_array` and `array_to_pipe` are now redundant — these functions are absorbed into PublicationService and tested via boundary tests.
- **Shallow unit tests** for `repository/log.py` (if any) — the file is deleted.

### Test environment needs

- Existing testcontainers with real PostgreSQL — no changes needed.
- Testcontainers setup in `conftest.py` remains unchanged.
- Update existing `test_publications_complete.py` and other API integration tests to work with the new service interfaces (the tests will call services directly or via API endpoints, which are now thin wrappers).

## Implementation Recommendations

### What PublicationService should own (responsibilities)

- Publication queue parsing and advancement (the `user.items` pipe-delimited string)
- Access validation for publication endpoints
- Completion orchestration: action logging + queue advancement + user state update in a single transaction
- Current publication resolution (logic currently in `api/publications/current.py`)

### What PublicationService should hide (implementation details)

- `pipe_to_array()` and `array_to_pipe()` functions (currently in `service/publications.py`)
- The `user.items` pipe-delimited format — callers don't need to know about it
- Queue advancement logic (pop first item, update `user.publ_id` and `user.items`)
- Action type strings and object formatting (delegated to ActionService)
- Transaction management (single commit after all operations)

### What PublicationService should expose (interface contract)

- `complete(token_user, publ_id, level, ip)` — complete a publication
- `get_current(token_user, list_all)` — get current or all assigned publications
- `validate_access(user_id, publ_id)` — validate user has access to a publication

### What ActionService should own (responsibilities)

- All action logging with typed methods (one per action type)
- Object string formatting for each action type
- Query methods: `get_winner_info`, `is_publication_completed`, `get_last_milestone`

### What ActionService should hide (implementation details)

- `session.execute(insert(Action)...)` Core-style writes
- Action type strings (e.g., `"publ_end_full"`, `"fau_win"`) — internal to each method
- Object string formatting (e.g., `f"{picfile}|{message}"` for `fau_win`)
- The fact that methods don't commit (caller controls transaction)

### What ActionService should expose (interface contract)

- ~9 typed command methods: `log_publ_complete()`, `log_publ_metadata()`, `log_publ_comment()`, `log_win()`, `log_login()`, `log_logout()`, `log_bot_auth()`, `log_bot_rename()`, `log_milestone()`
- 3 query methods: `get_winner_info()`, `is_publication_completed()`, `get_last_milestone()`

### How callers should migrate to the new interface

1. **API endpoints**: Inject `PublicationService` via `Depends(get_pub_service)`. Replace body with 1-3 line calls to service methods. Remove `ProcessingLevel` import (moved to schema). Remove `action_map` dictionary.

2. **Bot handlers**: Receive `ActionService` via aiogram middleware. Replace `log_action(session, ...)` calls with `action_service.log_bot_auth(...)` etc. Pass `ip=None`.

3. **MilestoneService**: Update to use `action_service.log_milestone(user_id, milestone, ip)` instead of `action_service.save_action(..., "fau_50", str(milestone), ip)`.

4. **Delete `repository/log.py`**: Remove all imports of `log_action` and replace with ActionService calls.

5. **Move `ProcessingLevel`**: Copy enum from `api/publications/complete.py` to `schema/common.py`. Update imports in services.

6. **Rewrite `service/publications.py`**: Replace 10-line utility with full PublicationService implementation. Delete old `pipe_to_array`/`array_to_pipe` exports (they become internal helpers).

7. **Update `service/actions.py`**: Replace `save_action()` with ~9 typed methods. Change writes to `session.execute(insert(...))`. Remove commit from command methods. Keep query methods but update to `session.execute(select(...))` style.
