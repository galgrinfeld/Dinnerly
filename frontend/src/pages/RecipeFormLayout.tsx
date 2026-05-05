import React, { useState } from "react";
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
import { IngredientsTable } from "../components/IngredientsTable";
import { RichTextEditor } from "../components/RichTextEditor";
import { PageHeader } from "../components/PageHeader";
import {
  RecipeFormState,
  IngredientRow,
} from "../types/recipe";

interface RecipeFormLayoutProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  formState: RecipeFormState;
  onFieldChange: (field: keyof RecipeFormState, value: any) => void;
  onIngredientsChange: (ingredients: IngredientRow[]) => void;
  onSave: () => void;
  onReset: () => void;
  onCancel: () => void;
  isLoading: boolean;
  validationError: string | null;
  successMessage: string | null;
  nameError: boolean;
  submitted: boolean;
}

/**
 * RecipeFormLayout - Shared polished form layout for both Create and Edit recipe pages
 * Provides consistent visual design and structure across both pages
 */
export const RecipeFormLayout: React.FC<RecipeFormLayoutProps> = ({
  title,
  subtitle,
  submitLabel,
  formState,
  onFieldChange,
  onIngredientsChange,
  onSave,
  onReset,
  onCancel,
  isLoading,
  validationError,
  successMessage,
  nameError,
}) => {
  const [imageLoadError, setImageLoadError] = useState(false);
  const hasValidUrl = formState.imageUrl?.trim();

  const handleImageLoad = () => {
    setImageLoadError(false);
  };

  const handleImageError = () => {
    setImageLoadError(true);
  };

  const handleImageChange = (value: string) => {
    onFieldChange("imageUrl", value.trim() || null);
    setImageLoadError(false);
  };

  // Helper component for image section with preview and URL input
  const ImageSection: React.FC = () => {
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
              onChange={(e) => handleImageChange(e.target.value)}
              placeholder="https://example.com/recipe.jpg"
              disabled={isLoading}
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
      <PageHeader
        title={title}
        subtitle={subtitle}
      />

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
                  onChange={(e) => onFieldChange("name", e.target.value)}
                  error={nameError}
                  helperText={nameError ? "Recipe name is required" : ""}
                  placeholder="e.g. Spaghetti Carbonara"
                  disabled={isLoading}
                />

                {/* Description */}
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  minRows={3}
                  value={formState.description}
                  onChange={(e) =>
                    onFieldChange("description", e.target.value)
                  }
                  placeholder="Optional description of your recipe"
                  disabled={isLoading}
                />

                {/* Base Servings and Cooking Time - Responsive Row */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  {/* Base Servings */}
                  <TextField
                    label="Base Servings"
                    type="number"
                    value={formState.baseServings}
                    onChange={(e) =>
                      onFieldChange(
                        "baseServings",
                        parseInt(e.target.value) || 1
                      )
                    }
                    inputProps={{ min: 1 }}
                    disabled={isLoading}
                  />

                  {/* Cooking Time */}
                  <TextField
                    label="Cooking Time (minutes)"
                    type="number"
                    value={formState.cookingTimeMinutes ?? ""}
                    onChange={(e) =>
                      onFieldChange(
                        "cookingTimeMinutes",
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    inputProps={{ min: 0 }}
                    disabled={isLoading}
                    placeholder="e.g. 30"
                  />
                </Box>
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
              onChange={onIngredientsChange}
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
                onFieldChange("instructions", nextHtml)
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
          onClick={onSave}
          disabled={isLoading}
          sx={{
            minWidth: "140px",
            backgroundColor: "#2B2522",
            "&:hover": {
              backgroundColor: "#1a1410",
            },
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            submitLabel
          )}
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={onReset}
          disabled={isLoading}
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
          onClick={onCancel}
          disabled={isLoading}
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

export default RecipeFormLayout;
