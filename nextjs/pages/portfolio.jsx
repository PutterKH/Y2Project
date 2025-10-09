import { useEffect, useState } from "react";
import { Container, Typography, Paper, Stack, CircularProgress } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Swal from "sweetalert2";

export default function PortfolioPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchPortfolio() {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) return;
      const res = await fetch(`http://localhost:8000/api/portfolio/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch portfolio data");
      const portfolio = await res.json();

      const updated = await Promise.all(
        portfolio.map(async (item) => {
          const stockRes = await fetch(`http://localhost:8000/api/stocks/${item.symbol}`);
          const stockData = await stockRes.json();
          const quote = stockData.quote || {};
          return {
            ...item,
            current_price: quote.c ?? "-",
            change_percent: quote.dp ?? "-",
            value: item.shares && quote.c ? (item.shares * quote.c).toFixed(2) : "-",
          };
        })
      );

      setRows(updated);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPortfolio();
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
        return val === "-" ? "—" : (
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
      <Typography variant="h5" gutterBottom>Portfolio Overview</Typography>
      <Paper sx={{ height: 600, p: 2 }}>
        {loading ? (
          <Stack justifyContent="center" alignItems="center" sx={{ height: "100%" }}>
            <CircularProgress />
          </Stack>
        ) : (
          <DataGrid rows={rows} columns={columns} pageSize={10} getRowId={(r) => r.id || r.symbol} />
        )}
      </Paper>
    </Container>
  );
}
