import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, CircularProgress, Container, Stack, Alert, Button } from "@mui/material";
import { RecipeFormLayout } from "./RecipeFormLayout";
import { getRecipe, updateRecipe } from "../api/recipes";
import {
  RecipeFormState,
  IngredientRow,
  IngredientUnit,
  createEmptyIngredientRow,
} from "../types/recipe";
import { toRecipePayload, validateRecipeForm } from "../utils/recipeForm";

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
    cookingTimeMinutes: null,
  });

  const [originalFormState, setOriginalFormState] = useState<RecipeFormState | null>(null);
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

        const formData: RecipeFormState = {
          name: recipe.name,
          description: recipe.description || "",
          baseServings: recipe.baseServings,
          ingredients: ingredients.length > 0 ? ingredients : [createEmptyIngredientRow()],
          instructions: recipe.instructionsHtml || "",
          imageUrl: recipe.imageUrl || "",
          cookingTimeMinutes: recipe.cookingTimeMinutes ?? null,
        };

        setFormState(formData);
        setOriginalFormState(formData);
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

  const handleSave = async () => {
    if (saving || !recipeId) {
      return;
    }

    setSubmitted(true);
    const validation = validateRecipeForm(formState);

    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    setSaving(true);
    setValidationError(null);

    const payload = toRecipePayload(formState);

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

  const handleReset = () => {
    // Reset back to original loaded recipe values (not empty)
    if (originalFormState) {
      setFormState(originalFormState);
    }
    setSubmitted(false);
    setValidationError(null);
    setSuccessMessage(null);
  };

  const handleCancel = () => {
    navigate(`/recipes/${recipeId}`);
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
    <RecipeFormLayout
      title="Edit Recipe"
      subtitle="Update your recipe details, ingredients, image, and instructions."
      submitLabel="Save Changes"
      formState={formState}
      onFieldChange={handleFieldChange}
      onIngredientsChange={handleIngredientsChange}
      onSave={handleSave}
      onReset={handleReset}
      onCancel={handleCancel}
      isLoading={saving}
      validationError={validationError}
      successMessage={successMessage}
      nameError={nameError}
      submitted={submitted}
    />
  );
};

export default EditRecipe;
