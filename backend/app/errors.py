import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.logging_setup import kv

log = logging.getLogger("app.http")


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
    async def _api_error(request: Request, exc: ApiError) -> JSONResponse:
        # Lỗi nghiệp vụ đã lường trước (404/409/422...) — ghi mức INFO, 5xx ghi ERROR
        level = logging.ERROR if exc.status_code >= 500 else logging.INFO
        log.log(level, "api_error %s", kv(
            method=request.method, path=request.url.path,
            status=exc.status_code, code=exc.error_code,
        ))
        content = {"error_code": exc.error_code, "message": exc.message}
        if exc.details is not None:
            content["details"] = exc.details
        return JSONResponse(status_code=exc.status_code, content=content)

    @app.exception_handler(Exception)
    async def _unexpected(request: Request, exc: Exception) -> JSONResponse:
        """Lỗi không lường trước: ghi đủ traceback vào log, client chỉ nhận thông báo chung
        (không lộ chi tiết bên trong). Giáo trình §11.3, viva §16.3."""
        log.exception("unhandled_error %s", kv(
            method=request.method, path=request.url.path, error=type(exc).__name__,
        ))
        return JSONResponse(
            status_code=500,
            content={"error_code": "INTERNAL_ERROR", "message": "Lỗi máy chủ, vui lòng thử lại."},
        )
