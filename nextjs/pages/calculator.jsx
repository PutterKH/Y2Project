import React, { useMemo, useState, useEffect } from "react";
import {
  Typography,
  Button,
  Box,
  TextField,
  Card,
  CardContent,
  Grid,
  Divider,
  LinearProgress,
  Alert,
  Stack,
} from "@mui/material";
import Swal from "sweetalert2";

function parseNum(v) {
  if (v === "" || v === null || v === undefined) return null;
  const s = String(v).replace(/[%,$,\s,]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function fmtMoney(n) {
  if (n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function fmtYears(n) {
  if (n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}
function fmtPct(n) {
  if (n === null || Number.isNaN(n)) return "—";
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
}

export default function CalculatorPage() {
  const [dca, setDca] = useState("");
  const [goal, setGoal] = useState("");
  const [years, setYears] = useState("");
  const [roi, setRoi] = useState("");
  const [error, setError] = useState("");
  const [portfolioValue, setPortfolioValue] = useState(0);

  async function fetchPortfolioValue() {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) return;

      const res = await fetch(`http://localhost:8000/api/portfolio/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch portfolio data");
      const data = await res.json();
      const total = data.reduce(
        (sum, stock) => sum + stock.shares * stock.avg_price,
        0
      );
      setPortfolioValue(total);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message, "error");
    }
  }

  useEffect(() => {
    fetchPortfolioValue();
    const interval = setInterval(fetchPortfolioValue, 60000);
    return () => clearInterval(interval);
  }, []);

  const { outD, outG, outY, outR, progress } = useMemo(() => {
    const D = parseNum(dca);
    const G = parseNum(goal);
    const Y = parseNum(years);
    const R = parseNum(roi);
    const provided = [D, G, Y, R].map(
      (v) => v !== null && !Number.isNaN(v)
    );
    const count = provided.filter(Boolean).length;

    let outD = D ?? null,
      outG = G ?? null,
      outY = Y ?? null,
      outR = R ?? null;

    if (count === 3) {
      const idx = provided.indexOf(false);
      if (idx === 0) outD = (G / (1 + R / 100)) / (12 * Y);
      else if (idx === 1) outG = D * 12 * Y * (1 + R / 100);
      else if (idx === 2) outY = (G / (1 + R / 100)) / (12 * D);
      else if (idx === 3) outR = ((G - D * 12 * Y) / (D * 12 * Y)) * 100;
    }

    const progress =
      G && parseNum(G) > 0
        ? Math.max(0, Math.min(100, (portfolioValue / parseNum(G)) * 100))
        : 0;
    return { outD, outG, outY, outR, progress };
  }, [dca, goal, years, roi, portfolioValue]);

  const onCalc = () => {
    const inputs = [dca, goal, years, roi].map(parseNum).filter(
      (n) => n !== null && !Number.isNaN(n)
    );
    if (inputs.length !== 3)
      return setError("Please enter exactly 3 values.");
    setError("");
  };

  return (
    <Grid container spacing={4} sx={{ mt: 2 }}>
      <Grid item xs={12} md={5}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Calculator
            </Typography>
            <Stack spacing={2}>
              <TextField label="DCA per month" value={dca} onChange={(e)=>setDca(e.target.value)} />
              <TextField label="Goal ($)" value={goal} onChange={(e)=>setGoal(e.target.value)} />
              <TextField label="Time (years)" value={years} onChange={(e)=>setYears(e.target.value)} />
              <TextField label="ROI (%)" value={roi} onChange={(e)=>setRoi(e.target.value)} />
              <Button variant="contained" sx={{ bgcolor: "orange" }} onClick={onCalc}>CALC</Button>
              {error && <Alert severity="warning">{error}</Alert>}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={7}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>Result</Typography>
            <Typography>Your DCA = <b>${fmtMoney(outD)}</b> / month</Typography>
            <Typography>Plan = <b>${fmtMoney(outG)}</b> in <b>{fmtYears(outY)}</b> years</Typography>
            <Typography>Needed ROI = <b>{fmtPct(outR)}</b></Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1">Portfolio Progress</Typography>
            <Typography color="text.secondary">
              ${fmtMoney(portfolioValue)} / ${fmtMoney(outG)}
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 5, mt: 1 }}/>
            <Typography align="right" sx={{ mt: 1 }}>{progress.toFixed(1)}%</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
