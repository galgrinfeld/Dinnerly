import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import { listRecipes, getRecipe } from "../api/recipes";
import { listEvents } from "../api/events";
import { RecipeRead, EventRead } from "../types/api";
import { RecipeCarouselCard } from "../components/RecipeCarouselCard";
import { EventSummaryCard } from "../components/EventSummaryCard";
import { EmptyStateBlock } from "../components/EmptyStateBlock";

const ITEMS_PER_VIEW = {
  desktop: 3,
  tablet: 2,
  mobile: 1,
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<RecipeRead[]>([]);
  const [events, setEvents] = useState<EventRead[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    // Fetch recipes
    listRecipes()
      .then((listData) => {
        // Fetch full details for each recipe to get imageUrl
        Promise.all(listData.map((item) => getRecipe(item.id)))
          .then((fullRecipes) => {
            setRecipes(fullRecipes);
            setRecipeError(null);
          })
          .catch((err) => {
            setRecipeError(err instanceof Error ? err.message : "Failed to load recipe details");
            // Fall back to list data if detail fetch fails
            setRecipes(
              listData.map((item) => ({
                ...item,
                description: item.description || "",
                instructionsHtml: "",
                ingredients: [],
              }))
            );
          });
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

  // Carousel navigation handlers
  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextCarousel = () => {
    const maxIndex = Math.max(0, recipes.length - ITEMS_PER_VIEW.desktop);
    setCarouselIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const visibleRecipes = recipes.slice(
    carouselIndex,
    carouselIndex + ITEMS_PER_VIEW.desktop
  );

  return (
    <Box sx={{ backgroundColor: "#FAFAF8", minHeight: "100vh", py: 0 }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #2B2522 0%, #3D3530 100%)",
          color: "#FFFFFF",
          py: 8,
          mb: 4,
          textAlign: "center",
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: "1.75rem", sm: "2.5rem", md: "3rem" },
            }}
          >
            Dinnerly Dashboard
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 300,
              opacity: 0.95,
              fontSize: { xs: "0.95rem", sm: "1.1rem" },
              maxWidth: 600,
              mx: "auto",
            }}
          >
            Plan shared meals, organize recipes, and keep your events in sync.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 6 }}>
        {/* Recent Recipes Section */}
        <Box sx={{ mb: 8 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
            <Typography
              variant="h5"
              component="h2"
              sx={{
                fontWeight: 700,
                color: "#2B2522",
              }}
            >
              Recent Recipes
            </Typography>
            <IconButton
              onClick={() => navigate("/addRecipe")}
              sx={{
                backgroundColor: "#8A6A2F",
                color: "#FFFFFF",
                "&:hover": {
                  backgroundColor: "#7A5D29",
                },
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>

          {recipeError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {recipeError}
            </Alert>
          )}

          {recipesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : recipes.length === 0 ? (
            <EmptyStateBlock
              emoji="📖"
              title="No recipes yet"
              message="Start by creating your first recipe. You'll be able to organize, share, and use them across your events."
            />
          ) : (
            <Box>
              {/* Carousel Container */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: 2,
                  position: "relative",
                }}
              >
                {/* Left Navigation */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <IconButton
                    onClick={handlePrevCarousel}
                    disabled={carouselIndex === 0}
                    sx={{
                      color: "#8A6A2F",
                      "&:disabled": {
                        opacity: 0.3,
                      },
                      "&:hover:not(:disabled)": {
                        backgroundColor: "rgba(138, 106, 47, 0.1)",
                      },
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                </Box>

                {/* Recipe Cards Grid */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                    },
                    gap: 2,
                    flex: 1,
                  }}
                >
                  {visibleRecipes.map((recipe) => (
                    <RecipeCarouselCard
                      key={recipe.id}
                      recipe={recipe}
                      onViewDetails={(recipeId) => navigate(`/recipes/${recipeId}`)}
                    />
                  ))}
                </Box>

                {/* Right Navigation */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <IconButton
                    onClick={handleNextCarousel}
                    disabled={carouselIndex >= recipes.length - ITEMS_PER_VIEW.desktop}
                    sx={{
                      color: "#8A6A2F",
                      "&:disabled": {
                        opacity: 0.3,
                      },
                      "&:hover:not(:disabled)": {
                        backgroundColor: "rgba(138, 106, 47, 0.1)",
                      },
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Carousel Indicator */}
              {recipes.length > ITEMS_PER_VIEW.desktop && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 1,
                    mt: 3,
                    color: "#8A6A2F",
                    fontSize: "0.875rem",
                  }}
                >
                  <span>
                    {carouselIndex + 1} - {Math.min(carouselIndex + ITEMS_PER_VIEW.desktop, recipes.length)}
                  </span>
                  <span>of {recipes.length}</span>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Events Section */}
        <Box>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 700,
              color: "#2B2522",
              mb: 3,
            }}
          >
            Events
          </Typography>

          {eventError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {eventError}
            </Alert>
          )}

          {eventsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : events.length === 0 ? (
            <EmptyStateBlock
              emoji="🎉"
              title="No events yet"
              message="Create an event to bring together recipes and share them with friends. You can add recipes, manage participants, and generate shopping lists."
            />
          ) : (
            <Grid container spacing={3}>
              {events.map((event) => (
                <Grid key={event.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <EventSummaryCard
                    event={event}
                    onViewEvent={(eventId) => navigate(`/events/${eventId}`)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
