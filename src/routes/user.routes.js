const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authController = require("../controllers/auth.controller");

// UC-201 Register as a new user
router.post("/api/user", userController.validateUser, userController.addUser);

// UC-202 Get all users
router.get(
    "/api/user",
    authController.validateToken,
    userController.getAllUsers
);

// UC-203 Request personal user profile
router.get(
    "/api/user/profile",
    authController.validateToken,
    userController.getUserProfile
);

// UC-204 Get single user by ID
router.get(
    "/api/user/:id",
    authController.validateToken,
    userController.getUserById
);

// UC-205 Update a single user
router.put(
    "/api/user/:id",
    authController.validateToken,
    userController.validateUpdate,
    userController.updateUserById
);

// UC-206 Delete an user
router.delete(
    "/api/user/:id",
    authController.validateToken,
    userController.deleteUserById
);

module.exports = router;