import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AddRecipe } from "../pages/AddRecipe";

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/addRecipe" replace />} />
        <Route path="/addRecipe" element={<AddRecipe />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
