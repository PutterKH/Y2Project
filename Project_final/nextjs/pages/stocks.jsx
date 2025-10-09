import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Swal from "sweetalert2";

export default function StocksPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch stock data on page load
  useEffect(() => {
    async function fetchStocks() {
      try {
        const res = await fetch(
          "http://localhost:8000/api/stocks?symbols=AAPL,MSFT,TSLA"
        );
        if (!res.ok) throw new Error("Failed to fetch stock data");
        const data = await res.json();

        // Map API response into DataGrid rows
        const mapped = data.map((stock, index) => ({
          id: index + 1,
          symbol: stock.symbol,
          name: stock.profile?.name || "N/A",
          exchange: stock.profile?.exchange || "N/A",
          price: stock.quote?.c ?? "N/A",
          change: stock.quote?.d ?? "N/A",
          percent: stock.quote?.dp ? `${stock.quote.dp.toFixed(2)}%` : "N/A",
          marketCap: stock.profile?.market_cap
            ? `$${(stock.profile.market_cap / 1e9).toFixed(2)}B`
            : "N/A",
        }));

        setRows(mapped);
      } catch (err) {
        Swal.fire({ title: "Error", text: err.message, icon: "error" });
      } finally {
        setLoading(false);
      }
    }
    fetchStocks();
  }, []);

  // Define table columns
  const columns = [
    { field: "symbol", headerName: "Symbol", width: 120 },
    { field: "name", headerName: "Company Name", width: 220 },
    { field: "exchange", headerName: "Exchange", width: 150 },
    { field: "price", headerName: "Price", width: 120 },
    { field: "change", headerName: "Change", width: 120 },
    { field: "percent", headerName: "% Change", width: 130 },
    { field: "marketCap", headerName: "Market Cap", width: 180 },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Stock Market Overview
      </Typography>
      <Paper sx={{ height: 500, width: "100%", p: 2 }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            disableSelectionOnClick
          />
        )}
      </Paper>
    </Container>
  );
}
