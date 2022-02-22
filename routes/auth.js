"use strict";

const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Router = require("express").Router;
const router = new Router();

/** POST /login: {username, password} => {token} */

router.post("/login", function (req, res, next) {
  const { username, password } = req.body;
  if (User.authenticate(username, password)) {
    console.log("AUTHENTICATED!");
    const token = jwt.sign({ username }, SECRET_KEY);
    return res.send({ token });
  }
  throw new UnauthorizedError();
});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

module.exports = router;