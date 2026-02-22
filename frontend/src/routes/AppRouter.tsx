import React from "react";
import { Routes, Route } from "react-router-dom";
import { Home } from "../pages/Home";
import { AddRecipe } from "../pages/AddRecipe";
import { CreateEvent } from "../pages/CreateEvent";
import { EventDetails } from "../pages/EventDetails";
import { RecipeDetails } from "../pages/RecipeDetails";
import { EditRecipe } from "../pages/EditRecipe";

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/addRecipe" element={<AddRecipe />} />
      <Route path="/events/new" element={<CreateEvent />} />
      <Route path="/events/:eventId" element={<EventDetails />} />
      <Route path="/recipes/:recipeId" element={<RecipeDetails />} />
      <Route path="/recipes/:recipeId/edit" element={<EditRecipe />} />
    </Routes>
  );
};

export default AppRouter;

