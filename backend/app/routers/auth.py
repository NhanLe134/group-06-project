from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.user import NguoiDung

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    tendangnhap: str
    matkhau: str

class LoginResponse(BaseModel):
    success: bool
    vaitro: str
    hoten: str
    message: str

@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    # Query database for the user
    stmt = select(NguoiDung).where(NguoiDung.tendangnhap == request.tendangnhap)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản không tồn tại"
        )
        
    if user.matkhau != request.matkhau:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mật khẩu không chính xác"
        )
        
    return LoginResponse(
        success=True,
        vaitro=user.vaitro,
        hoten=user.hoten,
        message="Đăng nhập thành công"
    )
