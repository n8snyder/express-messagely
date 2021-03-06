"use strict";

const Message = require("../models/message");
const { ensureLoggedIn } = require("../middleware/auth");
const read = require("body-parser/lib/read");
const Router = require("express").Router;
const router = new Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", async function (req, res, next) {
  const msg = await Message.get(req.params.id);

  try {
    if (msg.to_user !== res.locals.user.username &&
      msg.from_user !== res.locals.user.username) {
      throw new UnauthorizedError();
    } else {
      return res.send({ message: msg });
    }
  } catch (err) {
    return next(err);
  }

});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function (req, res, next) {
  const { to_username, body } = req.body;
  const msgData = { from_username: res.locals.user.username, to_username, body }
  const newMsg = await Message.create(msgData);
  return res.send({ message: newMsg });
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", async function (req, res, next) {
  let msg = await Message.get(req.params.id);

  try {
    if (msg.to_user !== res.locals.user.username) {
      throw new UnauthorizedError();
    } else {
      msg = await Message.markRead(req.params.id);
      return res.send({ message: { id: msg.id, read_at: msg.read_at } });
    }
  } catch (err) {
    return next(err);
  }
});


module.exports = router;