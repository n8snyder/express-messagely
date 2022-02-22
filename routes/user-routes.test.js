"use strict";

const User = require("../models/user");
const app = require("../app");
const Message = require("../models/message");
const db = require("../db");
const { SECRET_KEY } = require("../config");


const request = require("supertest");
const jwt = require("jsonwebtoken");


//GLOBAL TEST DATA
let user_from = {};
let user_to = {};
let token = {};
let m1 = {};


describe("User Routes Test", function(){
    beforeEach(async function () {
        await db.query("DELETE FROM messages");
        await db.query("DELETE FROM users");

        user_from = await User.register({
          username: "test1",
          password: "password",
          first_name: "Test1",
          last_name: "Testy1",
          phone: "+14155550000",
        });

        user_to = await User.register({
            username: "test2",
            password: "password",
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155550000",
          });

        m1 = await Message.create({
            from_username: "test1",
            to_username: "test2",
            body: "Test message"
        });

        token = jwt.sign({ username: user_from.username }, SECRET_KEY);

      });

    describe("GET /users", function(){
        test("get all users", async function(){

            let response = await request(app)
                .get("/users")
                .send({ _token: token });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({users: [user_from, user_to]});
        });
    });
});
