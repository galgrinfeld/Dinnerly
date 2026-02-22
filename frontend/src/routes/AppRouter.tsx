import React from "react";
import { Routes, Route } from "react-router-dom";
import { Home } from "../pages/Home";
import { AddRecipe } from "../pages/AddRecipe";
import { CreateEvent } from "../pages/CreateEvent";
import { EventDetails } from "../pages/EventDetails";

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/addRecipe" element={<AddRecipe />} />
      <Route path="/events/new" element={<CreateEvent />} />
      <Route path="/events/:eventId" element={<EventDetails />} />
    </Routes>
  );
};

export default AppRouter;

