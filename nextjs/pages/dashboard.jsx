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
import Swal from "sweetalert2";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState([]);
  const [totalValue, setTotalValue] = useState(0);

  async function fetchPortfolio() {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        setLoading(false);
        Swal.fire({
          title: "Login Required",
          text: "Please log in again to view your dashboard.",
          icon: "warning",
        });
        return;
      }

      const res = await fetch(`http://localhost:8000/api/portfolio/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch portfolio");
      const data = await res.json();

      const total = data.reduce(
        (sum, stock) => sum + stock.shares * stock.avg_price,
        0
      );
      setTotalValue(total);

      // sort top 3 holdings
      const sorted = [...data].sort((a, b) => b.avg_price - a.avg_price);
      setPortfolio(sorted.slice(0, 3));
    } catch (err) {
      console.error("Error fetching portfolio:", err);
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPortfolio();
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
            <Typography variant="h6">Your Portfolio</Typography>
            <Typography variant="h4" color="primary" gutterBottom>
              ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Top 3 Holdings
            </Typography>

            <Grid container spacing={2}>
              {portfolio.length === 0 ? (
                <Typography sx={{ ml: 2 }}>No stocks in your portfolio yet.</Typography>
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
          </>
        )}
      </Paper>
    </Container>
  );
}
