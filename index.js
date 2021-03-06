const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT;

const userRoutes = require("./src/routes/user.routes");
const authRoutes = require("./src/routes/auth.routes");
const mealRoutes = require("./src/routes/meal.routes");

const bodyParser = require("body-parser");
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.status(200).json({
        status: 200,
        result: "Hello World!",
    });
});

app.use(userRoutes);
app.use(authRoutes);
app.use(mealRoutes);

app.all("*", (req, res) => {
    res.status(400).json({
        status: 400,
        result: "End-point not found",
    });
});

app.use((err, req, res, next) => {
    res.status(err.status).json({
        status: err.status,
        message: err.message,
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

module.exports = app;