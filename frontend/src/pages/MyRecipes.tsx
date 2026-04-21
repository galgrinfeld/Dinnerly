import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { listRecipes, deleteRecipe } from "../api/recipes";
import { RecipeListItem } from "../types/api";
import { EmptyStateBlock } from "../components/EmptyStateBlock";

export const MyRecipes: React.FC = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<RecipeListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch recipes on mount
  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = () => {
    setLoading(true);
    setError(null);
    listRecipes()
      .then((data) => {
        setRecipes(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load recipes");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Filter recipes by search query
  const filteredRecipes = useMemo(() => {
    if (!searchQuery) return recipes;
    return recipes.filter((recipe) =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recipes, searchQuery]);

  const handleDeleteClick = (recipe: RecipeListItem) => {
    setRecipeToDelete(recipe);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recipeToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deleteRecipe(recipeToDelete.id);
      setRecipes(recipes.filter((r) => r.id !== recipeToDelete.id));
      setDeleteDialogOpen(false);
      setRecipeToDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete recipe"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRecipeToDelete(null);
    setDeleteError(null);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#2B2522" }}>
          My Recipes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/addRecipe")}
          sx={{
            backgroundColor: "#8A6A2F",
            color: "#fff",
            textTransform: "none",
            "&:hover": { backgroundColor: "#6F5623" },
          }}
        >
          Create Recipe
        </Button>
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {recipes.length === 0 ? (
        <EmptyStateBlock
          emoji="👨‍🍳"
          title="No recipes yet"
          message="Create your first recipe to start building your collection."
        />
      ) : (
        <>
          {/* Search Input */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search recipes by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderColor: "#B39760",
                },
              }}
            />
            {searchQuery && (
              <Typography variant="caption" sx={{ color: "#5C524E", mt: 1, display: "block" }}>
                Found {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? "s" : ""}
              </Typography>
            )}
          </Box>

          {/* Recipes Grid */}
          {filteredRecipes.length === 0 ? (
            <EmptyStateBlock
              emoji="🔍"
              title="No recipes found"
              message={`No recipes match "${searchQuery}". Try a different search term.`}
            />
          ) : (
            <Grid container spacing={3}>
              {filteredRecipes.map((recipe) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={recipe.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-8px)",
                        boxShadow: "0 16px 36px rgba(43, 37, 34, 0.15)",
                      },
                    }}
                  >
                    {/* Card Content */}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          fontWeight: 700,
                          color: "#2B2522",
                          mb: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          minHeight: "2.8em",
                        }}
                      >
                        {recipe.name}
                      </Typography>

                      {/* Description */}
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#5C524E",
                          mb: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          minHeight: "2.4em",
                        }}
                      >
                        {recipe.description || "No description provided"}
                      </Typography>

                      {/* Metadata */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          color: "#8A6A2F",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          pt: 1,
                          borderTop: "1px solid #E8DCC8",
                        }}
                      >
                        <span>🍽️ {recipe.baseServings} servings</span>
                      </Box>
                    </CardContent>

                    {/* Card Actions */}
                    <CardActions sx={{ pt: 0, justifyContent: "flex-end", gap: 1 }}>
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/recipes/${recipe.id}`)}
                          sx={{ color: "#8A6A2F" }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
                          sx={{ color: "#8A6A2F" }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(recipe)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle sx={{ fontWeight: 700, color: "#2B2522" }}>
          Delete Recipe?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#5C524E", mt: 1 }}>
            Are you sure you want to delete <strong>{recipeToDelete?.name}</strong>? This action
            cannot be undone.
          </Typography>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleDeleteCancel} sx={{ color: "#5C524E" }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            loading={deleteLoading}
            disabled={deleteLoading}
            variant="contained"
            color="error"
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
