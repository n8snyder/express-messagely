"use strict";

const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Router = require("express").Router;
const router = new Router();

/** POST /login: {username, password} => {token} */

router.post("/login", async function (req, res, next) {
  const { username, password } = req.body;
  if (await User.authenticate(username, password)) {
    const token = jwt.sign({ username }, SECRET_KEY);
    return res.send({ token });
  }
  throw new UnauthorizedError();
});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post("/register", async function (req, res, next) {
  const newUser = await User.register(req.body);

  const token = jwt.sign({ username: newUser.username }, SECRET_KEY);
  return res.send({ token });
});

module.exports = router;