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
  Select,
  FormControl,
  InputLabel,
  Chip,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { PageHeader } from "../components/PageHeader";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ClearIcon from "@mui/icons-material/Clear";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SearchIcon from "@mui/icons-material/Search";
import { listRecipes, deleteRecipe, getRecipe } from "../api/recipes";
import { RecipeRead } from "../types/api";
import { RecipeCarouselCard } from "../components/RecipeCarouselCard";
import { EmptyStateBlock } from "../components/EmptyStateBlock";

// Types for sorting and filtering
type SortOption = "newest" | "oldest" | "name-asc" | "name-desc" | "servings-low" | "servings-high";
type ServingsFilter = "all" | "1-2" | "3-4" | "5+";

// Helper function to sort recipes
const sortRecipes = (recipes: RecipeRead[], sortOption: SortOption): RecipeRead[] => {
  const sorted = [...recipes];
  
  switch (sortOption) {
    case "newest":
      return sorted.reverse();
    case "oldest":
      return sorted;
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "servings-low":
      return sorted.sort((a, b) => a.baseServings - b.baseServings);
    case "servings-high":
      return sorted.sort((a, b) => b.baseServings - a.baseServings);
    default:
      return sorted;
  }
};

// Helper function to filter by servings
const filterByServings = (recipes: RecipeRead[], servingsFilter: ServingsFilter): RecipeRead[] => {
  if (servingsFilter === "all") return recipes;
  
  return recipes.filter((recipe) => {
    const servings = recipe.baseServings;
    switch (servingsFilter) {
      case "1-2":
        return servings >= 1 && servings <= 2;
      case "3-4":
        return servings >= 3 && servings <= 4;
      case "5+":
        return servings >= 5;
      default:
        return true;
    }
  });
};

export const MyRecipes: React.FC = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<RecipeRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [servingsFilter, setServingsFilter] = useState<ServingsFilter>("all");
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

  // Filter recipes by search query, sort, and servings
  const filteredRecipes = useMemo(() => {
    let result = recipes;
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter((recipe) =>
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply servings filter
    result = filterByServings(result, servingsFilter);
    
    // Apply sorting
    result = sortRecipes(result, sortOption);
    
    return result;
  }, [recipes, searchQuery, sortOption, servingsFilter]);

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

  // Helper function to check if any filters are active
  const hasActiveFilters = searchQuery || servingsFilter !== "all" || sortOption !== "newest";

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setSortOption("newest");
    setServingsFilter("all");
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
      <PageHeader
        title="My Recipes"
        subtitle="Browse and manage your recipe collection."
        primaryAction={{
          label: "Create Recipe",
          icon: <AddIcon />,
          onClick: () => navigate("/addRecipe"),
        }}
      />

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {recipes.length === 0 ? (
        <EmptyStateBlock
          icon={<MenuBookIcon sx={{ fontSize: "3rem", color: "#8A6A2F" }} />}
          title="No recipes yet"
          message="Create your first recipe to start building your collection."
        />
      ) : (
        <>
          {/* Controls Toolbar */}
          <Box
            component={Paper}
            variant="outlined"
            sx={{
              mb: 3,
              p: 2,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              alignItems: { sm: "flex-end" },
              borderColor: "#E3DDD4",
              boxShadow: "none",
            }}
          >
            {/* Search Input */}
            <TextField
              placeholder="Search recipes by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                flex: 1,
                minWidth: { xs: "100%", sm: 200 },
              }}
            />

            {/* Sort Dropdown */}
            <FormControl
              size="small"
              sx={{
                minWidth: { xs: "100%", sm: 160 },
              }}
            >
              <InputLabel id="sort-label" sx={{ color: "#5C524E" }}>
                Sort by
              </InputLabel>
              <Select
                labelId="sort-label"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                label="Sort by"
              >
                <MenuItem value="newest">Newest first</MenuItem>
                <MenuItem value="oldest">Oldest first</MenuItem>
                <MenuItem value="name-asc">Name A-Z</MenuItem>
                <MenuItem value="name-desc">Name Z-A</MenuItem>
                <MenuItem value="servings-low">Servings low to high</MenuItem>
                <MenuItem value="servings-high">Servings high to low</MenuItem>
              </Select>
            </FormControl>

            {/* Servings Filter Dropdown */}
            <FormControl
              size="small"
              sx={{
                minWidth: { xs: "100%", sm: 160 },
              }}
            >
              <InputLabel id="servings-label" sx={{ color: "#5C524E" }}>
                Servings
              </InputLabel>
              <Select
                labelId="servings-label"
                value={servingsFilter}
                onChange={(e) => setServingsFilter(e.target.value as ServingsFilter)}
                label="Servings"
              >
                <MenuItem value="all">All servings</MenuItem>
                <MenuItem value="1-2">1-2 servings</MenuItem>
                <MenuItem value="3-4">3-4 servings</MenuItem>
                <MenuItem value="5+">5+ servings</MenuItem>
              </Select>
            </FormControl>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                size="small"
                onClick={clearAllFilters}
                startIcon={<ClearIcon />}
                sx={{
                  color: "#7A5E2B",
                  textTransform: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Clear
              </Button>
            )}
          </Box>

          {/* Results Count */}
          {(searchQuery || servingsFilter !== "all") && (
            <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {searchQuery && (
                <Chip
                  label={`Search: "${searchQuery}"`}
                  size="small"
                  onDelete={() => setSearchQuery("")}
                  sx={{ backgroundColor: "#EFE8DD", color: "#625852" }}
                />
              )}
              {servingsFilter !== "all" && (
                <Chip
                  label={`Servings: ${
                    servingsFilter === "1-2"
                      ? "1-2"
                      : servingsFilter === "3-4"
                      ? "3-4"
                      : "5+"
                  }`}
                  size="small"
                  onDelete={() => setServingsFilter("all")}
                  sx={{ backgroundColor: "#EFE8DD", color: "#625852" }}
                />
              )}
            </Box>
          )}

          {/* Recipes Grid */}
          {filteredRecipes.length === 0 ? (
            <EmptyStateBlock
              icon={<SearchIcon sx={{ fontSize: "3rem", color: "#8A6A2F" }} />}
              title="No recipes found"
              message={
                searchQuery
                  ? `No recipes match "${searchQuery}". Try a different search term.`
                  : servingsFilter !== "all"
                  ? `No recipes found with ${
                      servingsFilter === "1-2"
                        ? "1-2"
                        : servingsFilter === "3-4"
                        ? "3-4"
                        : "5+"
                    } servings.`
                  : "No recipes match your filters."
              }
            />
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
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
                      backgroundColor: "rgba(255, 255, 255, 0.92)",
                      color: "#7A5E2B",
                      opacity: { xs: 1, md: 0 },
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
