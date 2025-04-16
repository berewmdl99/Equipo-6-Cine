from passlib.context import CryptContext

# Inicializamos el contexto de hashing con la misma configuración que en auth.py
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
    bcrypt__ident="2b"
)

def hash_password(password: str) -> str:
    """Devuelve la contraseña encriptada usando bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña en texto plano coincide con la encriptada."""
    return pwd_context.verify(plain_password, hashed_password)
