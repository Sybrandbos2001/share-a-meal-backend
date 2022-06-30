const express = require("express");
const router = express.Router();
const mealController = require("../controllers/meal.controller");
const authController = require("../controllers/auth.controller");

// UC-301 Register as a new meal
router.post(
    "/api/meal",
    authController.validateToken,
    mealController.validateMeal,
    mealController.addMeal
);

// UC-302 Update meal 
router.put(
    "/api/meal/:id",
    authController.validateToken,
    mealController.validateMeal,
    mealController.updateMealById
);

// UC-303 Get all meals
router.get(
    "/api/meal",
    authController.validateToken,
    mealController.getAllMeals
);

// UC-304 Get single meal by ID
router.get(
    "/api/meal/:id",
    authController.validateToken,
    mealController.getMealById
);

// UC-305 Delete a meal
router.delete(
    "/api/meal/:id",
    authController.validateToken,
    mealController.deleteMealById
);

module.exports = router;