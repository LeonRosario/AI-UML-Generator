from __future__ import annotations

import re
from pydantic import BaseModel, field_validator

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_email_address(v: str) -> str:
    v = v.strip().lower()
    if not EMAIL_REGEX.match(v):
        raise ValueError("Please enter a valid email address.")
    return v


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name must not be empty.")
        return v

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        return validate_email_address(v)

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str
    remember: bool = False

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        return validate_email_address(v)


class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        return validate_email_address(v)


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str | None = None

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    """Matches frontend expectation with optional bearer token."""

    user: UserOut
    access_token: str | None = None
    token_type: str = "bearer"
