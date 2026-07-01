from functools import lru_cache

from dotenv import load_dotenv
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    api_base_url: str = Field(default="", min_length=1)
    supabase_url: str = Field(default="", min_length=1)
    supabase_key: str = Field(default="", min_length=1)
    roboflow_api_key: str = Field(default="", min_length=1)
    roboflow_api_url: str = Field(default="", min_length=1)
    roboflow_workspace_name: str = Field(default="")
    roboflow_workspace_id: str = Field(default="")
    max_upload_size_mb: int = Field(default=10, ge=1, le=100)
    max_upload_count: int = Field(default=10, ge=1, le=100)

    @model_validator(mode="after")
    def validate_required(self):
        if not self.api_base_url:
            raise ValueError("API_BASE_URL is not set in environment variables")
        if not self.supabase_url:
            raise ValueError("SUPABASE_URL is not set in environment variables")
        if not self.supabase_key:
            raise ValueError("SUPABASE_KEY is not set in environment variables")
        if not self.roboflow_api_key:
            raise ValueError("ROBOFLOW_API_KEY is not set in environment variables")
        if not self.roboflow_api_url:
            raise ValueError("ROBOFLOW_API_URL is not set in environment variables")
        if not self.roboflow_workspace_name:
            raise ValueError(
                "ROBOFLOW_WORKSPACE_NAME is not set in environment variables"
            )
        if not self.roboflow_workspace_id:
            raise ValueError(
                "ROBOFLOW_WORKSPACE_ID is not set in environment variables"
            )
        return self


@lru_cache()
def get_settings() -> Settings:
    return Settings()
