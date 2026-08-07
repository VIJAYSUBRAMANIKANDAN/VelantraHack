from pathlib import Path
from pydantic_settings import BaseSettings

# app/core/config.py -> parents[1] = app/, parents[2] = backend/
# Anchoring to this file's location (not process cwd) means the model path
# is correct no matter where uvicorn is launched from (backend/, repo root,
# a systemd unit, Docker WORKDIR, an IDE run config, etc).
_BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    environment: str = "development"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    cors_origins: str = "http://localhost:5173"

    database_url: str = "postgresql://velantra_user:velantra_pass@localhost:5432/velantra"

    openai_api_key: str = ""

    ml_model_path: str = str(_BACKEND_DIR / "app" / "ml" / "price_model.joblib")
    mandi_data_dir: str = str(_BACKEND_DIR / "app" / "ml")

    web3_provider_url: str = "https://rpc-mumbai.maticvigil.com"
    escrow_contract_address: str = ""
    deployer_private_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
