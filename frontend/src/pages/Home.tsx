import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Button,
  Stack,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import EventIcon from "@mui/icons-material/Event";
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

const MAX_UPCOMING_EVENTS_PREVIEW = 3;

// Helper function to get date indicator (Today/Tomorrow or null)
const getDateIndicator = (eventDate: string): string | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const eventDateObj = new Date(eventDate);
  eventDateObj.setHours(0, 0, 0, 0);

  if (eventDateObj.getTime() === today.getTime()) {
    return "Today";
  } else if (eventDateObj.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }
  return null;
};

// Helper function to filter and sort upcoming events
const getUpcomingEvents = (events: EventRead[]): EventRead[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return events
    .filter((event) => {
      const eventDateObj = new Date(event.eventDate);
      eventDateObj.setHours(0, 0, 0, 0);
      return eventDateObj.getTime() >= today.getTime();
    })
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
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

  // Compute upcoming events with limit
  const upcomingEvents = useMemo(() => {
    return getUpcomingEvents(events).slice(0, MAX_UPCOMING_EVENTS_PREVIEW);
  }, [events]);

  return (
    <Box sx={{ backgroundColor: "background.default", minHeight: "100vh", py: 0 }}>
      {/* Dashboard Header */}
      <Box
        sx={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E3DDD4",
          py: { xs: 4, md: 5 },
          mb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
              gap: 3,
              alignItems: "end",
            }}
          >
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  color: "#241F1C",
                  fontSize: { xs: "1.8rem", md: "2.35rem" },
                }}
              >
                Dinnerly Dashboard
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#625852",
                  fontSize: { xs: "0.98rem", sm: "1.05rem" },
                  maxWidth: 620,
                  lineHeight: 1.6,
                }}
              >
                Plan shared meals, organize recipes, and keep event prep moving.
              </Typography>
            </Box>
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" } }}
            >
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate("/events/new")}
                sx={{ backgroundColor: "#241F1C", "&:hover": { backgroundColor: "#15110F" } }}
              >
                Create Event
              </Button>
              <Button
                variant="outlined"
                startIcon={<MenuBookIcon />}
                onClick={() => navigate("/addRecipe")}
                sx={{ borderColor: "#CFC5B7", color: "#241F1C" }}
              >
                Add Recipe
              </Button>
            </Stack>
          </Box>
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
                color: "#241F1C",
              }}
            >
              Recent Recipes
            </Typography>
            <IconButton
              onClick={() => navigate("/addRecipe")}
              sx={{
                backgroundColor: "#7A5E2B",
                color: "#FFFFFF",
                "&:hover": {
                  backgroundColor: "#654B20",
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
              icon={<MenuBookIcon sx={{ fontSize: "3rem", color: "#8A6A2F" }} />}
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
                      color: "#7A5E2B",
                      "&:disabled": {
                        opacity: 0.3,
                      },
                      "&:hover:not(:disabled)": {
                        backgroundColor: "rgba(122, 94, 43, 0.1)",
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
                      color: "#7A5E2B",
                      "&:disabled": {
                        opacity: 0.3,
                      },
                      "&:hover:not(:disabled)": {
                        backgroundColor: "rgba(122, 94, 43, 0.1)",
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
                    color: "#7A5E2B",
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
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
            <Typography
              variant="h5"
              component="h2"
              sx={{
                fontWeight: 700,
                color: "#241F1C",
              }}
            >
              Upcoming Events
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {events.length > MAX_UPCOMING_EVENTS_PREVIEW && (
                <Button
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate("/myEvents")}
                  sx={{
                    color: "#7A5E2B",
                    textTransform: "none",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    "&:hover": {
                        backgroundColor: "rgba(122, 94, 43, 0.1)",
                    },
                  }}
                >
                  View All
                </Button>
              )}
              <IconButton
                onClick={() => navigate("/events/new")}
                sx={{
                  backgroundColor: "#7A5E2B",
                  color: "#FFFFFF",
                  "&:hover": {
                    backgroundColor: "#654B20",
                  },
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Box>

          {eventError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {eventError}
            </Alert>
          )}

          {eventsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : upcomingEvents.length === 0 ? (
            <EmptyStateBlock
              icon={<EventIcon sx={{ fontSize: "3rem", color: "#8A6A2F" }} />}
              title="No upcoming events"
              message="Create an event to plan shared meals with friends. You can add recipes, manage participants, and generate shopping lists."
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "stretch",
                gap: 2,
              }}
            >
              {/* Left Spacer */}
              <Box
                sx={{
                  width: { xs: 0, md: 48 },
                  display: "flex",
                  alignItems: "center",
                }}
              />

              {/* Events Grid */}
              <Grid container spacing={2} sx={{ flex: 1 }}>
                {upcomingEvents.map((event) => {
                  const dateIndicator = getDateIndicator(event.eventDate);
                  return (
                    <Grid key={event.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <EventSummaryCard
                        event={event}
                        onViewEvent={(eventId) => navigate(`/events/${eventId}`)}
                        badge={dateIndicator || undefined}
                      />
                    </Grid>
                  );
                })}
              </Grid>

              {/* Right Spacer */}
              <Box
                sx={{
                  width: { xs: 0, md: 48 },
                  display: "flex",
                  alignItems: "center",
                }}
              />
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
