import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  Box,
} from "@mui/material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { RecipeRead } from "../types/api";
import { formatCookingTime } from "../utils/formatters";

interface RecipeCarouselCardProps {
  recipe: RecipeRead;
  onViewDetails: (recipeId: number) => void;
}

export const RecipeCarouselCard: React.FC<RecipeCarouselCardProps> = ({
  recipe,
  onViewDetails,
}) => {
  return (
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
        cursor: "pointer",
      }}
    >
      {/* Recipe Image or Placeholder */}
      {recipe.imageUrl ? (
        <CardMedia
          component="img"
          height="220"
          image={recipe.imageUrl}
          alt={recipe.name}
          sx={{ objectFit: "cover" }}
        />
      ) : (
        <Box
          sx={{
            height: 220,
            backgroundColor: "#E8DCC8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8A6A2F",
            fontWeight: 600,
            fontSize: "0.875rem",
            textAlign: "center",
            px: 2,
          }}
        >
          No Image
        </Box>
      )}

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

        <Typography
          variant="body2"
          sx={{
            color: "#5C524E",
            mb: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            minHeight: "1.2em",
          }}
        >
          {recipe.description || "No description provided"}
        </Typography>

        {/* Metadata Row */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 2,
            pt: 1,
            borderTop: "1px solid #E8DCC8",
            color: "#8A6A2F",
            fontSize: "0.875rem",
            fontWeight: 600,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <RestaurantIcon sx={{ fontSize: "1rem" }} />
            <span>{recipe.baseServings} servings</span>
          </Box>
          {recipe.cookingTimeMinutes && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: "1rem" }} />
              <span>{formatCookingTime(recipe.cookingTimeMinutes)}</span>
            </Box>
          )}
        </Box>
      </CardContent>

      {/* Card Actions */}
      <CardActions sx={{ pt: 0 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={() => onViewDetails(recipe.id)}
          sx={{
            backgroundColor: "#8A6A2F",
            "&:hover": {
              backgroundColor: "#7A5D29",
            },
          }}
        >
          View Recipe
        </Button>
      </CardActions>
    </Card>
  );
};
