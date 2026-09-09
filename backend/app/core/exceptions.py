from __future__ import annotations

from fastapi import HTTPException, status


class UMLForgeError(HTTPException):
    """Base application error — always returns a JSON body with `detail`."""


class BadRequestError(UMLForgeError):
    def __init__(self, detail: str) -> None:
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class UnauthorizedError(UMLForgeError):
    def __init__(self, detail: str = "Authentication required.") -> None:
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class ForbiddenError(UMLForgeError):
    def __init__(self, detail: str = "You do not have permission to access this resource.") -> None:
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class NotFoundError(UMLForgeError):
    def __init__(self, detail: str = "Resource not found.") -> None:
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class ConflictError(UMLForgeError):
    def __init__(self, detail: str = "Conflict.") -> None:
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class AIProviderError(UMLForgeError):
    def __init__(self, detail: str = "AI provider failed to generate a response. Please try again.") -> None:
        super().__init__(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)


class ValidationError(UMLForgeError):
    def __init__(self, detail: str) -> None:
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)
