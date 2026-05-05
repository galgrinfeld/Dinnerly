import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { listRecipes, deleteRecipe, getRecipe } from "../api/recipes";
import { RecipeRead } from "../types/api";
import { RecipeCarouselCard } from "../components/RecipeCarouselCard";
import { EmptyStateBlock } from "../components/EmptyStateBlock";

export const MyRecipes: React.FC = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<RecipeRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<RecipeRead | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);

  // Fetch recipes on mount
  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = () => {
    setLoading(true);
    setError(null);
    listRecipes()
      .then((listData) => {
        // Fetch full details for each recipe to get imageUrl
        Promise.all(listData.map((item) => getRecipe(item.id)))
          .then((fullRecipes) => {
            setRecipes(fullRecipes);
            setError(null);
          })
          .catch((err) => {
            setError(err instanceof Error ? err.message : "Failed to load recipe details");
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

  const handleDeleteClick = (recipe: RecipeRead) => {
    setRecipeToDelete(recipe);
    setDeleteDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, recipeId: number) => {
    setMenuAnchor(event.currentTarget);
    setSelectedRecipeId(recipeId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedRecipeId(null);
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
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 3,
              }}
            >
              {filteredRecipes.map((recipe) => (
                <Box
                  key={recipe.id}
                  sx={{
                    position: "relative",
                    "&:hover .recipe-menu-button": {
                      opacity: 1,
                    },
                  }}
                >
                  <RecipeCarouselCard
                    recipe={recipe}
                    onViewDetails={(recipeId) => navigate(`/recipes/${recipeId}`)}
                  />
                  {/* Menu Button Overlay */}
                  <IconButton
                    className="recipe-menu-button"
                    size="small"
                    onClick={(e) => handleMenuOpen(e, recipe.id)}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      color: "#8A6A2F",
                      opacity: 0,
                      transition: "opacity 0.2s",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 1)",
                      },
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (selectedRecipeId) {
              navigate(`/recipes/${selectedRecipeId}/edit`);
              handleMenuClose();
            }
          }}
        >
          <EditIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            const recipeToDelete = recipes.find((r) => r.id === selectedRecipeId);
            if (recipeToDelete) {
              handleDeleteClick(recipeToDelete);
            }
          }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: "1.2rem", color: "error.main" }} />
          Delete
        </MenuItem>
      </Menu>

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
