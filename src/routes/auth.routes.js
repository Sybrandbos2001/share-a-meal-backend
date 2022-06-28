const express = require("express");
const routes = express.Router();
const authController = require("../controllers/auth.controller");

// router.post("/api/auth/login", authController.login);
routes.post(
    "/api/auth/login",
    authController.validateLogin,
    authController.login
);

module.exports = routes;