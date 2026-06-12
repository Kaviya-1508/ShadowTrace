import asyncio
import time

class RateLimiter:
    """Simple async rate limiter to avoid hammering APIs."""

    def __init__(self, calls_per_second: float = 2.0):
        self.min_interval = 1.0 / calls_per_second
        self.last_call = 0.0
        self._lock = asyncio.Lock()

    async def wait(self):
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_call
            if elapsed < self.min_interval:
                await asyncio.sleep(self.min_interval - elapsed)
            self.last_call = time.monotonic()

# Shared limiters
platform_limiter = RateLimiter(calls_per_second=1.5)
# FIX: dns_limiter is now wired into domain DNS calls (was defined but unused)
dns_limiter = RateLimiter(calls_per_second=3.0)
