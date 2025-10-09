from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from database import database

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

# ------------------ Models ------------------
class PortfolioIn(BaseModel):
    user_id: int
    symbol: str
    shares: int
    avg_price: float


class PortfolioOut(PortfolioIn):
    id: int


# ------------------ GET Portfolio ------------------
@router.get("/{user_id}", response_model=List[PortfolioOut])
async def get_portfolio(user_id: int):
    """Return all portfolio records for a user."""
    query = "SELECT * FROM portfolio WHERE user_id = :user_id ORDER BY id ASC"
    rows = await database.fetch_all(query, {"user_id": user_id})
    return rows


# ------------------ BUY Stock ------------------
@router.post("/buy")
async def buy_stock(item: PortfolioIn):
    """Buy stock → insert or update existing position"""
    symbol = item.symbol.upper()

    # Check if user already owns this stock
    existing = await database.fetch_one(
        "SELECT * FROM portfolio WHERE user_id = :user_id AND symbol = :symbol",
        {"user_id": item.user_id, "symbol": symbol},
    )

    if existing:
        # Update shares + average price
        total_shares = existing["shares"] + item.shares
        new_avg_price = (
            (existing["avg_price"] * existing["shares"]) +
            (item.avg_price * item.shares)
        ) / total_shares

        query = """
            UPDATE portfolio
            SET shares = :shares, avg_price = :avg_price
            WHERE user_id = :user_id AND symbol = :symbol
        """
        await database.execute(query, {
            "shares": total_shares,
            "avg_price": new_avg_price,
            "user_id": item.user_id,
            "symbol": symbol
        })

        return {"message": f"Added {item.shares} shares to {symbol}. Total: {total_shares} shares."}

    else:
        # Insert new record
        query = """
            INSERT INTO portfolio (user_id, symbol, shares, avg_price)
            VALUES (:user_id, :symbol, :shares, :avg_price)
        """
        await database.execute(query, {
            "user_id": item.user_id,
            "symbol": symbol,
            "shares": item.shares,
            "avg_price": item.avg_price
        })

        return {"message": f"Bought {item.shares} shares of {symbol}."}
@router.put("/update_prices")
async def update_portfolio_prices():
    """
    Fetch current prices for each stock and update the portfolio table.
    """
    import httpx

    # Fetch all unique symbols
    rows = await database.fetch_all("SELECT DISTINCT symbol FROM portfolio")
    if not rows:
        return {"message": "No portfolio data found."}

    updated = []
    async with httpx.AsyncClient() as client:
        for row in rows:
            symbol = row["symbol"]
            # call your internal stock endpoint
            try:
                resp = await client.get(f"http://localhost:8000/api/stocks/{symbol}")
                data = resp.json()
                price = data.get("quote", {}).get("c")
                if price:
                    await database.execute(
                        "UPDATE portfolio SET avg_price = :price WHERE symbol = :symbol",
                        {"price": price, "symbol": symbol},
                    )
                    updated.append({"symbol": symbol, "price": price})
            except Exception as e:
                print(f"Failed to update {symbol}: {e}")

    return {"updated": updated, "count": len(updated)}


# ------------------ SELL Stock ------------------
@router.post("/sell")
async def sell_stock(item: PortfolioIn):
    """Sell stock → decrease shares or remove record"""
    symbol = item.symbol.upper()

    existing = await database.fetch_one(
        "SELECT * FROM portfolio WHERE user_id = :user_id AND symbol = :symbol",
        {"user_id": item.user_id, "symbol": symbol},
    )

    if not existing:
        raise HTTPException(status_code=400, detail="You don't own this stock.")

    if existing["shares"] < item.shares:
        raise HTTPException(status_code=400, detail="Not enough shares to sell.")

    remaining = existing["shares"] - item.shares

    if remaining == 0:
        # Delete row if no shares left
        query = "DELETE FROM portfolio WHERE user_id = :user_id AND symbol = :symbol"
        await database.execute(query, {"user_id": item.user_id, "symbol": symbol})
        return {"message": f"Sold all shares of {symbol}. Position closed."}

    else:
        # Update remaining shares
        query = """
            UPDATE portfolio
            SET shares = :shares
            WHERE user_id = :user_id AND symbol = :symbol
        """
        await database.execute(query, {
            "shares": remaining,
            "user_id": item.user_id,
            "symbol": symbol
        })
        return {"message": f"Sold {item.shares} shares of {symbol}. Remaining: {remaining} shares."}