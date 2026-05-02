import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_exception_handler_returns_json(async_client: AsyncClient) -> None:
    from app import app
    from core.exceptions import PublicationNotFoundError

    async def raise_exc():
        raise PublicationNotFoundError(publ_id=999)

    app.add_api_route("/test-exc", raise_exc, methods=["GET"])
    response = await async_client.get("/test-exc")
    assert response.status_code == 404
    data = response.json()
    assert data == {"error": "PUBL_NOT_FOUND", "message": "Publication 999 not found"}
