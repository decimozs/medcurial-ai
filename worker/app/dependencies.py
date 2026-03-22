from functools import lru_cache
from supabase import Client, create_client
from app.config import get_settings


@lru_cache
def get_supabase_client() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


def get_api_url() -> str:
    return get_settings().api_url
