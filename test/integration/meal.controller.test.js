process.env.DB_DATABASE = process.env.DB_DATABASE || "share-a-meal-testdb";
process.env.LOGLEVEL = "error";

const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
const pool = require("../../src/database/dbconnection");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { jwtSecretKey } = require("../../src/config/config");

chai.should();
chai.use(chaiHttp);

const CLEAR_USERS_TABLE = "DELETE IGNORE FROM `user`;";
const CLEAR_MEAL_TABLE = "DELETE IGNORE FROM `meal`;";
const CLEAR_MEAL_PARTICIPANT_TABLE =
    "DELETE IGNORE FROM `meal_participants_user`;";
const CLEAR_DB =
    CLEAR_MEAL_TABLE + CLEAR_MEAL_PARTICIPANT_TABLE + CLEAR_USERS_TABLE;
const INSERT_USER =
    "INSERT INTO `user` (`id`, `firstName`, `lastName`, `street`, `city`, `isActive`, `password`, `emailAdress`,  `phoneNumber` ) VALUES" +
    '(1, "Sybrand", "Bos", "Lovendijkstraat", "Breda", true,  "Welkom01!", "sybrandbos@gmail.com", "0612345678"),' +
    '(2, "Klaas", "Petersen", "Lovendijkstraat", "Breda", false,  "Welkom01!", "Klaaspetersen@gmail.com", "0612345678");';

const INSERT_MEAL =
    "INSERT INTO meal (id, name, description, isActive, isVega, isVegan, isToTakeHome, dateTime, imageUrl, allergenes, maxAmountOfParticipants, price, cookId) VALUES" +
    '(1, "meal1", "meal1 description", true, true, true, true, "2022-05-21 07:11:46", "image_url_meal1", "gluten,noten,lactose", 6, 5.55, 1),' +
    '(2, "meal2", "meal2 description", true, true, true, true, "2022-05-21 07:11:46", "image_url_meal2", "gluten,noten,lactose", 6, 5.55, 2);';

