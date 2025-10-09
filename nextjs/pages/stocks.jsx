import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Stack,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Swal from "sweetalert2";

export default function StocksPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch stock data (used for both manual + auto refresh)
  async function fetchStocks() {
    setLoading(true);
    try {
      const res = await fetch(
        "http://localhost:8000/api/stocks?symbols=AAPL,MSFT,GOOGL,AMZN,NVDA,META,TSLA,INTC,AMD,NFLX,ADBE,ORCL,CSCO,IBM,BA,KO,PEP,V,MA,NKE,JPM,BAC,WMT,PFE,CVX"
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

  // Auto-refresh every 60 seconds
  useEffect(() => {
    fetchStocks(); // Initial load

    const interval = setInterval(fetchStocks, 60000); // 60,000 ms = 60 s
    return () => clearInterval(interval); // Cleanup
  }, []);

  // Table columns
  const columns = [
    { field: "symbol", headerName: "Symbol", width: 120 },
    { field: "name", headerName: "Company Name", width: 220 },
    { field: "exchange", headerName: "Exchange", width: 150 },
    { field: "price", headerName: "Price", width: 120 },
    { field: "change", headerName: "Change", width: 120 },
    {
      field: "percent",
      headerName: "% Change",
      width: 130,
      renderCell: (params) => (
        <span
          style={{
            color: params.value.startsWith("-") ? "red" : "green",
            fontWeight: 500,
          }}
        >
          {params.value}
        </span>
      ),
    },
    { field: "marketCap", headerName: "Market Cap", width: 180 },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">Stock Market Overview</Typography>
        <Button
          variant="contained"
          onClick={fetchStocks}
          disabled={loading}
          sx={{ textTransform: "none" }}
        >
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </Stack>

      <Paper sx={{ height: 700, width: "100%", p: 2 }}>
        {loading ? (
          <Stack
            justifyContent="center"
            alignItems="center"
            sx={{ height: "100%" }}
          >
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Fetching stock data...</Typography>
          </Stack>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25]}
            disableSelectionOnClick
          />
        )}
      </Paper>
    </Container>
  );
}
