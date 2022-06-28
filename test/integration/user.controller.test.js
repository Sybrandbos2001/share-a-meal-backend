process.env.DB_DATABASE = process.env.DB_DATABASE || "share-a-meal-testdb";
process.env.LOGLEVEL = "error";

const chai = require("chai");
const chaiHttp = require("chai-http");

const server = require("../../index");

require("dotenv").config();

const pool = require("../../src/database/dbconnection");
const jwt = require("jsonwebtoken");
const { jwtSecretKey } = require("../../src/config/config");

chai.should();
chai.use(chaiHttp);

const CLEAR_MEAL_TABLE = "DELETE IGNORE FROM `meal`;";
const CLEAR_PARTICIPANTS_TABLE = "DELETE IGNORE FROM `meal_participants_user`;";
const CLEAR_USERS_TABLE = "DELETE IGNORE FROM `user`;";
const CLEAR_DB =
    CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE;

const INSERT_USER =
    "INSERT INTO `user` (`id`, `firstName`, `lastName`, `street`, `city`, `isActive`, `password`, `emailAdress`,  `phoneNumber` ) VALUES" +
    '(1, "Sybrand", "Bos", "Lovendijkstraat", "Breda", true,  "Welkom01!", "sybrandbos@gmail.com", "0612345678"),' +
    '(2, "Klaas", "Petersen", "Lovendijkstraat", "Breda", false,  "Welkom01!", "Klaaspetersen@gmail.com", "0612345678");';

