"use strict";

const Seneca = require("seneca");

const PACKAGE = require("../package.json");
const overrides = require("../environment/overrides.json");

const opts = {
    legacy: { logging: false },
    serviceName: PACKAGE.name,
};

const seneca = Seneca(opts)
    .use("pin")
    .use("env", { overrides })
    .use("logger")
    .use("rpc-protocol")
    .use("dependent")
    .use("greet", { defaultName: "world" } )
    .listen({
        type: "http",
        port: "4000",
        host: "0.0.0.0",
        path: `/${process.env.SERVICE_NAME || PACKAGE.name}`,
        protocol: "http",
        pin: [
            "role:helloworld",
            "role:seneca,cmd:stats",
        ],
    });

seneca.env.get("common.logLevel").then((d) => seneca.setLogLevel(d));
seneca.ready(() => seneca.log.info({ msg: `${PACKAGE.name} ready. GOOD LUCK AND GOOD LOGIC!` }));
