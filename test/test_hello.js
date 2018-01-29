"use strict";

const assert = require("chai").assert;
const mock = require("mock-require");
const sinon = require("sinon");
const Seneca = require("seneca");

const senecaOpts = { serviceName: "helloworld-unittest" };

describe("Greeting Method", () => {

    before(function () {
        mock("aws-sdk", {
            SSM: function () {
                return {
                    getParameters: () => { },
                };
            },
        });
    });

    beforeEach(function () {
        /* If you need to reset a database mock or stub history */
    });

    it("should responde to health check.", function (done) {

        const seneca = Seneca(senecaOpts)
            .test(done);

        seneca.act("role:seneca,cmd:stats", (err, resp) => {
            assert.isNull(err, err && err.message);
            done();
        });
    });

    it("should say \"Hello, world\"", function (done) {

        const seneca = Seneca(senecaOpts)
            .test(done)
            .use("../src/env", { overrides: { "local.helloworld.prefix": "Hello" } })
            .use("../src/rpc-protocol")
            .use("../src/greet", { defaultName: "world" });

        const params = { /* no params */ };
        const payload = { args: { body: JSON.stringify(params) } };

        seneca.act("role:public,ver:v1,cmd:greet", payload, (err, resp) => {
            assert.isNull(err, err && err.message);
            assert.equal(resp.result, "Hello, world!");
            done();
        });
    });

    it("should say \"Hello, Person!\" if \"Person\" is passed with the request.", function (done) {

        const seneca = Seneca(senecaOpts)
            .test(done)
            .use("../src/env", { overrides: { "local.helloworld.prefix": "Hello" } })
            .use("../src/rpc-protocol")
            .use("../src/greet");

        const params = { name: "Person" };
        const payload = { args: { body: JSON.stringify(params) } };

        seneca.act("role:public,ver:v1,cmd:greet", payload, (err, resp) => {
            assert.isNull(err, err && err.message);
            assert.equal(resp.result, "Hello, Person!");
            done();
        });
    });

    it("should say \"Hola, world!\" if the greeting prefix is set in the config overrides", function (done) {

        const seneca = Seneca(senecaOpts)
            .test(done)
            .use("../src/env", { overrides: { "local.helloworld.prefix": "Hola" } })
            .use("../src/rpc-protocol")
            .use("../src/greet", { defaultName: "world" });

        const params = { /* No Params */ };
        const payload = { args: { body: JSON.stringify(params) } };

        seneca.act("role:public,ver:v1,cmd:greet", payload, (err, resp) => {
            assert.isNull(err, err && err.message);
            assert.equal(resp.result, "Hola, world!");
            done();
        });
    });

    it("should return a 400 error if name is not given as a string.", function (done) {

        const seneca = Seneca(senecaOpts)
            .test(done)
            .use("../src/env", { overrides: { "local.helloworld.prefix": "Hello" } })
            .use("../src/rpc-protocol")
            .use("../src/greet", { defaultName: "world" });

        const params = { name: [] };
        const payload = { args: { body: JSON.stringify(params) } };

        seneca.act("role:public,ver:v1,cmd:greet", payload, (err, resp) => {
            assert.isNull(err, err && err.message);
            assert.isTrue(resp.hasError, "No error returned.");
            assert.equal(resp.code, 400, "Wrong error code returned.");
            done();
        });
    });
});
