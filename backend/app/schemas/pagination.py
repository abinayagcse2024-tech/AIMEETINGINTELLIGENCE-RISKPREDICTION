from pydantic import BaseModel
from typing import List, TypeVar, Generic
import math

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    page: int
    page_size: int
    total: int
    total_pages: int

def paginate(query, page: int, page_size: int):
    total = query.count()
    total_pages = math.ceil(total / page_size) if page_size > 0 else 0
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total, total_pages
