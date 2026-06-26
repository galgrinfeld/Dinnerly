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
  IconButton,
  Divider,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MenuIcon from "@mui/icons-material/Menu";
import { getAccessToken, clearAccessToken } from "./api/http";
import { me } from "./api/auth";
import { UserRead } from "./types/api";
import AppRouter from "./routes/AppRouter";
import { NotificationBell } from "./components/NotificationBell";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserRead | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [recipesAnchorEl, setRecipesAnchorEl] = useState<null | HTMLElement>(null);
  const [eventsAnchorEl, setEventsAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileAnchorEl, setMobileAnchorEl] = useState<null | HTMLElement>(null);
  const [tokenState, setTokenState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize token on mount and whenever location changes
  useEffect(() => {
    const token = getAccessToken();
    if (token !== tokenState) {
      setTokenState(token);
    }
    if (!isInitialized && token) {
      setIsInitialized(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Load user if token exists and not already loaded
    if (tokenState && !user) {
      me()
        .then((userData) => {
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

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileAnchorEl(null);
  };

  const handleLogout = () => {
    clearAccessToken();
    setUser(null);
    handleMenuClose();
    handleMobileMenuClose();
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
  const recipeActive = ["/myRecipes", "/addRecipe"].includes(location.pathname);
  const publicRecipesActive = location.pathname === "/recipe-pool"
    || location.pathname.startsWith("/recipe-pool/");
  const eventActive = ["/myEvents", "/events/new"].includes(location.pathname);

  const navigateAndCloseMobileMenu = (path: string) => {
    navigate(path);
    handleMobileMenuClose();
  };

  const navButtonSx = (active: boolean) => ({
    color: active ? "#7A5E2B" : "#332C28",
    fontWeight: active ? 760 : 620,
    textTransform: "none",
    fontSize: "0.95rem",
    px: 1.25,
    minWidth: "auto",
    "&:hover": { backgroundColor: "rgba(36, 31, 28, 0.05)" },
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Fixed AppBar - only if not on auth page */}
      {!isAuthPage && (
        <AppBar position="fixed">
          <Toolbar sx={{ gap: 2, px: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: 0,
                "&:hover": { opacity: 0.8 },
              }}
              onClick={() => navigate("/")}
            >
              Dinnerly
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ display: { xs: "none", md: "flex" } }}
            >
              <Button
                onClick={() => navigate("/")}
                sx={navButtonSx(location.pathname === "/")}
              >
                Home
              </Button>
              <Button
                onClick={() => navigate("/recipe-pool")}
                sx={navButtonSx(publicRecipesActive)}
              >
                Public Recipes
              </Button>

              {/* Recipes Dropdown */}
              <Button
                onClick={handleRecipesMenuOpen}
                sx={{
                  ...navButtonSx(recipeActive),
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
                  ...navButtonSx(eventActive),
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
                <>
                  <NotificationBell />
                  <Box>
                    <Button onClick={handleMenuOpen} sx={navButtonSx(false)}>
                      Hello, {user.displayName}
                    </Button>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                      <MenuItem disabled>{user.email}</MenuItem>
                      <MenuItem onClick={() => {
                        navigate("/friends");
                        handleMenuClose();
                      }}> My Friends</MenuItem>
                      <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </Menu>
                  </Box>
                </>
              )}
            </Stack>
            <IconButton
              onClick={handleMobileMenuOpen}
              sx={{ display: { xs: "inline-flex", md: "none" }, color: "#241F1C" }}
              aria-label="Open navigation"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileAnchorEl}
              open={Boolean(mobileAnchorEl)}
              onClose={handleMobileMenuClose}
              PaperProps={{ sx: { minWidth: 240 } }}
            >
              <MenuItem onClick={() => navigateAndCloseMobileMenu("/")}>Home</MenuItem>
              <MenuItem onClick={() => navigateAndCloseMobileMenu("/recipe-pool")}>Public Recipes</MenuItem>
              <Divider />
              <MenuItem onClick={() => navigateAndCloseMobileMenu("/myRecipes")}>My Recipes</MenuItem>
              <MenuItem onClick={() => navigateAndCloseMobileMenu("/addRecipe")}>Add Recipe</MenuItem>
              <Divider />
              <MenuItem onClick={() => navigateAndCloseMobileMenu("/myEvents")}>My Events</MenuItem>
              <MenuItem onClick={() => navigateAndCloseMobileMenu("/events/new")}>Create Event</MenuItem>
              {user && [
                <Divider key="user-divider" />,
                <MenuItem key="friends" onClick={() => navigateAndCloseMobileMenu("/friends")}>My Friends</MenuItem>,
                <MenuItem key="logout" onClick={handleLogout}>Logout</MenuItem>,
              ]}
            </Menu>
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


