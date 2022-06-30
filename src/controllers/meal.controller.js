const assert = require("assert");
const { all } = require("express/lib/application");
const { acceptsCharsets } = require("express/lib/request");
const pool = require("../database/dbconnection");

let logic = {
    mealConverter: (meals) => {
        for (let i = 0; i < meals.length; i++) {
            meals[i].allergenes = meals[i].allergenes.split(",");
            meals[i].price = parseFloat(meals[i].price);
            meals[i].isToTakeHome = meals[i].isToTakeHome == 1 ? true : false;
            meals[i].isActive = meals[i].isActive == 1 ? true : false;
            meals[i].isVega = meals[i].isVega == 1 ? true : false;
            meals[i].isVegan = meals[i].isVegan == 1 ? true : false;
        }
    },
};

let controller = {
    validateMeal: (req, res, next) => {
        const meal = req.body;

        try {
            assert(
                typeof meal.name == "string",
                "Name must be filled in or a string"
            );
            assert(
                typeof meal.description == "string",
                "Description must be filled in or a string"
            );
            assert(typeof meal.isVega == "boolean", "Is vega should be a boolean");
            assert(typeof meal.isVegan == "boolean", "Is vegan should be a boolean");
            assert(
                typeof meal.isToTakeHome == "boolean",
                "Is to take home should be a boolean"
            );
            assert(typeof meal.dateTime == "string", "Datetime should be a string");
            assert(typeof meal.imageUrl == "string", "Image url should be a string");
            assert(meal.allergenes, "Allergenes should be a array with a string");
            assert(
                typeof meal.maxAmountOfParticipants == "number",
                "Maximum amount of participants should be a number"
            );
            assert(typeof meal.price == "number", "Price should be a number");

            next();
        } catch (err) {
            const error = {
                status: 400,
                message: err.message,
            };

            next(error);
        }
    },
    addMeal: (req, res) => {
        const meal = req.body;
        if (!req.userId) {
            res.status(401).json({
                status: 401,
                message: "Not authorized! (user ID missing from payload).",
            });
        }
        meal.cookId = req.userId;
        meal.allergenes = meal.allergenes.join();

        pool.getConnection(function(err, connection) {
            connection.query(
                "INSERT INTO meal (name, description, isVega, isVegan, isToTakeHome, dateTime, imageUrl, maxAmountOfParticipants, allergenes, price, cookId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", [
                    meal.name,
                    meal.description,
                    meal.isVega,
                    meal.isVegan,
                    meal.isToTakeHome,
                    meal.dateTime.replace("T", " ").substring(0, 19),
                    meal.imageUrl,
                    meal.maxAmountOfParticipants,
                    meal.allergenes,
                    meal.price,
                    meal.cookId,
                ],
                function(error, results, fields) {
                    if (error) {
                        connection.release();
                        if (error.errno == 1062) {
                            return res.status(409).json({
                                status: 409,
                                message: "Meal already exists",
                            });
                        } else {
                            return res.status(400).json({
                                status: 400,
                                message: error.message,
                            });
                        }
                    } else {
                        connection.query(
                            `SELECT LAST_INSERT_ID() AS id;`,
                            function(error, results, fields) {
                                connection.release();
                                if (error) {
                                    res.status(500).json({
                                        status: 500,
                                        message: "Database error on adding meal: " + error.message,
                                    });
                                }
                                const { id } = results[0];

                                res.status(201).json({
                                    status: 201,
                                    result: { id, ...meal },
                                });
                            }
                        );
                    }
                }
            );
        });
    },

    getAllMeals: (req, res) => {
        pool.getConnection(function(err, connection) {
            connection.query(
                "SELECT * FROM `meal`",
                function(error, results, fields) {
                    connection.release();
                    if (error) throw error;

                    res.status(200).json({
                        status: 200,
                        results: results,
                    });
                }
            );
        });
    },

    getMealById: (req, res) => {
        pool.getConnection(function(err, connection) {
            if (err) throw err;
            connection.query(
                "SELECT * FROM meal WHERE id = " + req.params.id,
                function(error, results, fields) {
                    connection.release();
                    if (results) {
                        if (results.length === 0) {
                            return res.status(404).json({
                                status: 404,
                                message: "meal does not exist",
                            });
                        }

                        logic.mealConverter(results);
                        return res.status(200).json({
                            status: 200,
                            result: results[0],
                        });
                    } else {
                        return res.status(400).json({
                            status: 400,
                            message: "Unknown error",
                        });
                    }
                }
            );
        });
    },

    deleteMealById: (req, res) => {
        pool.getConnection(function(err, connection) {
            if (err) {
                throw res.status(400).json({
                    status: 400,
                    error: err,
                });
            }

            connection.query(
                "SELECT cookId FROM meal WHERE id = " + req.params.id,
                function(error, results) {
                    if (error) throw error;
                    connection.release();

                    if (results.length === 0) {
                        res.status(404).json({
                            status: 404,
                            message: "meal does not exist",
                        });
                    } else if (results[0].cookId != req.userId) {
                        res.status(403).json({
                            status: 403,
                            message: "This meal is not yours",
                        });
                    } else {
                        connection.query(
                            "DELETE FROM meal WHERE id = " + req.params.id,
                            function(error, results, fields) {
                                connection.release();

                                if (error && error.errno == 1451) {
                                    errorMessage = "Foreignkey constraint, delete failed!";
                                } else {
                                    res.status(200).json({
                                        status: 200,
                                        message: "Deleted",
                                    });
                                }
                            }
                        );
                    }
                }
            );
        });
    },

    updateMealById(req, res, next) {
        pool.getConnection(function(err, connection) {
            //not connected
            if (err) {
                next(err);
            }
            connection.query(
                "SELECT cookId FROM meal WHERE id = ?", [req.params.id],
                function(error, results, fields) {
                    // When done with the connection, release it.
                    connection.release();
                    // Handle error after the release.
                    if (error) {
                        next(error);
                    }
                    // Check if there are results
                    if (results.length > 0) {
                        // Check if user is cook
                        if (Number(results[0].cookId) === req.userId) {
                            // Removing 'T' form dateTime
                            req.body.dateTime = req.body.dateTime.replace("T", " ").substring(0, 19)
                            let allergenes = req.body.allergenes
                            if (allergenes != null) {
                                let allergenesString = "";
                                // Looping over allergene array
                                allergenes.forEach(function(gene) {
                                    allergenesString = allergenesString + gene + ","
                                });
                                // Removing last ','
                                allergenesString = allergenesString.slice(0, -1);
                                req.body.allergenes = allergenesString;
                            }
                            connection.query(
                                'UPDATE `meal` SET ? WHERE `id` = ?', [req.body, req.params.id],
                                function(error, results, fields) {
                                    if (error) throw error;
                                    connection.release()
                                        // If succesfull send 200 message
                                    if (results.changedRows > 0) {
                                        updatedMeal = req.body;
                                        res.status(200).json({
                                            status: 200,
                                            result: { id: req.params.id, ...updatedMeal },
                                        });
                                    } else {
                                        // Meal couldn't be updated, prob same values
                                        res.status(400).json({
                                            status: 400,
                                            message: "Couldn't update meal with ID: " + req.params.id + ", values are probably the same",
                                        });
                                    }
                                }
                            );
                        } else {
                            // User is not cook, unauthorized
                            return res.status(401).json({
                                status: 401,
                                message: "User Unauthorized, this is not your meal.",
                            });
                        }
                    } else {
                        // Meal doesn 't exists
                        res.status(400).json({
                            status: 400,
                            message: "Can't find meal with ID: " + req.params.id,
                        });
                    }
                }
            );
        });
    },
};

module.exports = controller;