"use strict";

const Seneca = require("seneca");

const PACKAGE = require("../package.json");
const overrides = require("../environment/overrides.json");
const routes = require("../routes.json");

const opts = {
    legacy: { logging: false },
    serviceName: PACKAGE.name,
};

const seneca = Seneca(opts)
    .use("env", { overrides })
    .use("logger")
    .use("rpc-protocol")
    .use("interface", { routes })
    .use("greet", { defaultName: "world" } );

seneca.env.get("common.logLevel").then((d) => {
    seneca.setLogLevel(d);
});