describe("Share-a-meal API Tests | Meals", () => {
    describe("UC-301 Maaltijd aanmaken", () => {
        beforeEach((done) => {
            pool.getConnection(function(err, connection) {
                if (err) throw err; // not connected!
                connection.query(
                    CLEAR_DB + INSERT_USER + INSERT_MEAL,
                    function(error, results, fields) {
                        // When done with the connection, release it.
                        connection.release();

                        // Handle error after the release.
                        if (error) throw error;
                        done();
                    }
                );
            });
        });

        it("TC 301-1: verplicht veld ontbreek", (done) => {
            chai
                .request(server)
                .post("/api/meal")
                .set(
                    "authorization",
                    "Bearer " + jwt.sign({ userId: 1000000 }, jwtSecretKey)
                )
                .send({
                    description: "pizza met tomaat",
                    isVega: true,
                    isVegan: true,
                    isToTakeHome: true,
                    dateTime: "2022-05-24T16:00:00.000Z",
                    imageUrl: "https://www.leukerecepten.nl/wp-content/uploads/2019/03/pizza_recepten-432x432.jpg",
                    allergenes: ["gluten"],
                    maxAmountOfParticipants: 4,
                    price: 7.49,
                })
                .end((err, res) => {
                    res.should.be.an("object");
                    const { status, message } = res.body;
                    status.should.equals(400);
                    message.should.be
                        .a("string")
                        .that.equals("Name must be filled in or a string");
                    done();
                });
        });

        it("TC-301-2 Niet ingelogd", (done) => {
            chai
                .request(server)
                .post("/api/meal")
                .send({
                    name: "pizza",
                    description: "pizza met tomaat",
                    isVega: true,
                    isVegan: true,
                    isToTakeHome: true,
                    dateTime: "2022-05-24T16:00:00.000Z",
                    imageUrl: "https://www.leukerecepten.nl/wp-content/uploads/2019/03/pizza_recepten-432x432.jpg",
                    allergenes: ["gluten", "lactose"],
                    maxAmountOfParticipants: 4,
                    price: 7.49,
                })
                .end((err, res) => {
                    res.should.be.an("Object");
                    const { status, message } = res.body;
                    status.should.equals(401);
                    message.should.be
                        .a("string")
                        .that.equals("Authorization header missing!");
                    done();
                });
        });

        it("TC-301-3 Maaltijd succesvol toegevoegd", (done) => {
            chai
                .request(server)
                .post("/api/meal")
                .set(
                    "authorization",
                    "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey)
                )
                .send({
                    name: "pizza",
                    description: "pizza met tomaat",
                    isVega: true,
                    isVegan: true,
                    isToTakeHome: true,
                    dateTime: "2022-05-24T16:00:00.000Z",
                    imageUrl: "https://www.leukerecepten.nl/wp-content/uploads/2019/03/pizza_recepten-432x432.jpg",
                    allergenes: ["gluten", "lactose"],
                    maxAmountOfParticipants: 4,
                    price: 7.49,
                })
                .end((err, res) => {
                    res.should.be.an("Object");
                    const { status, result } = res.body;
                    status.should.equals(201);
                    result.name.should.be.a("string").that.equals("pizza");
                    result.description.should.be
                        .a("string")
                        .that.equals("pizza met tomaat");
                    result.isVega.should.be.a("boolean").that.equals(true);
                    result.isVegan.should.be.a("boolean").that.equals(true);
                    result.isToTakeHome.should.be.a("boolean").that.equals(true);
                    result.imageUrl.should.be
                        .a("string")
                        .that.equals(
                            "https://www.leukerecepten.nl/wp-content/uploads/2019/03/pizza_recepten-432x432.jpg"
                        );
                    result.price.should.be.a("number").that.equals(7.49);
                    done();
                });
        });
    });

    describe("UC-302 Maaltijd wijzigen", () => {
        beforeEach((done) => {
            pool.getConnection(function(err, connection) {
                if (err) throw err; // not connected!
                connection.query(
                    CLEAR_DB + INSERT_USER + INSERT_MEAL,
                    function(error, results, fields) {
                        // When done with the connection, release it.
                        connection.release();

                        // Handle error after the release.
                        if (error) throw error;
                        done();
                    }
                );
            });
        });

        it("TC 302-1: verplicht veld ontbreek", (done) => {
            chai
                .request(server)
                .put("/api/meal/1")
                .set(
                    "authorization",
                    "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey)
                )
                .send({
                    description: "pizza met tomaat",
                    isVega: true,
                    isVegan: true,
                    isToTakeHome: true,
                    dateTime: "2022-05-24T16:00:00.000Z",
                    imageUrl: "https://www.leukerecepten.nl/wp-content/uploads/2019/03/pizza_recepten-432x432.jpg",
                    allergenes: ["gluten"],
                    maxAmountOfParticipants: 4,
                    price: 7.49,
                })
                .end((err, res) => {
                    res.should.be.an("object");
                    const { status, message } = res.body;
                    status.should.equals(400);
                    message.should.be
                        .a("string")
                        .that.equals("Name must be filled in or a string");
                    done();
                });
        });

        it("TC-302-2 Niet ingelogd", (done) => {
            chai
                .request(server)
                .put("/api/meal/1")
                .send({
                    name: "pizza",
                    description: "pizza met tomaat",
                    isVega: true,
                    isVegan: true,
                    isToTakeHome: true,
                    dateTime: "2022-05-24T16:00:00.000Z",
                    imageUrl: "https://www.leukerecepten.nl/wp-content/uploads/2019/03/pizza_recepten-432x432.jpg",
                    allergenes: ["gluten", "lactose"],
                    maxAmountOfParticipants: 4,
                    price: 7.49,
                })
                .end((err, res) => {
                    res.should.be.an("Object");
                    const { status, message } = res.body;
                    status.should.equals(401);
                    message.should.be
                        .a("string")
                        .that.equals("Authorization header missing!");
                    done();
                });
        });

        it("TC-302-3 Niet de eigenaar van de data", (done) => {
            chai
                .request(server)
                .put("/api/meal/1")
                .set(
                    "authorization",
                    "Bearer " + jwt.sign({ userId: 1000000 }, jwtSecretKey)
                )
                .send({
                    name: "pizza",
                    description: "pizza met tomaat",
                    isVega: true,
                    isVegan: true,
                    isToTakeHome: true,
                    dateTime: "2022-05-24T16:00:00.000Z",
                    imageUrl: "https://www.leukerecepten.nl/wp-content/uploads/2019/03/pizza_recepten-432x432.jpg",
                    allergenes: ["gluten", "lactose"],
                    maxAmountOfParticipants: 4,
                    price: 7.49,
                })
                .end((err, res) => {
                    res.should.be.an("Object");
                    const { status, message } = res.body;
                    status.should.equals(401);
                    message.should.be.a("string").that.equals("User Unauthorized, this is not your meal.");
                    done();
                });
        });

        it("TC-302-4 Maaltijd bestaat niet", (done) => {
            chai
                .request(server)
                .put("/api/meal/0")
                .set(
                    "authorization",
                    "Bearer " + jwt.sign({ userId: 1000000 }, jwtSecretKey)
                )
                .send({
                    name: "pizza",
                    description: "pizza met tomaat",
                    isVega: true,
                    isVegan: true,
                    isToTakeHome: true,
                    dateTime: "2022-05-24T16:00:00.000Z",
                    imageUrl: "https://www.leukerecepten.nl/wp-content/uploads/2019/03/pizza_recepten-432x432.jpg",
                    allergenes: ["gluten", "lactose"],
                    maxAmountOfParticipants: 4,
                    price: 7.49,
                })
                .end((err, res) => {
                    res.should.be.an("Object");
                    const { status, message } = res.body;
                    status.should.equals(400);
                    message.should.be.a("string").that.equals("Can't find meal with ID: 0");
                    done();
                });
        });

        it("TC-302-5 Maaltijd succesvol gewijzigd", (done) => {
            chai
                .request(server)
                .put("/api/meal/1")
                .set(
                    "authorization",
                    "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey)
                )
                .send({
                    name: "pizza",
                    description: "pizza met tomaat",
                    isVega: true,
                    isVegan: true,
                    isToTakeHome: true,
                    dateTime: "2022-05-24T16:00:00.000Z",
                    imageUrl: "https://www.leukerecepten.nl/wp-content/uploads/2019/03/pizza_recepten-432x432.jpg",
                    allergenes: ["gluten", "lactose"],
                    maxAmountOfParticipants: 4,
                    price: 7.49,
                })
                .end((err, res) => {
                    res.should.be.an("Object");
                    const { status, result } = res.body;
                    status.should.equals(200);
                    result.should.be.a("Object").that.contains({
                        id: result.id,
                        name: "pizza",
                        description: "pizza met tomaat",
                        isVega: true,
                        isVegan: true,
                        isToTakeHome: true,
                        dateTime: "2022-05-24 16:00:00",
                        imageUrl: "https://www.leukerecepten.nl/wp-content/uploads/2019/03/pizza_recepten-432x432.jpg",
                        allergenes: "gluten,lactose",
                        maxAmountOfParticipants: 4,
                        price: 7.49,
                    });
                    done();
                });
        });
    });

    describe("UC-303 Lijst van maaltijden opvragen", () => {
        beforeEach((done) => {
            pool.getConnection(function(err, connection) {
                if (err) throw err; // not connected!
                connection.query(
                    CLEAR_DB + INSERT_USER + INSERT_MEAL,
                    function(error, results, fields) {
                        // When done with the connection, release it.
                        connection.release();

                        // Handle error after the release.
                        if (error) throw error;
                        done();
                    }
                );
            });
        });

        it("TC-303-1 Lijst van maaltijden geretourneerd", (done) => {
            chai
                .request(server)
                .get("/api/meal")
                .set(
                    "authorization",
                    "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey)
                )
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, results } = res.body;
                    status.should.equals(200);
                    results.should.be.an("array").that.has.length(2);
                    done();
                });
        });
    });

    describe("UC-304 Details van een maaltijd opvragen", () => {
        it("TC-304-1 Maaltijd bestaat niet", (done) => {
            chai
                .request(server)
                .get("/api/meal/999999")
                .set(
                    "authorization",
                    "Bearer " + jwt.sign({ userId: 1000000 }, jwtSecretKey)
                )
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, message } = res.body;
                    status.should.equals(404);
                    message.should.be.a("string").that.equals("meal does not exist");
                    done();
                });
        });
        it("TC-304-2 Details van maaltijd geretourneerd", (done) => {
            chai
                .request(server)
                .get("/api/meal/1")
                .set(
                    "authorization",
                    "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey)
                )
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, result } = res.body;
                    status.should.equals(200);
                    result.should.be.a("Object").that.contains({
                        id: 1,
                        name: "meal1",
                        description: "meal1 description",
                        isVega: true,
                        isVegan: true,
                        isToTakeHome: true,
                        imageUrl: "image_url_meal1",
                        maxAmountOfParticipants: 6,
                        price: 5.55,
                        cookId: 1,
                    });

                    done();
                });
        });
    });

    describe("UC-305 Maaltijd verwijderen", () => {
        beforeEach((done) => {
            pool.getConnection(function(err, connection) {
                if (err) throw err; // not connected!
                connection.query(
                    CLEAR_DB + INSERT_USER + INSERT_MEAL,
                    function(error, results, fields) {
                        // When done with the connection, release it.
                        connection.release();

                        // Handle error after the release.
                        if (error) throw error;
                        done();
                    }
                );
            });
        });

        it("TC-305-2 Niet ingelogd", (done) => {
            chai
                .request(server)
                .delete("/api/meal/5")
                .send()
                .end((err, res) => {
                    res.should.be.an("object");
                    const { status, message } = res.body;
                    status.should.equals(401);
                    message.should.be
                        .a("string")
                        .that.equals("Authorization header missing!");
                    done();
                });
        });

        it("TC-305-3 Niet de eigenaar van de data", (done) => {
            chai
                .request(server)
                .delete("/api/meal/1")
                .set("authorization", "Bearer " + jwt.sign({ userId: 2 }, jwtSecretKey))
                .end(function(err, res) {
                    res.should.be.an("object");
                    const { status, message } = res.body;
                    status.should.equals(403);
                    message.should.be.a("string").that.equals("This meal is not yours");
                    done();
                });
        });

        it("TC-305-4 Maaltijd bestaat niet", (done) => {
            chai
                .request(server)
                .delete("/api/meal/1234")
                .set(
                    "authorization",
                    "Bearer " + jwt.sign({ userId: 1000000 }, jwtSecretKey)
                )
                .end(function(err, res) {
                    res.should.be.an("object");
                    const { status, message } = res.body;
                    status.should.equals(404);
                    message.should.be.a("string").that.equals("meal does not exist");
                    done();
                });
        });
        it("TC-305-5 Maaltijd succesvol verwijderd", (done) => {
            chai
                .request(server)
                .delete("/api/meal/1")
                .set(
                    "authorization",
                    "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey)
                )
                .end(function(err, res) {
                    res.should.be.an("object");
                    const { status, message } = res.body;
                    status.should.equals(200);
                    message.should.be.a("string").that.equals("Deleted");
                    done();
                });
        });
    });
});