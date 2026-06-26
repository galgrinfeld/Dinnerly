import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { listPublicRecipes } from "../api/publicRecipes";
import { RecipeCarouselCard } from "../components/RecipeCarouselCard";
import { PageHeader } from "../components/PageHeader";
import { RecipeListItem } from "../types/api";

export const PublicRecipes: React.FC = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    listPublicRecipes()
      .then((data) => {
        setRecipes(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load public recipes");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredRecipes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return recipes;
    return recipes.filter((recipe) =>
      `${recipe.name} ${recipe.description || ""}`.toLowerCase().includes(query)
    );
  }, [recipes, searchQuery]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <PageHeader
          title="Public Recipes"
          subtitle="Browse community recipes and save private copies to your collection."
          primaryAction={{
            label: "Add Recipe",
            icon: <AddIcon />,
            onClick: () => navigate("/addRecipe"),
          }}
        />

        <TextField
          label="Search public recipes"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by title or description"
          fullWidth
          sx={{ maxWidth: 520 }}
        />

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredRecipes.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Typography variant="h6" sx={{ color: "#241F1C", fontWeight: 700 }}>
              No public recipes found
            </Typography>
            <Typography sx={{ color: "#625852", mt: 1 }}>
              Share a recipe publicly or try a different search.
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 3, backgroundColor: "#241F1C" }}
              onClick={() => navigate("/addRecipe")}
            >
              Create Recipe
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            {filteredRecipes.map((recipe) => (
              <RecipeCarouselCard
                key={recipe.id}
                recipe={recipe}
                onViewDetails={(recipeId) => navigate(`/recipe-pool/${recipeId}`)}
              />
            ))}
          </Box>
        )}
      </Stack>
    </Container>
  );
};

export default PublicRecipes;
