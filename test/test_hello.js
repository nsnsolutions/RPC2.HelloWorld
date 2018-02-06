"use strict";

const assert = require("chai").assert;
const sinon = require("sinon");
const Seneca = require("seneca");

const senecaOpts = { serviceName: "helloworld-unittest" };

describe("Greeting Method", () => {

    before(function () {
        this.envConfig = {
            overrides: {
                "local.common.logLevel": "debug",
                "local.helloworld.prefix": "Hello",
            },
        };
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

    it("should say \"Hello, world\"", function (done) {

        const seneca = Seneca(senecaOpts)
            .test(done)
            .use("../src/pin")
            .use("../src/env", this.envConfig)
            .use("../src/rpc-protocol")
            .use("../src/greet", { defaultName: "world" });

        seneca.act("role:helloworld,ver:v1,cmd:greet", {}, (err, resp) => {
            assert.isNull(err, err && err.message);
            assert.equal(resp.result, "Hello, world!");
            done();
        });
    });

    it("should say \"Hello, Person!\" if \"Person\" is passed with the request.", function (done) {

        const seneca = Seneca(senecaOpts)
            .test(done)
            .use("../src/pin")
            .use("../src/env", this.envConfig)
            .use("../src/rpc-protocol")
            .use("../src/greet", { defaultName: "world" });

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
            .use("../src/pin")
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

    it("should return a 400 error if name is not given as a string.", function (done) {

        const seneca = Seneca(senecaOpts)
            .test(done)
            .use("../src/pin")
            .use("../src/env", this.envConfig)
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
