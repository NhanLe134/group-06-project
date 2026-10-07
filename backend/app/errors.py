from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class ApiError(Exception):
    """Lỗi nghiệp vụ trả về theo body chuẩn của api-contract.md: {error_code, message}.

    `details` (tùy chọn) mang thêm dữ liệu để client chỉ ra đúng chỗ lỗi, vd. danh sách món.
    """

    def __init__(
        self, status_code: int, error_code: str, message: str, details: Any = None
    ) -> None:
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
        self.details = details


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def _api_error(_: Request, exc: ApiError) -> JSONResponse:
        content = {"error_code": exc.error_code, "message": exc.message}
        if exc.details is not None:
            content["details"] = exc.details
        return JSONResponse(status_code=exc.status_code, content=content)
