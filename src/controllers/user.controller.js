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
        const queryParams = req.query;

        let { firstName, isActive } = req.query;
        let queryString = "SELECT * FROM `user`";
        if (firstName || isActive) {
            queryString += " WHERE ";
            if (firstName) {
                queryString += "`firstName` LIKE ?";
                firstName = "%" + firstName + "%";
            }
            if (firstName && isActive) queryString += " AND ";
            if (isActive) {
                queryString += "`isActive` = ?";
            }
        }
        queryString += ";";

        pool.getConnection(function(err, connection) {
            connection.query(
                queryString, [firstName, isActive],
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
        const getprofilebyid = req.userId;
        pool.getConnection(function(err, connection) {
            connection.query(
                `SELECT * FROM user WHERE id = ${getprofilebyid}`,
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

    updateUserById: (req, res) => {
        const putsingleuserbyid = req.params.id;
        let updatedUser = { idUser: putsingleuserbyid, ...req.body };

        pool.getConnection(function(err, connection) {
            if (err) throw err;
            connection.query(
                "UPDATE user SET firstName=?, lastName=?, isActive=?, emailAdress=?, password=?, phoneNumber=?, street=?, city=? WHERE id = ?", [
                    updatedUser.firstName,
                    updatedUser.lastName,
                    updatedUser.isActive,
                    updatedUser.emailAdress,
                    updatedUser.password,
                    updatedUser.phoneNumber,
                    updatedUser.street,
                    updatedUser.city,
                    putsingleuserbyid,
                ],
                function(error, results, fields) {
                    connection.release();
                    if (error) {
                        if (error.errno == 1292) {
                            console.log("1292 error: " + error);
                            return res.status(400).json({
                                status: 400,
                            });
                        }
                        return res.status(400).json({
                            status: 400,
                            error: error.message,
                        });
                    }

                    if (results) {
                        if (results.affectedRows === 0) {
                            return res.status(400).json({
                                status: 400,
                                message: "User does not exist",
                            });
                        }
                        connection.query(
                            `SELECT * FROM user WHERE id = '${putsingleuserbyid}'`,
                            function(error, results, fields) {
                                connection.release();
                                if (results) {
                                    res.status(200).json({
                                        status: 200,
                                        result: results[0],
                                    });
                                }
                            }
                        );
                    } else {
                        return res.status(400).json({
                            status: 400,
                        });
                    }
                }
            );
        });
    },

    deleteUserById: (req, res) => {
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
    },
};

module.exports = controller;