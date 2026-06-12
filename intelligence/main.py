import os
from fastapi import FastAPI, HTTPException, Security, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

load_dotenv()

from modules.username import scan_username
from modules.domain import scan_domain
from modules.ip import scan_ip

# FIX: Internal shared secret so only the Node backend can call this service
INTERNAL_SECRET = os.getenv("INTERNAL_SECRET", "")
api_key_header = APIKeyHeader(name="X-Internal-Secret", auto_error=False)

app = FastAPI(title="ShadowTrace Intelligence Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_secret(key: str = Security(api_key_header)):
    """Reject requests that don't carry the shared internal secret."""
    if INTERNAL_SECRET and key != INTERNAL_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing internal secret"
        )


class UsernameRequest(BaseModel):
    username: str

class DomainRequest(BaseModel):
    domain: str

class IPRequest(BaseModel):
    ip: str


@app.get("/health")
def health():
    return {"status": "ok", "engine": "ShadowTrace Intelligence Engine v1.0"}


@app.post("/scan/username", dependencies=[Security(verify_secret)])
async def username_scan(req: UsernameRequest):
    if not req.username or len(req.username.strip()) < 1:
        raise HTTPException(status_code=400, detail="Username required")
    result = await scan_username(req.username.strip())
    return result


@app.post("/scan/domain", dependencies=[Security(verify_secret)])
async def domain_scan(req: DomainRequest):
    domain = req.domain.strip().lower()
    domain = domain.replace("https://", "").replace("http://", "").rstrip("/")
    if not domain:
        raise HTTPException(status_code=400, detail="Domain required")
    result = await scan_domain(domain)
    return result


@app.post("/scan/ip", dependencies=[Security(verify_secret)])
async def ip_scan(req: IPRequest):
    if not req.ip or len(req.ip.strip()) < 3:
        raise HTTPException(status_code=400, detail="IP required")
    result = await scan_ip(req.ip.strip())
    return result


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
