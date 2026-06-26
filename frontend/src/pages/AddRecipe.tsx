import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RecipeFormLayout } from "./RecipeFormLayout";
import { createRecipe } from "../api/recipes";
import {
  RecipeFormState,
  IngredientRow,
  createEmptyIngredientRow,
} from "../types/recipe";
import { toRecipePayload, validateRecipeForm } from "../utils/recipeForm";

const INITIAL_STATE: RecipeFormState = {
  name: "",
  description: "",
  baseServings: 4,
  imageUrl: "",
  cookingTimeMinutes: null,
  isPublic: false,
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

  const handleSave = async () => {
    // Prevent duplicate submissions
    if (loading) {
      return;
    }

    setSubmitted(true);
    const validation = validateRecipeForm(formState);

    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    setLoading(true);
    setValidationError(null);

    const payload = toRecipePayload(formState);

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

  const handleCancel = () => {
    navigate("/");
  };

  const nameError = submitted && !formState.name.trim();

  return (
    <RecipeFormLayout
      title="Create New Recipe"
      subtitle="Share your favorite recipe with the Dinnerly community."
      submitLabel="Save Recipe"
      formState={formState}
      onFieldChange={handleFieldChange}
      onIngredientsChange={handleIngredientsChange}
      onSave={handleSave}
      onReset={handleReset}
      onCancel={handleCancel}
      isLoading={loading}
      validationError={validationError}
      successMessage={successMessage}
      nameError={nameError}
      submitted={submitted}
    />
  );
};

export default AddRecipe;

