from __future__ import annotations
import os
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
import httpx

router = APIRouter(prefix="/api/stocks", tags=["stocks"])

FINNHUB_BASE = "https://finnhub.io/api/v1"


# ---------- Pydantic models ----------
class Quote(BaseModel):
    c: Optional[float] = None  # current price
    d: Optional[float] = None  # change
    dp: Optional[float] = None # percent change
    h: Optional[float] = None  # high
    l: Optional[float] = None  # low
    o: Optional[float] = None  # open
    pc: Optional[float] = None # previous close
    t: Optional[int] = None    # timestamp (unix seconds)


class Profile(BaseModel):
    ticker: Optional[str] = None
    name: Optional[str] = None
    exchange: Optional[str] = None
    currency: Optional[str] = None
    country: Optional[str] = None
    market_cap: Optional[float] = Field(None, alias="marketCapitalization")
    logo: Optional[str] = None
    ipo: Optional[str] = None

    class Config:
        allow_population_by_field_name = True


class StockCombined(BaseModel):
    symbol: str
    profile: Profile
    quote: Quote


class CandleResponse(BaseModel):
    s: str                       # status: "ok" | "no_data"
    t: Optional[List[int]] = []  # timestamps (unix sec)
    c: Optional[List[float]] = []
    o: Optional[List[float]] = []
    h: Optional[List[float]] = []
    l: Optional[List[float]] = []
    v: Optional[List[float]] = []


# ---------- Helpers ----------
def _require_token() -> str:
    token = os.getenv("FINNHUB_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="FINNHUB_TOKEN is not set on the server.")
    return token


async def _fh_get(client: httpx.AsyncClient, path: str, params: Dict[str, Any]) -> Any:
    qp = dict(params or {})
    qp["token"] = _require_token()
    try:
        r = await client.get(f"{FINNHUB_BASE}{path}", params=qp, timeout=15.0)
        if r.status_code == 429:
            raise HTTPException(status_code=503, detail="Finnhub rate limit reached. Try again shortly.")
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
        detail = None
        try:
            detail = e.response.json()
        except Exception:
            detail = e.response.text
        raise HTTPException(status_code=e.response.status_code, detail=detail)
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Upstream request failed: {e}")


async def _fetch_profile_and_quote(client: httpx.AsyncClient, symbol: str) -> StockCombined:
    symbol = symbol.upper()
    profile_json = await _fh_get(client, "/stock/profile2", {"symbol": symbol})
    quote_json   = await _fh_get(client, "/quote", {"symbol": symbol})

    # Parse into models
    profile = Profile(**profile_json) if profile_json else Profile()
    quote = Quote(**quote_json) if quote_json else Quote()

    # Debug: log empty responses
    if not profile_json or not quote_json:
        print(f"[WARN] Empty response for {symbol}: profile={profile_json}, quote={quote_json}")

    if not (profile.name or quote.c):
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found.")

    return StockCombined(symbol=symbol, profile=profile, quote=quote)


# ---------- Routes ----------
@router.get("/{symbol}", response_model=StockCombined)
async def get_stock(symbol: str):
    """Returns company profile + real-time quote for one symbol."""
    async with httpx.AsyncClient() as client:
        return await _fetch_profile_and_quote(client, symbol)


@router.get("", response_model=List[StockCombined])
async def get_stocks(symbols: str = Query(..., description="Comma-separated symbols, e.g. AAPL,MSFT,TSLA")):
    """Batch endpoint: ?symbols=AAPL,MSFT,TSLA"""
    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not syms:
        raise HTTPException(status_code=400, detail="No symbols provided.")

    async with httpx.AsyncClient() as client:
        results: List[StockCombined] = []
        for s in syms:
            try:
                results.append(await _fetch_profile_and_quote(client, s))
            except HTTPException as e:
                print(f"[ERROR] Could not fetch {s}: {e.detail}")
                results.append(StockCombined(symbol=s, profile=Profile(), quote=Quote()))
        return results


@router.get("/{symbol}/candles", response_model=CandleResponse)
async def get_candles(
    symbol: str,
    resolution: str = Query("D", description="1,5,15,30,60, D, W, M"),
    from_unix: int = Query(..., alias="from"),
    to_unix: int = Query(..., alias="to")
):
    """Historical OHLCV candles for a symbol between 'from' and 'to' (UNIX seconds)."""
    async with httpx.AsyncClient() as client:
        data = await _fh_get(client, "/stock/candle", {
            "symbol": symbol.upper(),
            "resolution": resolution,
            "from": from_unix,
            "to": to_unix
        })
        return CandleResponse(**data)


@router.get("/search", summary="Symbol lookup")
async def search_symbols(q: str = Query(..., description="Company name or ticker, e.g. 'apple'")):
    """Lightweight symbol search (useful for autocomplete)."""
    async with httpx.AsyncClient() as client:
        return await _fh_get(client, "/search", {"q": q})
