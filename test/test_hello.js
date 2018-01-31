"use strict";

const assert = require("chai").assert;
const mock = require("mock-require");
const sinon = require("sinon");
const Seneca = require("seneca");

const senecaOpts = { serviceName: "helloworld-unittest" };

describe("Greeting Method", () => {

    before(() => {
        mock("aws-sdk", {
            SSM: function () {
                return {
                    getParameters: () => { },
                };
            },
        });
    });

    beforeEach(() => {
        /* If you need to reset a database mock or stub history */
    });

    it("should responde to health check.", (done) => {

        const seneca = Seneca(senecaOpts)
            .test(done);

        seneca.act("role:seneca,cmd:stats", (err) => {
            assert.isNull(err, err && err.message);
            done();
        });
    });

    it("should say \"Hello, world\"", (done) => {

        const seneca = Seneca(senecaOpts)
            .test(done)
            .use("../src/env", { overrides: { "local.helloworld.prefix": "Hello" } })
            .use("../src/rpc-protocol")
            .use("../src/greet", { defaultName: "world" });

        const params = { /* no params */ };
        const payload = { args: { body: JSON.stringify(params) } };

        seneca.act("role:helloworld,ver:v1,cmd:greet", payload, (err, resp) => {
            assert.isNull(err, err && err.message);
            assert.equal(resp.result, "Hello, world!");
            done();
        });
    });

    it("should say \"Hello, Person!\" if \"Person\" is passed with the request.", (done) => {

        const seneca = Seneca(senecaOpts)
            .test(done)
            .use("../src/env", { overrides: { "local.helloworld.prefix": "Hello" } })
            .use("../src/rpc-protocol")
            .use("../src/greet");

        const params = { name: "Person" };

        seneca.act("role:helloworld,ver:v1,cmd:greet", params, (err, resp) => {
            assert.isNull(err, err && err.message);
            assert.equal(resp.result, "Hello, Person!");
            done();
        });
    });

    it("should say \"Hola, world!\" if the greeting prefix is set in the config overrides", (done) => {

        const seneca = Seneca(senecaOpts)
            .test(done)
            .use("../src/env", { overrides: { "local.helloworld.prefix": "Hola" } })
            .use("../src/rpc-protocol")
            .use("../src/greet", { defaultName: "world" });

        const params = { /* No Params */ };

        seneca.act("role:helloworld,ver:v1,cmd:greet", params, (err, resp) => {
            assert.isNull(err, err && err.message);
            assert.equal(resp.result, "Hola, world!");
            done();
        });
    });

    it("should return a 400 error if name is not given as a string.", (done) => {

        const seneca = Seneca(senecaOpts)
            .test(done)
            .use("../src/env", { overrides: { "local.helloworld.prefix": "Hello" } })
            .use("../src/rpc-protocol")
            .use("../src/greet", { defaultName: "world" });

        const params = { name: [] };

        seneca.act("role:helloworld,ver:v1,cmd:greet", params, (err, resp) => {
            assert.isNull(err, err && err.message);
            assert.isTrue(resp.hasError, "No error returned.");
            assert.equal(resp.code, 400, "Wrong error code returned.");
            done();
        });
    });
});
