import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Stack,
  Box,
  Typography,
  Alert,
  Paper,
  Link,
} from "@mui/material";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import { login } from "../api/auth";
import { LoginRequest } from "../types/api";

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, email: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, password: e.target.value });
  };

  const handleLogin = async () => {
    setError(null);

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      const payload: LoginRequest = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      await login(payload);

      // Navigate to home on success
      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to login";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default", display: "flex", alignItems: "center" }}>
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Box sx={{ width: "100%" }}>
          <Box sx={{ mb: 3, textAlign: "center" }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                mx: "auto",
                mb: 1.5,
                borderRadius: 1,
                backgroundColor: "#241F1C",
                color: "#FFFFFF",
                display: "grid",
                placeItems: "center",
              }}
            >
              <RestaurantMenuIcon />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#241F1C" }}>
              Dinnerly
            </Typography>
            <Typography variant="body2" sx={{ color: "#625852", mt: 0.5 }}>
              Sign in to manage recipes and shared events.
            </Typography>
          </Box>

          <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, borderColor: "#E3DDD4" }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 760, color: "#241F1C" }}>
              Sign In
            </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2.5}>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleEmailChange}
              onKeyPress={handleKeyPress}
              fullWidth
              disabled={loading}
              variant="outlined"
            />

            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={handlePasswordChange}
              onKeyPress={handleKeyPress}
              fullWidth
              disabled={loading}
              variant="outlined"
            />

            <Button
              variant="contained"
              onClick={handleLogin}
              disabled={loading}
              fullWidth
              size="large"
              sx={{
                backgroundColor: "#241F1C",
                "&:hover": { backgroundColor: "#15110F" },
                "&:disabled": { backgroundColor: "#bbb" },
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Don't have an account?{" "}
                <Link
                  component="button"
                  variant="body2"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/register");
                  }}
                  sx={{ cursor: "pointer" }}
                >
                  Create one
                </Link>
              </Typography>
            </Box>
          </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};
