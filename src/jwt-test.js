const jwt = require("jsonwebtoken");

const privateKey = "secretstring";

jwt.sign({ foo: "bar" },
    privateKey,
    //   { algorithm: "RS256" },
    function(err, token) {
        console.log(token);
    }
);

module.exports = jwt;