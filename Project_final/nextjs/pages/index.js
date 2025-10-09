// pages/index.js
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Container, Grid, Box, Typography, Button } from "@mui/material";

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
      {/* "Welcome" line */}
      <Typography
        variant="h5"
        sx={{ fontWeight: 600, mb: { xs: 4, md: 8 } }}
      >
        Welcome To Investment Tracker
      </Typography>

      <Grid container spacing={4} alignItems="center">
        {/* Left: piggy bank image */}
        <Grid item xs={12} md={5}>
          <Box sx={{ position: "relative", width: "100%", minHeight: 320 }}>
            {/* Use your own asset path if needed */}
            <Image
              src="/images/piggy.png"                // <- put your piggy image here
              alt="Piggy bank"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </Box>
        </Grid>

        {/* Right: text + login */}
        <Grid item xs={12} md={7}>
          <Typography
            sx={{
              fontWeight: 800,
              lineHeight: 1.1,
              fontSize: { xs: "2.2rem", sm: "3rem", md: "4.2rem" },
            }}
          >
            Manage and track your
            <br />
            portfolio wisely!!
          </Typography>

          <Typography
            sx={{
              mt: 2,
              fontSize: { xs: "1.1rem", md: "1.4rem" },
              textAlign: { xs: "left", md: "center" },
            }}
          >
            One stop service!
          </Typography>

          <Box sx={{ mt: 6, textAlign: { xs: "left", md: "center" } }}>
            <Typography
              sx={{ mb: 2, fontSize: { xs: "1.6rem", md: "2.2rem" } }}
            >
              Login to start
            </Typography>

            <Button
              component={Link}
              href="/login"
              variant="contained"
              sx={{
                bgcolor: "#f26a17",
                "&:hover": { bgcolor: "#e05f12" },
                px: 3,
                borderRadius: 1,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Login
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
