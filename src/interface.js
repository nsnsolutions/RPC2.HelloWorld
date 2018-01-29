"use strict";

const Express = require("express");
const SenecaExpressAdapter = require("seneca-web-adapter-express");

module.exports = function HttpInterface(opts) {

    const seneca = this;
    const params = {
        adapter: SenecaExpressAdapter,
        context: Express(),
        routes: opts.routes,
    };

    seneca
        .use("seneca-web", params)
        .ready(() => {
            var server = seneca.export("web/context")();
            server.listen("4000", () =>
                seneca.log.info({ msg: "HTTP Server running. Port: 4000" }));
        });

    return { name: module.exports.name };

};
