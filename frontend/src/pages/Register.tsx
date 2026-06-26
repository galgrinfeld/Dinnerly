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
import { register } from "../api/auth";
import { RegisterRequest } from "../types/api";

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, email: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, password: e.target.value });
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, displayName: e.target.value });
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      setValidationError("Email is required");
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      setValidationError("Password must be at least 8 characters");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleRegister = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const payload: RegisterRequest = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        displayName: formData.displayName.trim() || undefined,
      };

      await register(payload);

      // Navigate to home on success
      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to register";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRegister();
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
              Create your workspace for recipes and dinner events.
            </Typography>
          </Box>

          <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, borderColor: "#E3DDD4" }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 760, color: "#241F1C" }}>
              Create Account
            </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {validationError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {validationError}
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
              error={!!validationError && !formData.email.trim()}
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
              error={!!validationError && formData.password.length < 8}
              helperText={formData.password.length > 0 && formData.password.length < 8 ? "Minimum 8 characters" : ""}
            />

            <TextField
              label="Display Name (optional)"
              value={formData.displayName}
              onChange={handleDisplayNameChange}
              onKeyPress={handleKeyPress}
              fullWidth
              disabled={loading}
              variant="outlined"
            />

            <Button
              variant="contained"
              onClick={handleRegister}
              disabled={loading}
              fullWidth
              size="large"
              sx={{
                backgroundColor: "#241F1C",
                "&:hover": { backgroundColor: "#15110F" },
                "&:disabled": { backgroundColor: "#bbb" },
              }}
            >
              {loading ? "Creating account..." : "Register"}
            </Button>

            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Already have an account?{" "}
                <Link
                  component="button"
                  variant="body2"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/login");
                  }}
                  sx={{ cursor: "pointer" }}
                >
                  Sign in
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
