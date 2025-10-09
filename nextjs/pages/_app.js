// pages/_app.js
import "@/styles/globals.css";
import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { AppCacheProvider } from "@mui/material-nextjs/v13-pagesRouter";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Roboto } from "next/font/google";
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Container,
  Menu,
  MenuItem,
  ListItemIcon,
  Typography,
} from "@mui/material";

import CalculateIcon from "@mui/icons-material/Calculate";
import BarChartIcon from "@mui/icons-material/BarChart";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import ShowChartIcon from "@mui/icons-material/ShowChart";

import useBearStore from "@/store/useBearStore";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const theme = createTheme({
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
});

function Layout({ children, showHeader = true }) {
  const router = useRouter();
  const [acctEl, setAcctEl] = React.useState(null);
  const acctOpen = Boolean(acctEl);
  const username =
    typeof window !== "undefined" ? localStorage.getItem("username") : null;

  const openAccountMenu = (e) => setAcctEl(e.currentTarget);
  const closeAccountMenu = () => setAcctEl(null);

  const handleLogout = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        localStorage.removeItem("user_id");
        localStorage.removeItem("username");
        sessionStorage.clear();
      }
    } catch {}
    closeAccountMenu();
    router.push("/");
  };

  return (
    <Box sx={{ minHeight: "100vh" }}>
      {showHeader && (
        <AppBar position="static" color="transparent" elevation={1}>
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            {/* Left: Logo */}
            <Typography
              variant="h6"
              onClick={() => router.push("/dashboard")}
              sx={{
                cursor: "pointer",
                fontWeight: 700,
                color: "#f26a17",
              }}
            >
              MyFinanceApp
            </Typography>

            {/* Center: Navigation Buttons */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                startIcon={<CalculateIcon />}
                onClick={() => router.push("/calculator")}
              >
                Calculator
              </Button>
              <Button
                startIcon={<BarChartIcon />}
                onClick={() => router.push("/portfolio")}
              >
                Portfolio
              </Button>
              <Button
                startIcon={<CompareArrowsIcon />}
                onClick={() => router.push("/transaction")}
              >
                Transaction
              </Button>
              <Button
                startIcon={<DashboardIcon />}
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </Button>
              <Button
                startIcon={<ShowChartIcon />}
                onClick={() => router.push("/stocks")}
              >
                Stocks
              </Button>
            </Box>

            {/* Right: Account / Username */}
            <Box>
              <Button
                startIcon={<AccountCircleIcon />}
                onClick={openAccountMenu}
                aria-controls={acctOpen ? "account-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={acctOpen ? "true" : undefined}
              >
                {username ? `Hi, ${username}` : "Account"}
              </Button>

              <Menu
                id="account-menu"
                anchorEl={acctEl}
                open={acctOpen}
                onClose={closeAccountMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
      )}

      <Container sx={{ py: 3 }}>{children}</Container>
    </Box>
  );
}

export default function App({ Component, pageProps, props }) {
  const router = useRouter();
  const setAppName = useBearStore((state) => state.setAppName);

  React.useEffect(() => {
    setAppName("Say Hi");
  }, [router, setAppName]);

  const noHeaderPages = ["/", "/login", "/register"];
  const showHeader = !noHeaderPages.includes(router.pathname);

  return (
    <>
      <Head>
        <title>MyFinanceApp</title>
        <meta name="description" content="Finance tracker application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AppCacheProvider {...props}>
        <ThemeProvider theme={theme}>
          <Layout showHeader={showHeader}>
            <Component {...pageProps} />
          </Layout>
        </ThemeProvider>
      </AppCacheProvider>
    </>
  );
}
