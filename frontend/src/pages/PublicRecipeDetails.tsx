import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { getPublicRecipe, getSimilarPublicRecipes, savePublicRecipe } from "../api/publicRecipes";
import { RecipeCarouselCard } from "../components/RecipeCarouselCard";
import { PageHeader } from "../components/PageHeader";
import { RecipeRead, SimilarRecipeItem } from "../types/api";
import { formatCookingTime } from "../utils/formatters";

export const PublicRecipeDetails: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<RecipeRead | null>(null);
  const [similarRecipes, setSimilarRecipes] = useState<SimilarRecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedRecipeId, setSavedRecipeId] = useState<number | null>(null);

  useEffect(() => {
    const loadRecipe = async () => {
      if (!recipeId) return;
      const numericRecipeId = parseInt(recipeId, 10);
      try {
        setLoading(true);
        setError(null);
        setSaveError(null);
        setSavedRecipeId(null);
        const [recipeData, similarData] = await Promise.all([
          getPublicRecipe(numericRecipeId),
          getSimilarPublicRecipes(numericRecipeId, 4),
        ]);
        setRecipe(recipeData);
        setSimilarRecipes(similarData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load public recipe");
      } finally {
        setLoading(false);
      }
    };
    loadRecipe();
  }, [recipeId]);

  const handleSave = async () => {
    if (!recipe || saving) return;
    try {
      setSaving(true);
      setSaveError(null);
      const saved = await savePublicRecipe(recipe.id);
      setSavedRecipeId(saved.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save recipe");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !recipe) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={2}>
          <Alert severity="error">{error || "Public recipe not found"}</Alert>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/recipe-pool")}>
            Back to Public Recipes
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/recipe-pool")}
          sx={{ color: "#5C524E", borderColor: "#E8E4DF", alignSelf: "flex-start" }}
        >
          Back to Public Recipes
        </Button>

        <PageHeader
          title={recipe.name}
          subtitle="Public recipe pool"
          primaryAction={{
            label: saving ? "Saving..." : "Save to My Recipes",
            icon: saving ? <CircularProgress size={16} color="inherit" /> : <BookmarkAddIcon />,
            onClick: handleSave,
          }}
        />

        {saveError && <Alert severity="error">{saveError}</Alert>}
        {savedRecipeId && (
          <Alert
            severity="success"
            action={
              <Button color="inherit" size="small" onClick={() => navigate(`/recipes/${savedRecipeId}`)}>
                View
              </Button>
            }
          >
            Saved a private copy to My Recipes.
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
            gap: 3,
          }}
        >
          <Card sx={{ border: "1px solid #E8E4DF", boxShadow: "0 4px 12px rgba(43, 37, 34, 0.06)" }}>
            <Box sx={{ p: 3 }}>
              {recipe.description && (
                <Typography sx={{ color: "#5C524E", lineHeight: 1.6, mb: 2.5 }}>
                  {recipe.description}
                </Typography>
              )}
              <Divider sx={{ my: 2.5, borderColor: "#E8E4DF" }} />
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Chip icon={<RestaurantIcon />} label={`${recipe.baseServings} servings`} />
                {recipe.cookingTimeMinutes && (
                  <Chip icon={<AccessTimeIcon />} label={formatCookingTime(recipe.cookingTimeMinutes)} />
                )}
              </Stack>
            </Box>
          </Card>

          <Card sx={{ overflow: "hidden", border: "1px solid #E8E4DF", boxShadow: "0 4px 12px rgba(43, 37, 34, 0.06)" }}>
            {recipe.imageUrl ? (
              <Box
                component="img"
                src={recipe.imageUrl}
                alt={recipe.name}
                sx={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }}
              />
            ) : (
              <Box
                sx={{
                  aspectRatio: "4 / 3",
                  backgroundColor: "#EEE8DE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#7A5E2B",
                  fontWeight: 700,
                }}
              >
                No Image
              </Box>
            )}
          </Card>
        </Box>

        <Card sx={{ border: "1px solid #E8E4DF", boxShadow: "0 4px 12px rgba(43, 37, 34, 0.06)" }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Ingredients ({recipe.ingredients.length})
            </Typography>
            <Stack spacing={1}>
              {recipe.ingredients.map((ingredient) => {
                const hasNote = ingredient.note && ingredient.note.trim().length > 0;
                const isToTaste = ingredient.quantity === null || ingredient.unit === "to_taste";

                return (
                  <Box
                    key={ingredient.id}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                      py: 1,
                      borderBottom: "1px solid #F0ECE7",
                    }}
                  >
                    <Box
                      sx={{
                        minWidth: 72,
                        display: "flex",
                        gap: 0.75,
                        alignItems: "baseline",
                        flexShrink: 0,
                      }}
                    >
                      {isToTaste ? (
                        <Typography sx={{ color: "#625852", fontStyle: "italic", fontSize: "0.9rem" }}>
                          to taste
                        </Typography>
                      ) : (
                        <>
                          <Typography sx={{ color: "#241F1C", fontWeight: 650 }}>
                            {ingredient.quantity}
                          </Typography>
                          {ingredient.unit !== "unit" && (
                            <Typography sx={{ color: "#7A5E2B", fontSize: "0.85rem", fontWeight: 600 }}>
                              {ingredient.unit}
                            </Typography>
                          )}
                        </>
                      )}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 650, color: "#241F1C" }}>
                        {ingredient.ingredientName}
                      </Typography>
                      {hasNote && (
                        <Typography sx={{ color: "#8A7660", fontSize: "0.8rem", fontStyle: "italic", mt: 0.5 }}>
                          {ingredient.note}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Card>

        {recipe.instructionsHtml && recipe.instructionsHtml.trim() && (
          <Card sx={{ border: "1px solid #E8E4DF", boxShadow: "0 4px 12px rgba(43, 37, 34, 0.06)" }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Instructions
              </Typography>
              <Box
                sx={{ color: "#3A332F", lineHeight: 1.7, "& p": { mb: 1.25 } }}
                dangerouslySetInnerHTML={{ __html: recipe.instructionsHtml }}
              />
            </Box>
          </Card>
        )}

        {similarRecipes.length > 0 && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#241F1C", mb: 2 }}>
              Similar Recipes
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                gap: 2,
              }}
            >
              {similarRecipes.map((similar) => (
                <RecipeCarouselCard
                  key={similar.id}
                  recipe={similar}
                  onViewDetails={(id) => navigate(`/recipe-pool/${id}`)}
                />
              ))}
            </Box>
          </Box>
        )}
      </Stack>
    </Container>
  );
};

export default PublicRecipeDetails;
