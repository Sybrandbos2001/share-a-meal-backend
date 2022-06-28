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

const CLEAR_MEAL_TABLE = "DELETE IGNORE FROM `meal`;";
const CLEAR_PARTICIPANTS_TABLE = "DELETE IGNORE FROM `meal_participants_user`;";
const CLEAR_USERS_TABLE = "DELETE IGNORE FROM `user`;";
const CLEAR_DB =
    CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE;
const TEST_USER_AT_ID_IS_1000000 =
    "INSERT INTO user (id, firstName, lastName, isActive, emailAdress, password, street, city) VALUES (1000000, 'Klaas' ,'Petersen' ,1 ,'klaaspetersen@gmail.com' ,'GeheimWW123!' ,'Lovensdijkstraat', 'Breda')";

const TEST_MEAL_WITH_COOK_ID_1000000 =
    "INSERT INTO meal (id ,name, description, isVega, isVegan, isToTakeHome, dateTime, imageUrl, maxAmountOfParticipants, allergenes, price, cookId) VALUES (100, 'appeltaart', 'appeltaart met kaneel', true, true, true, '2022-05-24 16:00:00', 'https://images.ctfassets.net/brcxfsm84vq2/7eBkjOINljB22V9Tx2qSno/5a05656241fe2083dbd1cf20668cd862/appeltaart_met_extra_veel_deeg?w=600&fm=webp', 8, 'lactose' , 3.99, 1000000)";

describe("Share-a-meal API Tests | Meals", () => {
    describe("UC-301 Maaltijd aanmaken", () => {
        before((done) => {
            pool.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query(CLEAR_DB, function(error, result, field) {
                    if (error) throw error;
                    connection.query(
                        TEST_USER_AT_ID_IS_1000000,
                        function(error, result, field) {
                            if (error) throw error;

                            connection.query(
                                TEST_MEAL_WITH_COOK_ID_1000000,
                                function(error, result, field) {
                                    if (error) throw error;

                                    connection.release();
                                    done();
                                }
                            );
                        }
                    );
                });
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

    describe("UC-303 Lijst van maaltijden opvragen", () => {
        before(function(done) {
            pool.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query(CLEAR_DB, function(error, result, field) {
                    if (error) throw error;
                    connection.query(
                        TEST_USER_AT_ID_IS_1000000,
                        function(error, result, field) {
                            if (error) throw error;
                            connection.query(
                                TEST_MEAL_WITH_COOK_ID_1000000,
                                function(error, result, field) {
                                    if (error) throw error;
                                    connection.release();
                                    done();
                                }
                            );
                        }
                    );
                });
            });
        });

        it("TC-303-1 Lijst van maaltijden geretourneerd", (done) => {
            chai
                .request(server)
                .get("/api/meal")
                .set(
                    "authorization",
                    "Bearer " + jwt.sign({ userId: 1000000 }, jwtSecretKey)
                )
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, results } = res.body;
                    status.should.equals(200);
                    results.should.be.an("array").that.has.length(1);
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
                .get("/api/meal/100")
                .set(
                    "authorization",
                    "Bearer " + jwt.sign({ userId: 1000000 }, jwtSecretKey)
                )
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, result } = res.body;
                    status.should.equals(200);
                    result.should.be.a("Object").that.contains({
                        id: 100,
                        name: "appeltaart",
                        description: "appeltaart met kaneel",
                        isVega: true,
                        isVegan: true,
                        isToTakeHome: true,
                        imageUrl: "https://images.ctfassets.net/brcxfsm84vq2/7eBkjOINljB22V9Tx2qSno/5a05656241fe2083dbd1cf20668cd862/appeltaart_met_extra_veel_deeg?w=600&fm=webp",
                        maxAmountOfParticipants: 8,
                        price: 3.99,
                        cookId: 1000000,
                    });

                    done();
                });
        });
    });

    describe("UC-305 Maaltijd verwijderen", () => {
        before((done) => {
            pool.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query(CLEAR_DB, function(error, result, field) {
                    if (error) throw error;
                    connection.query(
                        TEST_USER_AT_ID_IS_1000000,
                        function(error, result, field) {
                            if (error) throw error;

                            connection.query(
                                TEST_MEAL_WITH_COOK_ID_1000000,
                                function(error, result, field) {
                                    if (error) throw error;

                                    connection.release();
                                    done();
                                }
                            );
                        }
                    );
                });
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
                .delete("/api/meal/100")
                .set("authorization", "Bearer " + jwt.sign({ userId: 0 }, jwtSecretKey))
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
                .delete("/api/meal/100")
                .set(
                    "authorization",
                    "Bearer " + jwt.sign({ userId: 1000000 }, jwtSecretKey)
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