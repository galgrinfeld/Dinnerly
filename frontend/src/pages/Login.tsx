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
    <Container maxWidth="sm" sx={{ py: 8, display: "flex", alignItems: "center", minHeight: "100vh" }}>
      <Box sx={{ width: "100%" }}>
        <Paper variant="outlined" sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold", textAlign: "center" }}>
            Login
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
                backgroundColor: "#8A6A2F",
                "&:hover": { backgroundColor: "#6F5624" },
                "&:disabled": { backgroundColor: "#bbb" },
              }}
            >
              {loading ? "Logging in..." : "Login"}
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
                  Register here
                </Link>
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};
