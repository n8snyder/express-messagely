"use strict";

const bcrypt = require("bcrypt");
const db = require("../db");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { rows } = require("pg/lib/defaults");

/** User of the site. */
class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at)
        VALUES
          ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]);
    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
        FROM users
        WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];
    if (user !== undefined) {
      if (await bcrypt.compare(password, user.password) === true) {
        return true;
      }
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
        SET last_login_at = CURRENT_TIMESTAMP
        WHERE username = $1`,
      [username]
    )
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
      FROM users`);
    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
        FROM users
        WHERE username = $1`,
      [username]);

    if (!result.rows[0]) throw new NotFoundError(`No such user: ${username}`);

    return result.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(
      `SELECT id, to_username AS to_user, body, sent_at, read_at
        FROM messages
        WHERE from_username = $1`,
      [username]);

    const msgs = results.rows;
    const userCache = {};

    for(let msg of msgs){
      if(!userCache[`${msg.to_user}`]){
        const user = await db.query(
          `SELECT username, first_name, last_name, phone
            FROM users
            WHERE username = $1`,
            [msg.to_user]
        );

        msg.to_user = user.rows[0];
        userCache[`${msg.to_user}`] = user.rows[0];
      }
      else{
        msg.to_user = userCache[`${msg.to_user}`];
      }
    }

    return msgs;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(
      `SELECT id, from_username AS from_user, body, sent_at, read_at
        FROM messages
        WHERE to_username = $1`,
      [username]);

    const msgs = results.rows;
    const userCache = {};

    for(let msg of msgs){
      if(!userCache[`${msg.from_user}`]){
        const user = await db.query(
          `SELECT username, first_name, last_name, phone
            FROM users
            WHERE username = $1`,
            [msg.from_user]
        );

        msg.from_user = user.rows[0];
        userCache[`${msg.from_user}`] = user.rows[0];
      }
      else{
        msg.from_user = userCache[`${msg.from_user}`];
      }
    }

    return msgs;
  }
}


module.exports = User;
