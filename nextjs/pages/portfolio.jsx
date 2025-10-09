import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Stack,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Swal from "sweetalert2";

export default function PortfolioPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch portfolio data
  async function fetchPortfolio() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/portfolio/1");
      if (!res.ok) throw new Error("Failed to fetch portfolio data");
      const portfolio = await res.json();

      // Fetch live stock info for each symbol
      const updated = await Promise.all(
        portfolio.map(async (item) => {
          try {
            const stockRes = await fetch(
              `http://localhost:8000/api/stocks/${encodeURIComponent(item.symbol)}`
            );
            if (!stockRes.ok) throw new Error("Stock data not found");
            const stockData = await stockRes.json();
            const quote = stockData.quote || {};

            return {
              ...item,
              current_price: quote.c ?? null,
              change_percent: quote.dp ?? null,
              value:
                item.shares && quote.c
                  ? (item.shares * quote.c).toFixed(2)
                  : "-",
            };
          } catch (err) {
            console.error(`Error fetching ${item.symbol}:`, err);
            return { ...item, current_price: "-", change_percent: "-", value: "-" };
          }
        })
      );

      setRows(updated);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  // Update prices in backend + refresh data
  async function updatePrices() {
    try {
      const res = await fetch("http://localhost:8000/api/portfolio/update_prices", {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to update prices");
      await fetchPortfolio(); // reload new values
      console.log("✅ Portfolio prices updated.");
    } catch (err) {
      console.error("Auto update failed:", err);
    }
  }

  // Auto refresh every 60 seconds
  useEffect(() => {
    fetchPortfolio();

    const interval = setInterval(() => {
      updatePrices();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  const columns = [
    { field: "symbol", headerName: "Symbol", width: 120 },
    { field: "shares", headerName: "Shares", width: 120 },
    { field: "avg_price", headerName: "Avg Price", width: 150 },
    { field: "current_price", headerName: "Current Price", width: 150 },
    {
      field: "change_percent",
      headerName: "Change (%)",
      width: 130,
      renderCell: (params) => {
        const val = params.value;
        if (val == null || val === "-") return "—";
        return (
          <span style={{ color: val >= 0 ? "green" : "red", fontWeight: 600 }}>
            {val.toFixed(2)}%
          </span>
        );
      },
    },
    { field: "value", headerName: "Total Value ($)", width: 150 },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Portfolio Overview
      </Typography>

      <Paper sx={{ height: 600, p: 2 }}>
        {loading ? (
          <Stack
            justifyContent="center"
            alignItems="center"
            sx={{ height: "100%" }}
          >
            <CircularProgress />
          </Stack>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            disableSelectionOnClick
            getRowId={(row) => row.id || row.symbol}
          />
        )}
      </Paper>
    </Container>
  );
}
