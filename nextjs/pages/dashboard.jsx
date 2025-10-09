import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Stack,
  CircularProgress,
  Divider,
  Box,
  Grid,
} from "@mui/material";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [topGlobal, setTopGlobal] = useState([]);

  // 🔹 Fetch portfolio data
  async function fetchPortfolio() {
    try {
      const res = await fetch("http://localhost:8000/api/portfolio/1"); // user_id = 1
      if (!res.ok) throw new Error("Failed to fetch portfolio");
      const data = await res.json();

      // calculate total portfolio value
      const total = data.reduce(
        (sum, stock) => sum + stock.shares * stock.avg_price,
        0
      );
      setTotalValue(total);

      // sort top 3 by highest avg_price
      const sorted = [...data].sort((a, b) => b.avg_price - a.avg_price);
      setPortfolio(sorted.slice(0, 3));
    } catch (err) {
      console.error("Error fetching portfolio:", err);
    }
  }

  // 🔹 Fetch 25 stocks data from API
  async function fetchTopGlobalStocks() {
    try {
      // Example 25 symbols (you can replace or fetch dynamically)
      const symbols = [
        "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA",
        "META", "NVDA", "NFLX", "BABA", "ORCL",
        "INTC", "AMD", "IBM", "UBER", "DIS",
        "PYPL", "PEP", "KO", "V", "MA",
        "NKE", "ADBE", "SONY", "PFE", "T"
      ].join(",");

      const res = await fetch(`http://localhost:8000/api/stocks?symbols=${symbols}`);
      if (!res.ok) throw new Error("Failed to fetch global stock data");
      const data = await res.json();

      // each item has {symbol, profile, quote}
      const sorted = [...data].sort((a, b) => (b.quote?.c ?? 0) - (a.quote?.c ?? 0));
      setTopGlobal(sorted.slice(0, 3));
    } catch (err) {
      console.error("Error fetching top global stocks:", err);
    }
  }

  // 🔁 Fetch both portfolio & top global stocks
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchPortfolio(), fetchTopGlobalStocks()]);
      setLoading(false);
    }
    loadData();

    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Portfolio Dashboard
      </Typography>

      <Paper sx={{ p: 3 }}>
        {loading ? (
          <Stack justifyContent="center" alignItems="center" sx={{ height: 200 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <>
            {/* Portfolio Summary */}
            <Typography variant="h6">Your Portfolio</Typography>
            <Typography variant="h4" color="primary" gutterBottom>
              ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Top 3 in Portfolio */}
            <Typography variant="h6" gutterBottom>
              Top 3 Holdings
            </Typography>
            <Grid container spacing={2}>
              {portfolio.length === 0 ? (
                <Typography sx={{ ml: 2 }}>No stocks found in your portfolio.</Typography>
              ) : (
                portfolio.map((stock) => (
                  <Grid item xs={12} sm={4} key={stock.symbol}>
                    <Box
                      sx={{
                        border: "1px solid #ccc",
                        borderRadius: 2,
                        p: 2,
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        {stock.symbol}
                      </Typography>
                      <Typography>Shares: {stock.shares}</Typography>
                      <Typography>Avg Price: ${stock.avg_price.toFixed(2)}</Typography>
                      <Typography color="text.secondary">
                        Value: ${(stock.shares * stock.avg_price).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                ))
              )}
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Top 3 Global Stocks */}
            <Typography variant="h6" gutterBottom>
              Top 3 Global Stocks
            </Typography>
            <Grid container spacing={2}>
              {topGlobal.length === 0 ? (
                <Typography sx={{ ml: 2 }}>No global stock data available.</Typography>
              ) : (
                topGlobal.map((stock, idx) => (
                  <Grid item xs={12} sm={4} key={idx}>
                    <Box
                      sx={{
                        border: "1px solid #ccc",
                        borderRadius: 2,
                        p: 2,
                        backgroundColor: "#fefefe",
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        {stock.symbol}
                      </Typography>
                      <Typography>
                        Current Price: ${stock.quote?.c?.toFixed(2) ?? "—"}
                      </Typography>
                      <Typography color={stock.quote?.dp > 0 ? "green" : "red"}>
                        Change: {stock.quote?.dp?.toFixed(2) ?? 0}%
                      </Typography>
                    </Box>
                  </Grid>
                ))
              )}
            </Grid>
          </>
        )}
      </Paper>
    </Container>
  );
}
