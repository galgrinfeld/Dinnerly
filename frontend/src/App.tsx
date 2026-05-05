import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Stack,
  Menu,
  MenuItem,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { getAccessToken, clearAccessToken } from "./api/http";
import { me } from "./api/auth";
import { UserRead } from "./types/api";
import AppRouter from "./routes/AppRouter";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserRead | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [recipesAnchorEl, setRecipesAnchorEl] = useState<null | HTMLElement>(null);
  const [eventsAnchorEl, setEventsAnchorEl] = useState<null | HTMLElement>(null);
  const [tokenState, setTokenState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize token on mount and whenever location changes
  useEffect(() => {
    const token = getAccessToken();
    console.log("Location changed, checking token:", { token, tokenState });
    if (token !== tokenState) {
      console.log("Token changed, updating state");
      setTokenState(token);
    }
    if (!isInitialized && token) {
      setIsInitialized(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Load user if token exists and not already loaded
    if (tokenState && !user) {
      console.log("Loading user with token:", tokenState);
      me()
        .then((userData) => {
          console.log("User loaded successfully:", userData);
          setUser(userData);
          setIsInitialized(true);
        })
        .catch((err) => {
          console.error("Failed to load user:", err);
          // Token invalid, clear it
          clearAccessToken();
          setTokenState(null);
          setUser(null);
          navigate("/login");
        });
    }
  }, [tokenState, user, navigate]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRecipesMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setRecipesAnchorEl(event.currentTarget);
  };

  const handleRecipesMenuClose = () => {
    setRecipesAnchorEl(null);
  };

  const handleEventsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setEventsAnchorEl(event.currentTarget);
  };

  const handleEventsMenuClose = () => {
    setEventsAnchorEl(null);
  };

  const handleLogout = () => {
    clearAccessToken();
    setUser(null);
    handleMenuClose();
    navigate("/login");
  };

  const navigateAndCloseRecipesMenu = (path: string) => {
    navigate(path);
    handleRecipesMenuClose();
  };

  const navigateAndCloseEventsMenu = (path: string) => {
    navigate(path);
    handleEventsMenuClose();
  };

  // Don't show AppBar on auth pages
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Fixed AppBar - only if not on auth page */}
      {!isAuthPage && (
        <AppBar position="fixed">
          <Toolbar>
            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                fontWeight: "bold",
                cursor: "pointer",
                "&:hover": { opacity: 0.8 },
              }}
              onClick={() => navigate("/")}
            >
              Dinnerly
            </Typography>
            <Stack direction="row" spacing={3} alignItems="center">
              <Button
                onClick={() => navigate("/")}
                sx={{
                  color: location.pathname === "/" ? "#8A6A2F" : "#171717",
                  fontWeight: location.pathname === "/" ? 700 : 500,
                  textTransform: "none",
                  fontSize: "1rem",
                }}
              >
                Home
              </Button>

              {/* Recipes Dropdown */}
              <Button
                onClick={handleRecipesMenuOpen}
                sx={{
                  color: ["/myRecipes", "/addRecipe"].includes(location.pathname)
                    ? "#8A6A2F"
                    : "#171717",
                  fontWeight: ["/myRecipes", "/addRecipe"].includes(location.pathname)
                    ? 700
                    : 500,
                  textTransform: "none",
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                Recipes
                <KeyboardArrowDownIcon
                  sx={{
                    fontSize: "1.2rem",
                    transition: "transform 0.2s ease",
                    transform: Boolean(recipesAnchorEl) ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </Button>
              <Menu
                anchorEl={recipesAnchorEl}
                open={Boolean(recipesAnchorEl)}
                onClose={handleRecipesMenuClose}
              >
                <MenuItem onClick={() => navigateAndCloseRecipesMenu("/myRecipes")}>
                  My Recipes
                </MenuItem>
                <MenuItem onClick={() => navigateAndCloseRecipesMenu("/addRecipe")}>
                  Add Recipe
                </MenuItem>
              </Menu>

              {/* Events Dropdown */}
              <Button
                onClick={handleEventsMenuOpen}
                sx={{
                  color: ["/myEvents", "/events/new"].includes(location.pathname)
                    ? "#8A6A2F"
                    : "#171717",
                  fontWeight: ["/myEvents", "/events/new"].includes(location.pathname)
                    ? 700
                    : 500,
                  textTransform: "none",
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                Events
                <KeyboardArrowDownIcon
                  sx={{
                    fontSize: "1.2rem",
                    transition: "transform 0.2s ease",
                    transform: Boolean(eventsAnchorEl) ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </Button>
              <Menu
                anchorEl={eventsAnchorEl}
                open={Boolean(eventsAnchorEl)}
                onClose={handleEventsMenuClose}
              >
                <MenuItem onClick={() => navigateAndCloseEventsMenu("/myEvents")}>
                  My Events
                </MenuItem>
                <MenuItem onClick={() => navigateAndCloseEventsMenu("/events/new")}>
                  Create Event
                </MenuItem>
              </Menu>

              {/* User menu */}
              {user && (
                <Box>
                  <Button onClick={handleMenuOpen} sx={{ color: "#171717", textTransform: "none" }}>
                    {user.email}
                  </Button>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <MenuItem disabled>{user.displayName || user.email}</MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </Menu>
                </Box>
              )}
            </Stack>
          </Toolbar>
        </AppBar>
      )}

      {/* Spacer to account for fixed AppBar */}
      {!isAuthPage && <Toolbar />}

      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        <AppRouter />
      </Box>
    </Box>
  );
}

export default App;


