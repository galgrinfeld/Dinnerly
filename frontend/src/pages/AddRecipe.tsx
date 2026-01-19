import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Stack,
  Box,
  Typography,
  Alert,
} from "@mui/material";
import { IngredientsTable } from "../components/IngredientsTable";
import { RichTextEditor } from "../components/RichTextEditor";
import {
  RecipeFormState,
  IngredientRow,
  createEmptyIngredientRow,
} from "../types/recipe";

const INITIAL_STATE: RecipeFormState = {
  name: "",
  description: "",
  baseServings: 4,
  ingredients: [createEmptyIngredientRow()],
  instructions: "",
};

export const AddRecipe: React.FC = () => {
  const [formState, setFormState] = useState<RecipeFormState>(INITIAL_STATE);
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const handleSave = () => {
    setSubmitted(true);
    const validation = validateForm();

    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    const payload = {
      name: formState.name,
      description: formState.description,
      baseServings: formState.baseServings,
      instructionsHtml: formState.instructions,
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

    console.log("Recipe saved:", payload);
    setValidationError(null);
  };

  const handleReset = () => {
    setFormState(INITIAL_STATE);
    setSubmitted(false);
    setValidationError(null);
  };

  const nameError = submitted && !formState.name.trim();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: "bold" }}>
        Add Recipe
      </Typography>

      <Stack spacing={3}>
        {/* Recipe Name */}
        <TextField
          label="Recipe Name"
          fullWidth
          value={formState.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          error={nameError}
          helperText={nameError ? "Recipe name is required" : ""}
          placeholder="e.g. Spaghetti Carbonara"
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
        />

        {/* Base Servings */}
        <TextField
          label="Base Servings"
          type="number"
          value={formState.baseServings}
          onChange={(e) => handleFieldChange("baseServings", parseInt(e.target.value) || 1)}
          inputProps={{ min: 1 }}
          sx={{ maxWidth: 200 }}
        />

        {/* Ingredients Section */}
        <Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Ingredients
          </Typography>
          {validationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationError}
            </Alert>
          )}
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
          >
            Save
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={handleReset}
          >
            Reset
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
};

export default AddRecipe;
