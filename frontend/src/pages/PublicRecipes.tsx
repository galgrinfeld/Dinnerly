import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { listPublicRecipes } from "../api/publicRecipes";
import { RecipeCarouselCard } from "../components/RecipeCarouselCard";
import { PageHeader } from "../components/PageHeader";
import { RecipeListItem } from "../types/api";

type CookingTimeFilter = "all" | "under-20" | "under-30" | "under-45" | "60-plus";
type ServingsFilter = "all" | "1-2" | "3-4" | "5-6" | "7-plus";
type SortOption = "name-asc" | "fastest" | "servings-low" | "servings-high";

export const PublicRecipes: React.FC = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cookingTimeFilter, setCookingTimeFilter] = useState<CookingTimeFilter>("all");
  const [servingsFilter, setServingsFilter] = useState<ServingsFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");

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
    return recipes
      .filter((recipe) => {
        if (!query) return true;
        return `${recipe.name} ${recipe.description || ""}`.toLowerCase().includes(query);
      })
      .filter((recipe) => {
        const minutes = recipe.cookingTimeMinutes;
        if (cookingTimeFilter === "all") return true;
        if (minutes == null) return false;
        if (cookingTimeFilter === "under-20") return minutes <= 20;
        if (cookingTimeFilter === "under-30") return minutes <= 30;
        if (cookingTimeFilter === "under-45") return minutes <= 45;
        return minutes >= 60;
      })
      .filter((recipe) => {
        const servings = recipe.baseServings;
        if (servingsFilter === "all") return true;
        if (servingsFilter === "1-2") return servings >= 1 && servings <= 2;
        if (servingsFilter === "3-4") return servings >= 3 && servings <= 4;
        if (servingsFilter === "5-6") return servings >= 5 && servings <= 6;
        return servings >= 7;
      })
      .sort((a, b) => {
        if (sortOption === "fastest") {
          return (a.cookingTimeMinutes ?? Number.MAX_SAFE_INTEGER) - (b.cookingTimeMinutes ?? Number.MAX_SAFE_INTEGER);
        }
        if (sortOption === "servings-low") {
          return a.baseServings - b.baseServings || a.name.localeCompare(b.name);
        }
        if (sortOption === "servings-high") {
          return b.baseServings - a.baseServings || a.name.localeCompare(b.name);
        }
        return a.name.localeCompare(b.name);
      });
  }, [recipes, searchQuery, cookingTimeFilter, servingsFilter, sortOption]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    cookingTimeFilter !== "all" ||
    servingsFilter !== "all" ||
    sortOption !== "name-asc";

  const clearFilters = () => {
    setSearchQuery("");
    setCookingTimeFilter("all");
    setServingsFilter("all");
    setSortOption("name-asc");
  };

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

        <Box
          component={Paper}
          variant="outlined"
          sx={{
            p: 2,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            alignItems: { md: "flex-end" },
            borderColor: "#E3DDD4",
            boxShadow: "none",
          }}
        >
          <TextField
            label="Search public recipes"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by title or description"
            size="small"
            sx={{ flex: 1, minWidth: { xs: "100%", md: 240 } }}
          />

          <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 170 } }}>
            <InputLabel id="public-time-filter-label" sx={{ color: "#5C524E" }}>
              Time
            </InputLabel>
            <Select
              labelId="public-time-filter-label"
              value={cookingTimeFilter}
              label="Time"
              onChange={(event) => setCookingTimeFilter(event.target.value as CookingTimeFilter)}
            >
              <MenuItem value="all">Any time</MenuItem>
              <MenuItem value="under-20">20 min or less</MenuItem>
              <MenuItem value="under-30">30 min or less</MenuItem>
              <MenuItem value="under-45">45 min or less</MenuItem>
              <MenuItem value="60-plus">60 min or more</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 160 } }}>
            <InputLabel id="public-servings-filter-label" sx={{ color: "#5C524E" }}>
              Servings
            </InputLabel>
            <Select
              labelId="public-servings-filter-label"
              value={servingsFilter}
              label="Servings"
              onChange={(event) => setServingsFilter(event.target.value as ServingsFilter)}
            >
              <MenuItem value="all">All servings</MenuItem>
              <MenuItem value="1-2">1-2 servings</MenuItem>
              <MenuItem value="3-4">3-4 servings</MenuItem>
              <MenuItem value="5-6">5-6 servings</MenuItem>
              <MenuItem value="7-plus">7+ servings</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 170 } }}>
            <InputLabel id="public-sort-label" sx={{ color: "#5C524E" }}>
              Sort by
            </InputLabel>
            <Select
              labelId="public-sort-label"
              value={sortOption}
              label="Sort by"
              onChange={(event) => setSortOption(event.target.value as SortOption)}
            >
              <MenuItem value="name-asc">Name A-Z</MenuItem>
              <MenuItem value="fastest">Fastest first</MenuItem>
              <MenuItem value="servings-low">Servings low to high</MenuItem>
              <MenuItem value="servings-high">Servings high to low</MenuItem>
            </Select>
          </FormControl>

          {hasActiveFilters && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              sx={{ color: "#7A5E2B", textTransform: "none", whiteSpace: "nowrap" }}
            >
              Clear
            </Button>
          )}
        </Box>

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
