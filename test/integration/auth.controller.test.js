process.env.DB_DATABASE = process.env.DB_DATABASE || "share-a-meal-testdb";

const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
require("dotenv").config();
const pool = require("../../src/database/dbconnection");

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

describe("Share-a-meal API Tests | Login", () => {
    describe("UC-101 Login", () => {
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

        it("TC-101-1 Verplicht veld ontbreekt", (done) => {
            chai
                .request(server)
                .post("/api/auth/login")
                .send({
                    emailAdress: "Klaas@server.com",
                })
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, message } = res.body;
                    status.should.equals(400);
                    message.should.be
                        .a("string")
                        .that.equals("password must be a string.");
                    done();
                });
        });

        it("TC-101-2 Niet-valide email adres", (done) => {
            chai
                .request(server)
                .post("/api/auth/login")
                .send({
                    emailAdress: "emailvanjoost",
                    password: "secret#f4Dtfeer",
                })
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, message } = res.body;
                    status.should.equals(400);
                    message.should.be.a("string").that.equals("Invalid email");
                    done();
                });
        });

        it("TC-101-3 Niet-valide wachtwoord", (done) => {
            chai
                .request(server)
                .post("/api/auth/login")
                .send({
                    emailAdress: "Klaas@server.com",
                    password: "wachtwoord",
                })
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, message } = res.body;
                    status.should.equals(400);
                    message.should.be.a("string").that.equals("Invalid password");
                    done();
                });
        });

        it("TC-101-4 user does not exist", (done) => {
            chai
                .request(server)
                .post("/api/auth/login")
                .send({
                    emailAdress: "bestaatniet@server.com",
                    password: "wachtwoord32DSF3@$##",
                })
                .end((err, res) => {
                    res.should.be.an("object");
                    let { status, message } = res.body;
                    status.should.equals(404);
                    message.should.be
                        .a("string")
                        .that.equals("User not found or password invalid");
                    done();
                });
        });

        it("TC-101-5 Gebruiker succesvol ingelogd", (done) => {
            chai
                .request(server)
                .post("/api/auth/login")
                .send({
                    emailAdress: "sybrandbos@gmail.com",
                    password: "Welkom01!",
                })
                .end((err, res) => {
                    res.should.be.an("Object");
                    let { status, result } = res.body;
                    status.should.equals(200);
                    result.emailAdress.should.equals("sybrandbos@gmail.com");
                    done();
                });
        });
    });
});