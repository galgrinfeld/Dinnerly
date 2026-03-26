import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getAccessToken } from "../api/http";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Home } from "../pages/Home";
import { AddRecipe } from "../pages/AddRecipe";
import { CreateEvent } from "../pages/CreateEvent";
import { EventDetails } from "../pages/EventDetails";
import { RecipeDetails } from "../pages/RecipeDetails";
import { EditRecipe } from "../pages/EditRecipe";
import { EditEvent } from "../pages/EditEvent";

const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const token = getAccessToken();
  return token ? element : <Navigate to="/login" replace />;
};

const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Auth routes - always accessible */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute element={<Home />} />} />
      <Route path="/addRecipe" element={<ProtectedRoute element={<AddRecipe />} />} />
      <Route path="/events/new" element={<ProtectedRoute element={<CreateEvent />} />} />
      <Route path="/events/:eventId" element={<ProtectedRoute element={<EventDetails />} />} />
      <Route path="/events/:eventId/edit" element={<ProtectedRoute element={<EditEvent />} />} />
      <Route path="/recipes/:recipeId" element={<ProtectedRoute element={<RecipeDetails />} />} />
      <Route path="/recipes/:recipeId/edit" element={<ProtectedRoute element={<EditRecipe />} />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;

