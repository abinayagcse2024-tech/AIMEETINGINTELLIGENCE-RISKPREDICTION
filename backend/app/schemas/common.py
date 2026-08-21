from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime

class ApiResponse(BaseModel):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[Any] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None
