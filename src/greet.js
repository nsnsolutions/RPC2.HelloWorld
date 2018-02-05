"use strict";

const ex = require("./rpc-protocol/exceptions");

module.exports = function GreetPlugin(opts) {

    const seneca = this;
    let prefix;

    seneca.rpc.add("role:helloworld,ver:v1,cmd:greet", greet_v1);

    seneca.add({ init: module.exports.name }, (args, done) => {
        init()
            .then(() => done())
            .catch((err) => done(err));
    });

    seneca.sub("role:seneca,cmd:close,closing$:true", shutdown);

    return { name: module.exports.name };

    // ------------------------------------------------------------------------

    async function init() {
        prefix = await seneca.env.get("helloworld.prefix", "Hello");
        seneca.log.info({ msg: `Using prefix: ${prefix}` });
    }

    async function shutdown() { }

    async function greet_v1(args) {

        /*
         * Prefix is set in init(). It is a configuration variable pulled from AWS Parameter Store
         * args.name is given by the caller - it is the user provided data.
         * opts.defaultName is a plugin level configuration parameter passed to the plugin on load.
         */

        if (args.name && typeof args.name !== "string") {
            throw new ex.BadRequest("Wrong type of data for \"name\"");

        }

        const result = `${prefix}, ${args.name || opts.defaultName}!`;
        seneca.log.info({ msg: "Handling Request.", result });
        return result;
    }
};