describe("Share-a-meal API Tests | Users", () => {
    describe("UC-201 Registreren als nieuwe gebruiker", () => {
        beforeEach((done) => {
            pool.getConnection(function(err, connection) {
                if (err) throw err; // not connected!
                connection.query(
                    CLEAR_DB + INSERT_USER,
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

        it("TC-201-1 Verplicht veld ontbreekt", (done) => {
            chai
                .request(server)
                .post("/api/user")
                .send({
                    firstName: "John",
                    lastName: "Doe",
                    street: "Lovensdijkstraat 61",
                    city: "Breda",
                    isActive: true,
                    password: "secret#f4Dtfeer",
                    phoneNumber: "06 12425475",
                })
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, message } = res.body;
                    status.should.equals(400);
                    message.should.be.a("string").that.equals("Email must be a string");
                    done();
                });
        });

        it("TC-201-2 Niet-valide email adres", (done) => {
            chai
                .request(server)
                .post("/api/user")
                .send({
                    firstName: "John",
                    lastName: "Doe",
                    street: "Lovensdijkstraat 61",
                    city: "Breda",
                    isActive: true,
                    emailAdress: "emailvanjoost",
                    password: "secret#f4Dtfeer",
                    phoneNumber: "06 12425475",
                })
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, message } = res.body;
                    status.should.equals(400);
                    message.should.be.a("string").that.equals("Invalid email");
                    done();
                });
        });

        it("TC-201-3 Niet-valide wachtwoord", (done) => {
            chai
                .request(server)
                .post("/api/user")
                .send({
                    firstName: "John",
                    lastName: "Doe",
                    street: "Lovensdijkstraat 61",
                    city: "Breda",
                    isActive: true,
                    emailAdress: "nieuweuser@gmail.com",
                    password: "wachtwoord",
                    phoneNumber: "06 12425475",
                })
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, message } = res.body;
                    status.should.equals(400);
                    message.should.be.a("string").that.equals("Invalid password");
                    done();
                });
        });

        it("TC-201-4 Gebruiker bestaat al", (done) => {
            chai
                .request(server)
                .post("/api/user")
                .send({
                    firstName: "Klaas",
                    lastName: "Petersen",
                    street: "Lovensdijkstraat 61",
                    city: "Breda",
                    isActive: true,
                    emailAdress: "klaaspetersen@gmail.com",
                    password: "secret#f4Dtfeer",
                    phoneNumber: "06 12425475",
                })
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, message } = res.body;
                    status.should.equals(409);
                    message.should.be.a("string").that.equals("Gebruiker bestaat al");
                    done();
                });
        });

        it("TC-201-5 Gebruiker succesvol geregistreerd", (done) => {
            chai
                .request(server)
                .post("/api/user")
                .send({
                    firstName: "Thijs",
                    lastName: "Petersen",
                    street: "Lovensdijkstraat 61",
                    city: "Breda",
                    isActive: true,
                    emailAdress: "thijs.vandam@avans.nl",
                    password: "secret#f4Dtfeer",
                    phoneNumber: "06 12425475",
                })
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, result } = res.body;
                    status.should.equals(201);
                    result.firstName.should.be.a("string").that.equals("Thijs");
                    result.lastName.should.be.a("string").that.equals("Petersen");
                    result.street.should.be
                        .a("string")
                        .that.equals("Lovensdijkstraat 61");
                    result.city.should.be.a("string").that.equals("Breda");
                    result.isActive.should.be.a("boolean").that.equals(true);
                    result.emailAdress.should.be
                        .a("string")
                        .that.equals("thijs.vandam@avans.nl");
                    result.password.should.be.a("string").that.equals("secret#f4Dtfeer");
                    result.phoneNumber.should.be.a("string").that.equals("06 12425475");
                    done();
                });
        });
    });
    describe("UC-202 Overzicht van gebruikers", () => {
        beforeEach((done) => {
            pool.getConnection(function(err, connection) {
                if (err) throw err; // not connected!
                connection.query(
                    CLEAR_DB + INSERT_USER,
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

        it("TC-202-1 Toon nul gebruikers", (done) => {
            chai
                .request(server)
                .get("/api/user?length=0")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, results } = res.body;
                    status.should.equals(200);
                    results.should.be.an("array").that.has.length(0);
                    done();
                });
        });

        it("TC-202-2 Toon twee gebruikers", (done) => {
            chai
                .request(server)
                .get("/api/user?length=2")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, results } = res.body;
                    status.should.equals(200);
                    results.should.be.an("array").that.has.length(2);
                    done();
                });
        });

        it("TC-202-3 Toon gebruikers met zoekterm op niet-bestaande naam", (done) => {
            chai
                .request(server)
                .get("/api/user?firstName=USERVANANDEREPLANEET")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end(function(err, res) {
                    res.should.be.an("object");
                    const { status, results } = res.body;
                    status.should.equals(200);
                    results.should.be.an("array").that.has.length(0);
                    done();
                });
        });

        it("TC-202-4 Toon gebruikers met gebruik van de zoekterm op het veld isActive=false", (done) => {
            chai
                .request(server)
                .get("/api/user?isActive=false")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end(function(err, res) {
                    res.should.be.an("object");
                    const { status, results } = res.body;
                    status.should.equals(200);
                    results.should.be.an("array").that.has.length(1);
                    done();
                });
        });

        it("TC-202-5 Toon gebruikers met gebruik van de zoekterm op het veld isActive=true", (done) => {
            chai
                .request(server)
                .get("/api/user?isActive=true")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end(function(err, res) {
                    res.should.be.an("object");
                    const { status, results } = res.body;
                    status.should.equals(200);
                    results.should.be.an("array").that.has.length(1);
                    done();
                });
        });
        it("TC-202-6 Toon gebruikers met zoekterm op bestaande naam", (done) => {
            chai
                .request(server)
                .get("/api/user?firstName=Robin")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end(function(err, res) {
                    res.should.be.an("object");
                    const { status, results } = res.body;
                    status.should.equals(200);
                    results.should.be.an("array").that.has.length(0);
                    done();
                });
        });
    });

    describe("UC-203 Gebruikersprofiel opvragen", () => {
        beforeEach((done) => {
            pool.getConnection(function(err, connection) {
                if (err) throw err; // not connected!
                connection.query(
                    CLEAR_DB + INSERT_USER,
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
        it("TC-203-1 Ongeldig token", (done) => {
            chai
                .request(server)
                .get("/api/user/profile")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey) + "wrongBearer")
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { error } = res.body;
                    error.should.be.a("string").that.equals("Not authorized");
                    done();
                });
        });

        it("TC-203-2 Valide token en gebruiker bestaat.", (done) => {
            chai
                .request(server)
                .get("/api/user/profile")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, results } = res.body;
                    status.should.equals(200);
                    results.should.be.an("Object");
                    done();
                });
        });
    });

    describe("UC-204 Details van gebruiker", () => {
        beforeEach((done) => {
            pool.getConnection(function(err, connection) {
                if (err) throw err; // not connected!
                connection.query(
                    CLEAR_DB + INSERT_USER,
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

        it("TC-204-1 Ongeldig token", (done) => {
            chai
                .request(server)
                .get("/api/user/1")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey) + "wrongBearer")
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { error } = res.body;
                    error.should.be.a("string").that.equals("Not authorized");
                    done();
                });
        });

        it("TC-204-2 User does not exist", (done) => {
            chai
                .request(server)
                .get("/api/user/0")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, message } = res.body;
                    status.should.equals(404);
                    message.should.be.a("string").that.equals("User does not exist");
                    done();
                });
        });

        it("TC-204-3 Gebruiker-ID bestaat", (done) => {
            chai
                .request(server)
                .get("/api/user/1")
                .set("authorization", "Bearer " + jwt.sign({ id: 1 }, jwtSecretKey))
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, result } = res.body;
                    status.should.equals(200);
                    result.should.be.an("Object").that.deep.equals(result);
                    done();
                });
        });
    });

    describe("UC-205 Gebruiker wijzigen", () => {
        beforeEach((done) => {
            pool.getConnection(function(err, connection) {
                if (err) throw err; // not connected!
                connection.query(
                    CLEAR_DB + INSERT_USER,
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

        it("TC-205-1 Verplicht veld “emailAdress” ontbreekt", (done) => {
            chai
                .request(server)
                .put("/api/user/1000000")
                .send({
                    firstName: "John",
                    lastName: "Doe",
                    street: "Lovensdijkstraat 61",
                    city: "Breda",
                    isActive: true,
                    // Email adres ontbreekt.
                    password: "secret#dw@#dAwas",
                    phoneNumber: "06 12425475",
                })
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, message } = res.body;
                    status.should.equals(400);
                    message.should.be.a("string").that.equals("Email must be a string");
                    done();
                });
        });

        it("TC-205-3 Niet-valide telefoonnummer", (done) => {
            chai
                .request(server)
                .put("/api/user/1000000")
                .send({
                    firstName: "John",
                    lastName: "Doe",
                    street: "Lovensdijkstraat 61",
                    city: "Breda",
                    isActive: true,
                    emailAdress: "h.doe@server.com",
                    password: "secret#e4!jcu83ew",
                    phoneNumber: "06 1234567",
                })
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, message } = res.body;
                    status.should.equals(400);
                    message.should.be.a("string").that.equals("Invalid phonenumber");
                    done();
                });
        });

        it("TC-205-4 Gebruiker bestaat niet", (done) => {
            chai
                .request(server)
                .put(`/api/user/0`)
                .set("authorization", "Bearer " + jwt.sign({ userId: 2 }, jwtSecretKey))
                .send({
                    firstName: "Sybrand",
                    lastName: "Bos",
                    street: "Lisdodde",
                    city: "Breda",
                    isActive: true,
                    password: "Welkom01!",
                    emailAdress: "sybrandbos@gmail.com",
                    phoneNumber: "0612345678",
                })
                .end((err, res) => {
                    res.should.be.an("object");
                    let { status, message } = res.body;
                    status.should.equals(400);
                    message.should.be
                        .a("string")
                        .that.equals(
                            "User doesn't exists, or not authorized to update the user."
                        );
                    done();
                });
        });

        it("TC-205-5 Niet ingelogd", (done) => {
            chai
                .request(server)
                .put("/api/user/1000000")
                .send({
                    firstName: "John",
                    lastName: "Doe",
                    street: "Lovensdijkstraat 61",
                    city: "Breda",
                    isActive: true,
                    emailAdress: "h.doe@server.com",
                    password: "secret*jdkD9s",
                    phoneNumber: "06 12425475",
                })
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, message } = res.body;
                    status.should.equals(401);
                    message.should.be
                        .a("string")
                        .that.equals("Authorization header missing!");
                    done();
                });
        });

        it("TC-205-6 Gebruiker succesvol gewijzigd", (done) => {
            chai
                .request(server)
                .put("/api/user/1")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .send({
                    firstName: "Klaas",
                    lastName: "Doe",
                    street: "Lovensdijkstraat 61",
                    city: "Breda",
                    isActive: true,
                    emailAdress: "joost@server.com",
                    password: "SECret635f#w2s2",
                    phoneNumber: "06 12425475",
                })
                .end((err, res) => {
                    let { status, result } = res.body;
                    status.should.equals(200);
                    result.should.be.a("Object").that.contains({
                        id: result.id,
                        firstName: "Klaas",
                        lastName: "Doe",
                        street: "Lovensdijkstraat 61",
                        city: "Breda",
                        isActive: true,
                        emailAdress: "joost@server.com",
                        password: "SECret635f#w2s2",
                        phoneNumber: "06 12425475",
                    });
                    done();
                });
        });
    });

    describe("UC-206 Gebruiker verwijderen", () => {
        beforeEach((done) => {
            pool.getConnection(function(err, connection) {
                if (err) throw err; // not connected!
                connection.query(
                    CLEAR_DB + INSERT_USER,
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

        it("TC-206-1 Gebruiker bestaat niet", (done) => {
            chai
                .request(server)
                .delete("/api/user/0")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, message } = res.body;
                    status.should.equals(401);
                    message.should.be.a("string").that.equals("Unauthorized, this is not your account/acount does not exist");
                    done();
                });
        });

        it("TC-206-2 Niet ingelogd", (done) => {
            chai
                .request(server)
                .delete("/api/user/1000000")
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, message } = res.body;
                    status.should.equals(401);
                    message.should.be
                        .a("string")
                        .that.equals("Authorization header missing!");
                    done();
                });
        });

        it("TC-206-3 User is geen eigenaar", (done) => {
            chai
                .request(server)
                .delete("/api/user/4")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, message } = res.body;
                    status.should.equals(401);
                    message.should.be.a("string").that.equals("Unauthorized, this is not your account/acount does not exist");
                    done();
                });
        });

        it("TC-206-4 Gebruiker succesvol verwijderd", (done) => {
            chai
                .request(server)
                .delete("/api/user/1")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, message } = res.body;
                    status.should.equals(200);
                    message.should.be.a("string").that.equals("Deleted");
                    done();
                });
        });
    });
});