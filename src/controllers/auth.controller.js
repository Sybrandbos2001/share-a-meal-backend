const assert = require("assert");
const { json } = require("express/lib/response");
const pool = require("../database/dbconnection");
const jwt = require("jsonwebtoken");

const logger = require("../config/config").logger;
const jwtSecretKey = require("../config/config").jwtSecretKey;
const emailRegex = /^\w+([.-]?\w+)@\w+([.-]?\w+)(.\w{1,3})+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;

let controller = {
    login(req, res, next) {
        pool.getConnection((err, connection) => {
            if (err) {
                res.status(500).json({
                    error: err.messages,
                    datetime: new Date().toISOString(),
                });
            }

            if (connection) {
                connection.query(
                    "SELECT `id`, `emailAdress`, `password`, `firstName`, `lastName` FROM `user` WHERE `emailAdress` = ?", [req.body.emailAdress],
                    (err, rows, fields) => {
                        connection.release();
                        if (err) {
                            logger.error("Error on login: ", err.message);
                            res.status(500).json({
                                error: err.message,
                                datetime: new Date().toISOString(),
                            });
                        }
                        if (rows) {
                            if (rows && rows.length === 1 && rows[0].password == req.body.password) {
                                const { password, ...userinfo } = rows[0];
                                const payload = {
                                    userId: userinfo.id,
                                };

                                jwt.sign(
                                    payload,
                                    jwtSecretKey, { expiresIn: "12d" },
                                    function(err, token) {
                                        res.status(200).json({
                                            status: 200,
                                            result: {...userinfo, token },
                                        });
                                    }
                                );
                            } else {
                                res.status(404).json({
                                    status: 404,
                                    message: "User not found or password invalid",
                                });
                            }
                        }
                    }
                );
            }
        });
    },

    validateLogin(req, res, next) {
        try {
            assert(
                typeof req.body.emailAdress === "string",
                "email must be a string."
            );
            assert(
                typeof req.body.password === "string",
                "password must be a string."
            );

            assert(emailRegex.test(req.body.emailAdress), "Invalid email");
            assert(passwordRegex.test(req.body.password), "Invalid password");

            next();
        } catch (error) {
            res.status(400).json({
                status: 400,
                message: error.message,
            });
        }
    },

    validateToken(req, res, next) {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({
                status: 401,
                message: "Authorization header missing!",
                datetime: new Date().toISOString(),
            });
        } else {
            const token = authHeader.substring(7, authHeader.length);

            jwt.verify(token, jwtSecretKey, (err, payload) => {
                if (err) {
                    res.status(401).json({
                        error: "Not authorized",
                        datetime: new Date().toISOString(),
                    });
                }
                if (payload) {
                    req.userId = payload.userId;
                    next();
                }
            });
        }
    },
};

module.exports = controller;