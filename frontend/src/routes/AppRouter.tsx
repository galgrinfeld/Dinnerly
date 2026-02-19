import React from "react";
import { Routes, Route } from "react-router-dom";
import { Home } from "../pages/Home";
import { AddRecipe } from "../pages/AddRecipe";
import { CreateEvent } from "../pages/CreateEvent";

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/addRecipe" element={<AddRecipe />} />
      <Route path="/events/new" element={<CreateEvent />} />
    </Routes>
  );
};

export default AppRouter;

