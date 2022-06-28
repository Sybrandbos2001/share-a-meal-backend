const assert = require("assert");
const pool = require("../database/dbconnection");

const phoneRegex = /(06)(\s|\-|)\d{8}|31(\s6|\-6|6)\d{8}/;
const emailRegex = /^\w+([.-]?\w+)@\w+([.-]?\w+)(.\w{1,3})+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;

let controller = {
    validateUser: (req, res, next) => {
        let user = req.body;
        let { firstName, lastName, emailAdress, password, street, city } = user;

        try {
            assert(typeof firstName === "string", "First firstName must be a string");
            assert(typeof lastName === "string", "Last firstName must be a string");
            assert(typeof emailAdress === "string", "Email must be a string");
            assert(typeof password === "string", "Password must be a string");
            assert(typeof street === "string", "Street must be a string");
            assert(typeof city === "string", "City must be a string");
            assert(emailRegex.test(emailAdress), "Invalid email");
            assert(passwordRegex.test(password), "Invalid password");

            next();
        } catch (err) {
            const error = {
                status: 400,
                message: err.message,
            };

            next(error);
        }
    },

    validateUpdate: (req, res, next) => {
        let user = req.body;
        let {
            firstName,
            lastName,
            isActive,
            emailAdress,
            password,
            phoneNumber,
            street,
            city,
        } = user;

        try {
            assert(typeof firstName === "string", "First firstName must be a string");
            assert(typeof lastName === "string", "Last firstName must be a string");
            assert(typeof isActive === "boolean", "Is active must be a boolean");
            assert(typeof emailAdress === "string", "Email must be a string");
            assert(typeof password === "string", "Password must be a string");
            assert(typeof phoneNumber === "string", "Phonenumber must be a string");
            assert(typeof street === "string", "Street must be a string");
            assert(typeof city === "string", "City must be a string");
            assert(phoneRegex.test(phoneNumber), "Invalid phonenumber");

            next();
        } catch (err) {
            const error = {
                status: 400,
                message: err.message,
            };
            next(error);
        }
    },
    addUser: (req, res) => {
        let user = req.body;

        pool.getConnection(function(err, connection) {
            if (err) throw err;

            connection.query(
                `INSERT INTO user (firstName, lastName, isActive, emailAdress, password, street, city, phoneNumber) VALUES ('${user.firstName}' ,'${user.lastName}' ,1 ,'${user.emailAdress}' ,'${user.password}' ,'${user.street}', '${user.city}', '${user.phoneNumber}')`,
                function(error, results, fields) {
                    connection.release();
                    if (error) {
                        if (error.errno == 1062) {
                            return res.status(409).json({
                                status: 409,
                                message: "Gebruiker bestaat al",
                            });
                        } else {
                            return res.status(400).json({
                                status: 400,
                            });
                        }
                    } else {
                        connection.query(
                            `SELECT * FROM user WHERE emailAdress = '${user.emailAdress}'`,
                            function(error, results, fields) {
                                connection.release();

                                if (error) throw error;

                                let user = results[0];

                                if (user.isActive == 1) {
                                    user.isActive = true;
                                } else {
                                    user.isActive = false;
                                }
                                res.status(201).json({
                                    status: 201,
                                    result: user,
                                });
                            }
                        );
                    }
                }
            );
        });
    },

    getAllUsers: (req, res) => {
        const { length, isActive, firstName } = req.query;
        let query = "SELECT * FROM `user`";
        if (isActive && firstName) {
            query += ` WHERE firstName = '${firstName}' AND isActive = ${isActive}`;
        } else if (isActive) {
            query += ` WHERE isActive = ${isActive}`;
        } else if (firstName) {
            query += ` WHERE firstName = '${firstName}'`;
        }
        if (length) {
            query += ` LIMIT ${length}`;
        }
        query += ";";

        pool.getConnection(function(err, connection) {
            connection.query(
                query, [firstName, isActive],
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

    getUserProfile: (req, res) => {
        pool.getConnection(function(err, connection) {
            connection.query(
                `SELECT * FROM user WHERE id = ` + req.userId,
                function(error, results, fields) {
                    connection.release();
                    if (error) throw error;

                    if (results.length == 0) {
                        res.status(404).json({
                            status: 404,
                            results: "User does not exist",
                        });
                    } else {
                        res.status(200).json({
                            status: 200,
                            results: results[0],
                        });
                    }
                }
            );
        });
    },

    getUserById: (req, res) => {
        pool.getConnection(function(err, connection) {
            if (err) throw err;
            connection.query(
                "SELECT * FROM user WHERE id = " + req.params.id,
                function(error, results, fields) {
                    connection.release();
                    if (results) {
                        if (results.length === 0) {
                            return res.status(404).json({
                                status: 404,
                                message: "User does not exist",
                            });
                        }

                        return res.status(200).json({
                            status: 200,
                            result: results[0],
                        });
                    } else {
                        return res.status(400).json({
                            status: 400,
                        });
                    }
                }
            );
        });
    },

    updateUserById(req, res, next) {
        pool.getConnection(function(err, connection) {
            //not connected
            if (err) {
                next(err);
            }
            if (req.params.id != req.userId) {
                return res.status(400).json({
                    status: 400,
                    message: `User doesn't exists, or not authorized to update the user.`,
                });
            } else {
                // Use the connection
                connection.query(
                    "UPDATE user SET ? WHERE id = ?", [req.body, req.params.id],
                    function(error, results, fields) {
                        // When done with the connection, release it.
                        connection.release();
                        // Handle error after the release.
                        if (error) {
                            next(error);
                        }

                        // succesfull query handlers
                        if (results.affectedRows > 0) {
                            userToUpdate = req.body;
                            res.status(200).json({
                                status: 200,
                                result: { id: req.params.id, ...userToUpdate },
                            });
                        } else {
                            res.status(400).json({
                                status: 400,
                                message: `Can't find user with ID: ${req.params.id}`,
                            });
                        }
                    }
                );
            }
        });
    },

    deleteUserById: (req, res) => {
        if (req.userId === Number(req.params.id)) {
            pool.getConnection(function(err, connection) {
                if (err) {
                    throw res.status(400).json({
                        status: 400,
                        error: err,
                    });
                }

                connection.query(
                    "DELETE FROM user WHERE id = " + req.params.id,
                    function(error, results, fields) {
                        connection.release();
                        if (error) {
                            if (error.errno == 1054) {
                                console.log("NUMMER 1054 ERROR LET OP DEZE: " + error);
                                return res.status(400).json({
                                    status: 400,
                                });
                            }

                            let errorMessage = error.message;

                            if (error.errno == 1451) {
                                errorMessage = `Foreignkey error delete failed!`;
                            }

                            return res.status(400).json({
                                status: 400,
                                error: errorMessage,
                            });
                        }

                        if (results) {

                            if (results.affectedRows === 0) {
                                return res.status(400).json({
                                    status: 400,
                                    message: "User does not exist",
                                });
                            }

                            return res.status(200).json({
                                status: 200,
                                message: "Deleted",
                            });
                        } else {
                            return res.status(400).json({
                                status: 400,
                            });
                        }
                    }
                );
            });
        } else {
            return res.status(401).json({
                status: 401,
                message: "Unauthorized, this is not your account/acount does not exist",
            });
        }
    },
};

module.exports = controller;