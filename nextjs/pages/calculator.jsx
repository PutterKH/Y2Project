// pages/calculator.js
import React, { useMemo, useState } from "react";
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
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
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

  const { outD, outG, outY, outR, progress } = useMemo(() => {
    const D = parseNum(dca);
    const G = parseNum(goal);
    const Y = parseNum(years);
    const R = parseNum(roi);

    const provided = [
      D !== null && !Number.isNaN(D),
      G !== null && !Number.isNaN(G),
      Y !== null && !Number.isNaN(Y),
      R !== null && !Number.isNaN(R),
    ];
    const count = provided.filter(Boolean).length;

    let outD = D ?? null;
    let outG = G ?? null;
    let outY = Y ?? null;
    let outR = R ?? null;

    if (count === 3) {
      const missingIdx = provided.indexOf(false);
      if (missingIdx === 0) {
        const Mtarget = G / (1 + (R / 100));
        outD = Mtarget / (12 * Y);
      } else if (missingIdx === 1) {
        const Mcalc = D * 12 * Y;
        outG = Mcalc * (1 + (R / 100));
      } else if (missingIdx === 2) {
        const Mtarget = G / (1 + (R / 100));
        outY = Mtarget / (12 * D);
      } else if (missingIdx === 3) {
        const Mcalc = D * 12 * Y;
        outR = ((G - Mcalc) / Mcalc) * 100;
      }
    }

    const progress =
      outG && outG > 0 && D && Y
        ? Math.max(0, Math.min(100, ((D * 12 * Y) / outG) * 100))
        : 0;

    return { outD, outG, outY, outR, progress };
  }, [dca, goal, years, roi]);

  const onCalc = () => {
    const D = parseNum(dca);
    const G = parseNum(goal);
    const Y = parseNum(years);
    const R = parseNum(roi);
    const provided = [D, G, Y, R].filter(
      (n) => n !== null && !Number.isNaN(n)
    ).length;

    if (provided !== 3) {
      setError("Please enter exactly 3 values; I'll calculate the missing one.");
      return;
    }
    setError("");
  };

  return (
    <Grid container spacing={4} sx={{ mt: 2 }}>
      {/* CALCULATOR */}
      <Grid item xs={12} md={5}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Calculator
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="DCA per month"
                value={dca}
                onChange={(e) => setDca(e.target.value)}
                placeholder="e.g., 500"
              />
              <TextField
                label="Goal ($)"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., 20000"
              />
              <TextField
                label="Time (years)"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                placeholder="e.g., 5"
              />
              <TextField
                label="ROI (%)"
                value={roi}
                onChange={(e) => setRoi(e.target.value)}
                placeholder="e.g., 8"
              />

              <Button variant="contained" sx={{ bgcolor: "orange" }} onClick={onCalc}>
                CALC
              </Button>

              {error && <Alert severity="warning">{error}</Alert>}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* RESULT */}
      <Grid item xs={12} md={7}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Result
            </Typography>

            <Typography sx={{ mb: 0.5 }}>
              Your DCA = <b>${fmtMoney(outD)}</b> / month
            </Typography>
            <Typography sx={{ mb: 0.5 }}>
              Plan = <b>${fmtMoney(outG)}</b> in <b>{fmtYears(outY)}</b> years
            </Typography>
            <Typography sx={{ mb: 2 }}>
              Percentage you need to achieve = <b>{fmtPct(outR)}</b>
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Tracker */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1">Tracker to Goal</Typography>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 5, mt: 1 }}
              />
              <Typography align="right" sx={{ mt: 1 }}>
                {progress.toFixed(1)}%
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
