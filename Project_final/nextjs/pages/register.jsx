// pages/register.js
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import Swal from "sweetalert2";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });

  const router = useRouter(); // ✅ add router

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // basic checks
    if (!form.username.trim() || !form.password.trim() || !form.email.trim()) {
      Swal.fire({
        title: "Error",
        text: "Username, email and password are required.",
        icon: "error",
      });
      return;
    }
    if (form.password !== form.confirm) {
      Swal.fire({
        title: "Error",
        text: "Passwords do not match.",
        icon: "error",
      });
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.detail || "Registration failed");

      Swal.fire({
        title: "Success!",
        text: "User registered successfully. Redirecting to login...",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        router.push("/login"); // ✅ redirect to login after success
      });

      setForm({ username: "", email: "", password: "", confirm: "" });
    } catch (err) {
        console.error("Register error:", err);   // ✅ log full error in browser console
        Swal.fire({ title: "Error", text: err.message, icon: "error" });
}

  };

  return (
    <Container
      maxWidth="md"
      sx={{ minHeight: "80vh", display: "flex", alignItems: "center" }}
    >
      <Box sx={{ width: { xs: "100%", sm: 520 }, mx: "auto" }}>
        <Typography variant="h6" sx={{ mb: 1.5, ml: 1 }}>
          Register
        </Typography>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 1.5 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.2}>
              <TextField
                label="Username*"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                size="small"
              />
              <TextField
                label="Email*"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                size="small"
              />
              <TextField
                label="Password*"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                size="small"
              />
              <TextField
                label="Confirm password*"
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={handleChange}
                required
                size="small"
              />

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  sx={{
                    bgcolor: "#f26a17",
                    px: 3,
                    fontWeight: 700,
                    "&:hover": { bgcolor: "#e05f12" },
                  }}
                >
                  REGISTER
                </Button>

                <Typography variant="body2">
                  Have an account?{" "}
                  <Typography
                    component={Link}
                    href="/login"
                    variant="body2"
                    sx={{ color: "primary.main", textDecoration: "none" }}
                  >
                    Login
                  </Typography>
                </Typography>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
