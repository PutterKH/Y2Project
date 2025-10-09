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

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const router = useRouter();  // ✅ add router

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || "Login failed");

      // ✅ Show success, then redirect
      Swal.fire({
        title: "Success!",
        text: result.message,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        router.push("/dashboard"); // redirect to dashboard page
      });

      setForm({ username: "", password: "" });
    } catch (err) {
      Swal.fire({ title: "Error!", text: err.message, icon: "error" });
    }
  };

  return (
    <Container
      maxWidth="md"
      sx={{ minHeight: "80vh", display: "flex", alignItems: "center" }}
    >
      <Box sx={{ width: { xs: "100%", sm: 520 }, mx: "auto" }}>
        <Typography variant="h6" sx={{ mb: 1.5, ml: 1 }}>
          Login
        </Typography>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 1.5 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.2}>
              <TextField
                label="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                size="small"
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                value={form.password}
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
                  LOGIN
                </Button>

                <Typography variant="body2">
                  New user?{" "}
                  <Typography
                    component={Link}
                    href="/register"
                    variant="body2"
                    sx={{ color: "primary.main", textDecoration: "none" }}
                  >
                    Register
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
