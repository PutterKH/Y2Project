import { useState } from "react";
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

  const API_BASE = "http://localhost:8000/api";

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
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVolumeChange = (e) => {
    const vol = e.target.value;
    setVolume(vol);
    if (stock?.quote?.c) setTotal(parseFloat(vol || 0) * stock.quote.c);
  };

  const handleTransaction = async (type) => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return Swal.fire("Error", "Please log in first.", "error");
    if (!stock) return Swal.fire("Error", "Search for a stock first.", "error");
    if (!volume || volume <= 0)
      return Swal.fire("Error", "Enter a valid volume.", "error");

    const payload = {
      user_id: parseInt(userId),
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
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
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
          <Button variant="contained" onClick={handleSearch} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Go"}
          </Button>
        </Stack>

        {stock && (
          <>
            <Typography variant="h6">{stock.profile?.name || stock.symbol}</Typography>
            <Stack direction="row" justifyContent="center" spacing={2} sx={{ mb: 2 }}>
              <Typography>Volume</Typography>
              <TextField
                type="number"
                size="small"
                value={volume}
                onChange={handleVolumeChange}
                sx={{ width: 100 }}
              />
            </Stack>
            <Stack direction="row" justifyContent="center" spacing={2} sx={{ mb: 3 }}>
              <Typography>Price</Typography>
              <TextField
                size="small"
                value={stock.quote?.c?.toFixed(2) ?? ""}
                InputProps={{ readOnly: true }}
                sx={{ width: 120 }}
              />
            </Stack>
            <Stack direction="row" justifyContent="center" spacing={2}>
              <Button
                variant="contained"
                sx={{ backgroundColor: "#fbbf24" }}
                onClick={() => handleTransaction("buy")}
              >
                Buy
              </Button>
              <Button
                variant="contained"
                sx={{ backgroundColor: "#dc2626" }}
                onClick={() => handleTransaction("sell")}
              >
                Sell
              </Button>
            </Stack>
          </>
        )}
      </Paper>
    </Container>
  );
}
