from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # Đọc backend/.env (không commit — mẫu ở backend/.env.example).
    # Biến môi trường thật của hệ thống được ưu tiên hơn file .env,
    # nên khi deploy chỉ cần khai báo trong environment manager.
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    # PostgreSQL: Supabase (Session pooler, ADR-ARCH-003) hoặc Docker local (docker-compose.yml).
    database_url: str = "postgresql://app:app-local-password@localhost:5432/app"
    # true CHỈ khi chạy DB local trống: tự tạo bảng + seed món mẫu.
    # Không bật với Supabase dùng chung.
    auto_create_schema: bool = False
    # true để bật endpoint demo (POST /kds/demo/orders) khi chưa có luồng đặt món thật.
    demo_mode: bool = False

    jwt_secret: str = "change-me"
    ai_api_key: str = ""

    # Supabase — SECRET, chỉ nằm ở backend (tác vụ server-side, ví dụ Realtime broadcast).
    # Tuyệt đối không trả về client, không đưa vào frontend.
    supabase_url: str = ""
    supabase_secret_key: str = ""

    @property
    def async_database_url(self) -> str:
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        # SQLite local (aiosqlite) — dùng khi không có Docker/PostgreSQL
        if self.database_url.startswith("sqlite://"):
            return self.database_url  # đã đúng format sqlite+aiosqlite://
        return self.database_url


settings = Settings()
