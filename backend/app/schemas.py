from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    is_admin: bool

    class Config:
        orm_mode = True

class MovieBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration: int

class MovieCreate(MovieBase):
    pass

class MovieOut(MovieBase):
    id: int

    class Config:
        orm_mode = True

class ShowtimeBase(BaseModel):
    movie_id: int
    room_id: int
    start_time: datetime

class ShowtimeCreate(ShowtimeBase):
    pass

class ShowtimeOut(ShowtimeBase):
    id: int

    class Config:
        orm_mode = True
