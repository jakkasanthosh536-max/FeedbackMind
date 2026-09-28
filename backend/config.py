import os
import certifi
from dotenv import load_dotenv

# Set SSL cert files for macOS Python certificate bundle
os.environ['SSL_CERT_FILE'] = certifi.where()
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()

# Load environment variables explicitly from root .env file
root_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=root_env_path, override=True)

class Settings:
    @property
    def HINDSIGHT_API_URL(self) -> str:
        return os.getenv("HINDSIGHT_API_URL", "https://api.hindsight.vectorize.io")

    @property
    def HINDSIGHT_BANK_ID(self) -> str:
        return os.getenv("HINDSIGHT_BANK_ID", "feedbackmind")

    @property
    def HINDSIGHT_API_KEY(self) -> str:
        return os.getenv("HINDSIGHT_API_KEY", "")

    @property
    def GROQ_API_KEY(self) -> str:
        return os.getenv("GROQ_API_KEY", "")

    @property
    def GROQ_MODEL(self) -> str:
        return os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

    DATA_DIR: str = os.path.join(os.path.dirname(__file__), "..", "data")

settings = Settings()
