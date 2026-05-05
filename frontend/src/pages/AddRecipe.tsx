import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RecipeFormLayout } from "./RecipeFormLayout";
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
  cookingTimeMinutes: null,
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
      cookingTimeMinutes: formState.cookingTimeMinutes ?? null,
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

