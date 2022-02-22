"use strict";

const User = require("../models/user");
const app = require("../app");
const Message = require("../models/message");
const db = require("../db");
const { SECRET_KEY } = require("../config");


const request = require("supertest");
const jwt = require("jsonwebtoken");


//GLOBAL TEST DATA
let user1 = {};
let user2 = {};
let token1 = {};
let m1 = {};


describe("User Routes Test", function () {
    beforeEach(async function () {
        await db.query("DELETE FROM messages");
        await db.query("DELETE FROM users");

        user1 = await User.register({
            username: "test1",
            password: "password",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
        });

        user2 = await User.register({
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

        token1 = jwt.sign({ username: user1.username }, SECRET_KEY);

    });

    describe("GET /users", function () {
        test("get all users", async function () {
            let response = await request(app)
                .get("/users")
                .send({ _token: token1 });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({
                users: [
                    {
                        username: user1.username,
                        first_name: user1.first_name,
                        last_name: user1.last_name
                    },
                    {
                        username: user2.username,
                        first_name: user2.first_name,
                        last_name: user2.last_name
                    }
                ]
            });
        });
        test("get all users logged out", async function () {
            let response = await request(app).get("/users");

            expect(response.statusCode).toEqual(401);
        });
    });
    describe("GET /users/:username", function () {
        test("get user details", async function () {
            let response = await request(app)
                .get(`/users/${user1.username}`)
                .send({ _token: token1 });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({
                user: {
                    username: user1.username,
                    first_name: user1.first_name,
                    last_name: user1.last_name,
                    phone: user1.phone,
                    join_at: expect.any(String),
                    last_login_at: expect.any(String)
                }
            });
        })

        test("logged out user", async function () {
            let response = await request(app)
                .get(`/users/${user1.username}`);

            expect(response.statusCode).toEqual(401);
        });

        test("wrong user", async function () {
            token1 = jwt.sign({ username: user2.username }, SECRET_KEY);

            let response = await request(app)
                .get(`/users/${user1.username}`)
                .send({ _token: token1 });

            expect(response.statusCode).toEqual(401);
        });
    });

    describe("GET users/:username/to", function () {
        test("get all messages to other users", async function () {
            token1 = jwt.sign({ username: user2.username }, SECRET_KEY);

            let response = await request(app)
                .get(`/users/${user2.username}/to`)
                .send({ _token: token1 });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({
                messages: [
                    {
                        id: m1.id,
                        from_user: {
                            username: user1.username,
                            first_name: user1.first_name,
                            last_name: user1.last_name,
                            phone: user1.phone
                        },
                        body: m1.body,
                        sent_at: m1.sent_at.toJSON(),
                        read_at: null
                    }
                ]
            });
        });
    });
});

afterAll(async function () {
    await db.end();
});