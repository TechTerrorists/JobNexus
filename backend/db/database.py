import os
from dotenv import load_dotenv
from supabase import create_client, Client
load_dotenv()


supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_API_KEY")

supabase: Client = None # type: ignore
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)