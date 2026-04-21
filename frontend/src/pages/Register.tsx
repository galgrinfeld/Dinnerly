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
    <Container maxWidth="sm" sx={{ py: 8, display: "flex", alignItems: "center", minHeight: "100vh" }}>
      <Box sx={{ width: "100%" }}>
        <Paper variant="outlined" sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold", textAlign: "center" }}>
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
                backgroundColor: "#8A6A2F",
                "&:hover": { backgroundColor: "#6F5624" },
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
                  Login here
                </Link>
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};
