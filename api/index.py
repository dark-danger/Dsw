"""
Vercel Serverless Function entrypoint.

Vercel's @vercel/python runtime expects either:
  - a top-level `app` (ASGI)  — detected automatically
  - a top-level `handler`     — detected automatically

We expose both for maximum compatibility.
The `mangum` adapter wraps the ASGI app so it also works on AWS Lambda-style
runtimes (which is what Vercel's Python builder uses under the hood).
"""

from backend.main import app  # noqa: F401 — re-export for Vercel auto-detection

# mangum makes the ASGI app callable as an AWS Lambda handler
try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="auto")
except ImportError:
    # If mangum isn't installed (e.g. local dev without it), fall back to plain ASGI
    handler = app
