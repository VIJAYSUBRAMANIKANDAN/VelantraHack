from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.security import decode_token
from jose import JWTError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_farmer_id(token: str = Depends(oauth2_scheme)) -> int:
    """Decodes the JWT and returns the farmer id encoded as `sub`.
    Raises 401 on any invalid/expired token."""
    try:
        payload = decode_token(token)
        farmer_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return farmer_id
