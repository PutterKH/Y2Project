import { useState, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Stack,
  Typography,
  InputAdornment,
  Paper,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Swal from "sweetalert2";

export default function TransactionPage() {
  const [symbol, setSymbol] = useState("");
  const [stock, setStock] = useState(null);
  const [volume, setVolume] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const API_BASE = "http://localhost:8000/api"; // ✅ backend address

  // 🔍 Auto-fetch when typing (>= 4 chars)
  useEffect(() => {
    if (symbol.length >= 4) {
      // debounce so we don't call API every keystroke
      if (typingTimeout) clearTimeout(typingTimeout);
      const timeout = setTimeout(() => {
        handleSearch();
      }, 600);
      setTypingTimeout(timeout);
    }
    // cleanup previous timeout on change
    return () => clearTimeout(typingTimeout);
  }, [symbol]);

  // 🔍 Fetch stock info by symbol
  const handleSearch = async () => {
    if (!symbol.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/stocks/${symbol.toUpperCase()}`);
      if (!res.ok) throw new Error("Symbol not found or API error");
      const data = await res.json();
      setStock(data);
      setVolume("");
      setTotal(0);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message, "error");
      setStock(null);
    } finally {
      setLoading(false);
    }
  };

  // 🔢 Update total when volume changes
  const handleVolumeChange = (e) => {
    const vol = e.target.value;
    setVolume(vol);
    if (stock?.quote?.c) {
      setTotal(parseFloat(vol || 0) * stock.quote.c);
    }
  };

  // 🟢 Buy or 🔴 Sell
  const handleTransaction = async (type) => {
    if (!stock) return Swal.fire("Error", "Search for a stock first.", "error");
    if (!volume || volume <= 0)
      return Swal.fire("Error", "Please enter a valid volume.", "error");

    const payload = {
      user_id: 1, // replace with your user id
      symbol: stock.symbol,
      shares: parseInt(volume),
      avg_price: stock.quote.c,
    };

    try {
      const res = await fetch(`${API_BASE}/portfolio/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Transaction failed");
      Swal.fire("Success", data.message, "success");
      setVolume("");
      setTotal(0);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        mt: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
        {/* 🔍 Search by symbol */}
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
          <TextField
            placeholder="Enter stock symbol (e.g., AAPL)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            size="small"
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#6b21a8",
              "&:hover": { backgroundColor: "#581c87" },
              textTransform: "none",
            }}
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Go"}
          </Button>
        </Stack>

        {/* 📊 Stock Info */}
        {loading ? (
          <CircularProgress />
        ) : (
          stock && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {stock.profile?.name || stock.symbol}
              </Typography>

              {/* Volume / Price Inputs */}
              <Stack
                direction="row"
                justifyContent="center"
                alignItems="center"
                spacing={2}
                sx={{ mb: 2 }}
              >
                <Typography>Volume</Typography>
                <TextField
                  type="number"
                  size="small"
                  value={volume}
                  onChange={handleVolumeChange}
                  sx={{ width: 100 }}
                />
              </Stack>

              <Stack
                direction="row"
                justifyContent="center"
                alignItems="center"
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Typography>Price</Typography>
                <TextField
                  size="small"
                  value={stock.quote?.c?.toFixed(2) ?? ""}
                  InputProps={{ readOnly: true }}
                  sx={{ width: 120 }}
                />
              </Stack>

              {/* Buttons */}
              <Stack direction="row" justifyContent="center" spacing={2} sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#fbbf24",
                    "&:hover": { backgroundColor: "#f59e0b" },
                    width: 90,
                  }}
                  onClick={() => handleTransaction("buy")}
                >
                  Buy
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#dc2626",
                    "&:hover": { backgroundColor: "#b91c1c" },
                    width: 90,
                  }}
                  onClick={() => handleTransaction("sell")}
                >
                  Sell
                </Button>
              </Stack>

              {/* Info */}
              <Typography>
                <strong>Current Price:</strong>{" "}
                {stock.quote?.c ? `$${stock.quote.c.toFixed(2)}` : "—"}
              </Typography>
              <Typography>
                <strong>Total:</strong> {total ? `$${total.toFixed(2)}` : "—"}
              </Typography>
              <Typography>
                <strong>Bid:</strong> {stock.quote?.h ?? "-"}
              </Typography>
              <Typography>
                <strong>Offer:</strong> {stock.quote?.l ?? "-"}
              </Typography>
            </>
          )
        )}
      </Paper>
    </Container>
  );
}
