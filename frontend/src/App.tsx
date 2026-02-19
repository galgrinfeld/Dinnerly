import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Stack,
} from "@mui/material";
import AppRouter from "./routes/AppRouter";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Fixed AppBar */}
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
          <Stack direction="row" spacing={3}>
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
            <Button
              onClick={() => navigate("/addRecipe")}
              sx={{
                color: location.pathname === "/addRecipe" ? "#8A6A2F" : "#171717",
                fontWeight: location.pathname === "/addRecipe" ? 700 : 500,
                textTransform: "none",
                fontSize: "1rem",
              }}
            >
              Add Recipe
            </Button>
            <Button
              onClick={() => navigate("/events/new")}
              sx={{
                color: location.pathname === "/events/new" ? "#8A6A2F" : "#171717",
                fontWeight: location.pathname === "/events/new" ? 700 : 500,
                textTransform: "none",
                fontSize: "1rem",
              }}
            >
              Create Event
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Spacer to account for fixed AppBar */}
      <Toolbar />

      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        <AppRouter />
      </Box>
    </Box>
  );
}

export default App;


