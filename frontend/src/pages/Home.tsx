import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { listRecipes } from "../api/recipes";
import { listEvents } from "../api/events";
import { RecipeListItem, EventRead } from "../types/api";

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [events, setEvents] = useState<EventRead[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch recipes
    listRecipes()
      .then((data) => {
        setRecipes(data);
        setRecipeError(null);
      })
      .catch((err) => {
        setRecipeError(err instanceof Error ? err.message : "Failed to load recipes");
      })
      .finally(() => setRecipesLoading(false));

    // Fetch events
    listEvents()
      .then((data) => {
        setEvents(data);
        setEventError(null);
      })
      .catch((err) => {
        setEventError(err instanceof Error ? err.message : "Failed to load events");
      })
      .finally(() => setEventsLoading(false));
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" sx={{ mb: 4, fontWeight: "bold" }}>
        Dinnerly Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Recipes Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Recipes
              </Typography>

              {recipeError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {recipeError}
                </Alert>
              )}

              {recipesLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : recipes.length === 0 ? (
                <Typography color="textSecondary" sx={{ py: 2 }}>
                  No recipes yet. Create one to get started!
                </Typography>
              ) : (
                <List sx={{ maxHeight: 300, overflow: "auto" }}>
                  {recipes.map((recipe) => (
                    <ListItem key={recipe.id}>
                      <ListItemText
                        primary={recipe.name}
                        secondary={`Serves: ${recipe.baseServings}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                onClick={() => navigate("/addRecipe")}
              >
                Add Recipe
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Events Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Events
              </Typography>

              {eventError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {eventError}
                </Alert>
              )}

              {eventsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : events.length === 0 ? (
                <Typography color="textSecondary" sx={{ py: 2 }}>
                  No events yet. Create one to get started!
                </Typography>
              ) : (
                <List sx={{ maxHeight: 300, overflow: "auto" }}>
                  {events.map((event) => (
                    <ListItem key={event.id}>
                      <ListItemText
                        primary={event.name}
                        secondary={`Target: ${event.targetServings} servings`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                onClick={() => navigate("/events/new")}
              >
                Create Event
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;
