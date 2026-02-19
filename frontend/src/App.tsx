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
          <Stack direction="row" spacing={2}>
            <Button
              color="inherit"
              onClick={() => navigate("/")}
              sx={{
                fontWeight: location.pathname === "/" ? "bold" : "normal",
              }}
            >
              Home
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate("/addRecipe")}
              sx={{
                fontWeight: location.pathname === "/addRecipe" ? "bold" : "normal",
              }}
            >
              Add Recipe
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate("/events/new")}
              sx={{
                fontWeight: location.pathname === "/events/new" ? "bold" : "normal",
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


