import React from "react";
import { Route, Routes } from "react-router-dom";
import LoginForm from "../components/LoginForm";

const AuthRoutes = () => (
  <Routes>
    <Route path="/" element={<LoginForm />} />
  </Routes>
);

export default AuthRoutes;
