const express = require("express");
let app = express();
let bodyparser = require("body-parser");
const cors = require("cors");
const expressJwt = require('express-jwt');
const dotenv = require("dotenv");

dotenv.config();

// Routes
const userRouts = require("./routes/user");
const audiocallRoutes = require("./routes/audiocall");
const newsfeedRoutes = require("./routes/newsfeed")
const PORT = process.env.PORT || 3000;

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(cors({ 
    origin: "http://localhost:4200",
    credentials: true
}));

app.use("/user", userRouts);
app.use("/audiocall", audiocallRoutes);
app.use("/newsfeed",newsfeedRoutes);

app.use(expressJwt({secret: process.env.JWT_SECRET_KEY}).unless({path: ["/user/register", "/user/login", "/user/request-reset-password", "/user/valid-password-token", "/user/new-password"]}));


app.listen(PORT, () => console.log("Server started at http://localhost:" + PORT));