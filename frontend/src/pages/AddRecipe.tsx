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
  CircularProgress,
  Card,
  Divider,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { IngredientsTable } from "../components/IngredientsTable";
import { RichTextEditor } from "../components/RichTextEditor";
import { createRecipe } from "../api/recipes";
import {
  RecipeFormState,
  IngredientRow,
  createEmptyIngredientRow,
} from "../types/recipe";

const INITIAL_STATE: RecipeFormState = {
  name: "",
  description: "",
  baseServings: 4,
  imageUrl: "",
  ingredients: [createEmptyIngredientRow()],
  instructions: "",
};

export const AddRecipe: React.FC = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<RecipeFormState>(INITIAL_STATE);
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFieldChange = (field: keyof RecipeFormState, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setValidationError(null);
  };

  const handleIngredientsChange = (ingredients: IngredientRow[]) => {
    setFormState((prev) => ({ ...prev, ingredients }));
    setValidationError(null);
  };

  const validateForm = (): { valid: boolean; error: string | null } => {
    if (!formState.name.trim()) {
      return { valid: false, error: "Recipe name is required" };
    }

    const ingredientsWithNames = formState.ingredients.filter((ing) =>
      ing.name.trim()
    );
    if (ingredientsWithNames.length === 0) {
      return { valid: false, error: "At least one ingredient with a name is required" };
    }

    for (const ing of ingredientsWithNames) {
      if (ing.unit !== "to_taste") {
        const qty = parseFloat(ing.quantity);
        if (!ing.quantity || isNaN(qty) || qty <= 0) {
          return {
            valid: false,
            error: `Ingredient "${ing.name}" requires a positive quantity (unit: ${ing.unit})`,
          };
        }
      }
    }

    return { valid: true, error: null };
  };

  const handleSave = async () => {
    // Prevent duplicate submissions
    if (loading) {
      return;
    }

    setSubmitted(true);
    const validation = validateForm();

    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    setLoading(true);
    setValidationError(null);

    const payload = {
      name: formState.name,
      description: formState.description,
      baseServings: formState.baseServings,
      instructionsHtml: formState.instructions,
      imageUrl: formState.imageUrl?.trim() || null,
      ingredients: formState.ingredients
        .filter((ing) => ing.name.trim())
        .map((ing) => ({
          name: ing.name,
          quantity: ing.unit === "to_taste" ? null : parseFloat(ing.quantity),
          unit: ing.unit,
          note: ing.note,
          optional: ing.optional,
        })),
    };

    try {
      const result = await createRecipe(payload);
      setSuccessMessage(`✓ Recipe added: ${result.name}`);
      // Redirect to home immediately
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error) {
      setLoading(false);
      const errorMsg = error instanceof Error ? error.message : "Failed to create recipe";
      console.error("Recipe creation error:", errorMsg);
      setValidationError(errorMsg);
    }
  };

  const handleReset = () => {
    setFormState(INITIAL_STATE);
    setSubmitted(false);
    setValidationError(null);
    setSuccessMessage(null);
  };

  const nameError = submitted && !formState.name.trim();

  // Helper component for image section with preview and URL input
  const ImageSection: React.FC = () => {
    const [imageLoadError, setImageLoadError] = useState(false);
    const hasValidUrl = formState.imageUrl?.trim();
    
    const handleImageLoad = () => {
      setImageLoadError(false);
    };

    const handleImageError = () => {
      setImageLoadError(true);
    };

    return (
      <Card
        sx={{
          height: "fit-content",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #E8E4DF",
          boxShadow: "0 4px 12px rgba(43, 37, 34, 0.06)",
        }}
      >
        {/* Hidden img element for error detection */}
        {hasValidUrl && (
          <img
            src={formState.imageUrl || ""}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: "none" }}
            alt="preview"
          />
        )}

        {/* Header */}
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#171717",
              fontSize: "1.05rem",
            }}
          >
            Recipe Image
          </Typography>
        </Box>

        {/* Image Preview */}
        {hasValidUrl && !imageLoadError ? (
          <Box
            sx={{
              width: "100%",
              height: "220px",
              backgroundColor: "#f5f5f5",
              backgroundImage: `url(${formState.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderBottom: "1px solid #E8E4DF",
            }}
          />
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "220px",
              backgroundColor: "#f9f7f4",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderBottom: "1px solid #E8E4DF",
            }}
          >
            <Typography
              sx={{
                fontSize: "2.8rem",
                opacity: 0.2,
                mb: 1,
              }}
            >
              🍳
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#8A6A2F",
                textAlign: "center",
                px: 2,
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              {imageLoadError ? "Image failed to load" : "Add image URL below"}
            </Typography>
          </Box>
        )}

        {/* Image URL Input Section */}
        <Box sx={{ p: 2.5 }}>
          <Stack spacing={1.5}>
            <TextField
              label="Image URL"
              fullWidth
              value={formState.imageUrl || ""}
              onChange={(e) => {
                handleFieldChange("imageUrl", e.target.value.trim() || null);
                setImageLoadError(false);
              }}
              placeholder="https://example.com/recipe.jpg"
              disabled={loading}
              size="small"
              helperText={
                imageLoadError
                  ? "Could not load image. Check the URL and try again."
                  : "PNG, JPG, or WebP. Max 5MB recommended."
              }
              error={imageLoadError}
            />
          </Stack>
        </Box>
      </Card>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            color: "#171717",
          }}
        >
          Create New Recipe
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "#5C524E",
            fontSize: "0.95rem",
          }}
        >
          Share your favorite recipe with the Dinnerly community
        </Typography>
      </Stack>

      {/* Alerts */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        {successMessage && (
          <Alert severity="success" sx={{ borderRadius: "12px" }}>
            {successMessage}
          </Alert>
        )}

        {validationError && (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {validationError}
          </Alert>
        )}
      </Stack>

      {/* Main Content Layout */}
      <Stack spacing={3}>
        {/* Top Section: Recipe Details + Image Preview */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
            gap: 3,
          }}
        >
          {/* Recipe Details Card */}
          <Card
            sx={{
              border: "1px solid #E8E4DF",
              boxShadow: "0 4px 12px rgba(43, 37, 34, 0.06)",
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 2.5,
                  color: "#171717",
                  fontSize: "1.05rem",
                }}
              >
                Recipe Details
              </Typography>
              <Divider sx={{ mb: 2.5, borderColor: "#E8E4DF" }} />

              <Stack spacing={2.5}>
                {/* Recipe Name */}
                <TextField
                  label="Recipe Name"
                  fullWidth
                  value={formState.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  error={nameError}
                  helperText={nameError ? "Recipe name is required" : ""}
                  placeholder="e.g. Spaghetti Carbonara"
                  disabled={loading}
                />

                {/* Description */}
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  minRows={3}
                  value={formState.description}
                  onChange={(e) =>
                    handleFieldChange("description", e.target.value)
                  }
                  placeholder="Optional description of your recipe"
                  disabled={loading}
                />

                {/* Base Servings */}
                <TextField
                  label="Base Servings"
                  type="number"
                  value={formState.baseServings}
                  onChange={(e) =>
                    handleFieldChange(
                      "baseServings",
                      parseInt(e.target.value) || 1
                    )
                  }
                  inputProps={{ min: 1 }}
                  disabled={loading}
                />
              </Stack>
            </Box>
          </Card>

          {/* Image Preview Card */}
          <ImageSection />
        </Box>

        {/* Ingredients Card - Full Width */}
        <Card
          sx={{
            border: "1px solid #E8E4DF",
            boxShadow: "0 4px 12px rgba(43, 37, 34, 0.06)",
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2.5,
                color: "#171717",
                fontSize: "1.05rem",
              }}
            >
              Ingredients
            </Typography>
            <Divider sx={{ mb: 2.5, borderColor: "#E8E4DF" }} />
            <IngredientsTable
              ingredients={formState.ingredients}
              onChange={handleIngredientsChange}
            />
          </Box>
        </Card>

        {/* Instructions Card - Full Width */}
        <Card
          sx={{
            border: "1px solid #E8E4DF",
            boxShadow: "0 4px 12px rgba(43, 37, 34, 0.06)",
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2.5,
                color: "#171717",
                fontSize: "1.05rem",
              }}
            >
              Instructions
            </Typography>
            <Divider sx={{ mb: 2.5, borderColor: "#E8E4DF" }} />
            <RichTextEditor
              value={formState.instructions}
              onChange={(nextHtml) =>
                handleFieldChange("instructions", nextHtml)
              }
              placeholder="Step-by-step cooking instructions"
            />
          </Box>
        </Card>
      </Stack>

      {/* Action Bar - Bottom */}
      <Box
        sx={{
          mt: 4,
          pt: 3,
          borderTop: "1px solid #E8E4DF",
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={loading}
          sx={{
            minWidth: "140px",
            backgroundColor: "#2B2522",
            "&:hover": {
              backgroundColor: "#1a1410",
            },
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Save Recipe"
          )}
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={handleReset}
          disabled={loading}
          sx={{
            minWidth: "120px",
            borderColor: "#B39760",
            color: "#2B2522",
            "&:hover": {
              backgroundColor: "rgba(138, 106, 47, 0.05)",
            },
          }}
        >
          Reset
        </Button>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="text"
          onClick={() => navigate("/")}
          disabled={loading}
          sx={{
            color: "#8A6A2F",
            "&:hover": {
              backgroundColor: "rgba(138, 106, 47, 0.08)",
            },
          }}
        >
          Back to Home
        </Button>
      </Box>
    </Container>
  );
};

export default AddRecipe;

