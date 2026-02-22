import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Stack,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { IngredientsTable } from "../components/IngredientsTable";
import { RichTextEditor } from "../components/RichTextEditor";
import { getRecipe, updateRecipe } from "../api/recipes";
import {
  RecipeFormState,
  IngredientRow,
  IngredientUnit,
  createEmptyIngredientRow,
} from "../types/recipe";

export const EditRecipe: React.FC = () => {
  const navigate = useNavigate();
  const { recipeId } = useParams<{ recipeId: string }>();

  const [formState, setFormState] = useState<RecipeFormState>({
    name: "",
    description: "",
    baseServings: 4,
    ingredients: [createEmptyIngredientRow()],
    instructions: "",
    imageUrl: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load recipe data on mount
  useEffect(() => {
    const loadRecipe = async () => {
      if (!recipeId) return;
      try {
        setLoading(true);
        setLoadError(null);
        const recipe = await getRecipe(parseInt(recipeId, 10));
        
        // Convert RecipeRead to RecipeFormState
        const ingredients: IngredientRow[] = (recipe.ingredients || []).map((ing, idx) => ({
          id: idx.toString(),
          name: ing.ingredientName || "",
          quantity: ing.quantity?.toString() || "",
          unit: ing.unit as IngredientUnit,
          note: ing.note || "",
          optional: ing.optional || false,
        }));

        setFormState({
          name: recipe.name,
          description: recipe.description || "",
          baseServings: recipe.baseServings,
          ingredients: ingredients.length > 0 ? ingredients : [createEmptyIngredientRow()],
          instructions: recipe.instructionsHtml || "",
          imageUrl: recipe.imageUrl || "",
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load recipe";
        setLoadError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadRecipe();
  }, [recipeId]);

  const handleFieldChange = (field: keyof RecipeFormState, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setValidationError(null);
  };

  const handleIngredientsChange = (ingredients: IngredientRow[]) => {
    setFormState((prev) => ({ ...prev, ingredients }));
    setValidationError(null);
  };

  const validateForm = (): { valid: boolean; error: string | null } => {
    if (!formState.name || !formState.name.trim()) {
      return { valid: false, error: "Recipe name is required" };
    }

    const ingredientsWithNames = formState.ingredients.filter((ing) =>
      ing && ing.name && ing.name.trim()
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
    if (saving || !recipeId) {
      return;
    }

    setSubmitted(true);
    const validation = validateForm();

    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    setSaving(true);
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
      const result = await updateRecipe(parseInt(recipeId, 10), payload);
      setSuccessMessage(`✓ Recipe updated: ${result.name}`);
      // Redirect to recipe details
      setTimeout(() => {
        navigate(`/recipes/${recipeId}`);
      }, 500);
    } catch (error) {
      setSaving(false);
      const errorMsg = error instanceof Error ? error.message : "Failed to update recipe";
      console.error("Recipe update error:", errorMsg);
      setValidationError(errorMsg);
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

  if (loadError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={2}>
          <Alert severity="error">{loadError}</Alert>
          <Button variant="outlined" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </Stack>
      </Container>
    );
  }

  const nameError = submitted && !formState.name.trim();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: "bold" }}>
        Edit Recipe
      </Typography>

      <Stack spacing={3}>
        {/* Success Alert */}
        {successMessage && (
          <Alert severity="success">
            {successMessage}
          </Alert>
        )}

        {/* Error Alert */}
        {validationError && (
          <Alert severity="error">
            {validationError}
          </Alert>
        )}

        {/* Recipe Name */}
        <TextField
          label="Recipe Name"
          fullWidth
          value={formState.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          error={nameError}
          helperText={nameError ? "Recipe name is required" : ""}
          placeholder="e.g. Spaghetti Carbonara"
          disabled={saving}
        />

        {/* Description */}
        <TextField
          label="Description"
          fullWidth
          multiline
          minRows={2}
          value={formState.description}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          placeholder="Optional description of your recipe"
          disabled={saving}
        />

        {/* Image URL */}
        <TextField
          label="Image URL (optional)"
          fullWidth
          value={formState.imageUrl || ""}
          onChange={(e) =>
            handleFieldChange("imageUrl", e.target.value.trim() || null)
          }
          placeholder="https://example.com/image.jpg"
          disabled={saving}
        />

        {/* Base Servings */}
        <TextField
          label="Base Servings"
          type="number"
          value={formState.baseServings}
          onChange={(e) => handleFieldChange("baseServings", parseInt(e.target.value) || 1)}
          inputProps={{ min: 1 }}
          sx={{ maxWidth: 200 }}
          disabled={saving}
        />

        {/* Ingredients Section */}
        <Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Ingredients
          </Typography>
          <IngredientsTable
            ingredients={formState.ingredients}
            onChange={handleIngredientsChange}
          />
        </Box>

        {/* Instructions */}
        <Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Instructions
          </Typography>
          <RichTextEditor
            value={formState.instructions}
            onChange={(nextHtml) => handleFieldChange("instructions", nextHtml)}
            placeholder="Step-by-step cooking instructions"
          />
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={saving}
            sx={{ position: "relative" }}
          >
            {saving ? <CircularProgress size={24} /> : "Save Changes"}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate(`/recipes/${recipeId}`)}
            disabled={saving}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
};

export default EditRecipe;
