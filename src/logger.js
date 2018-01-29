"use strict";

const Pino = require("pino");
const lodash = require("lodash");

module.exports = function Logger() { };
module.exports.preload = function LoggerPreload() {

    const seneca = this;
    const logger = initLogger();

    seneca.decorate("setLogLevel", setLogLevel);

    return { extend: { logger: writeLog } };

    function writeLog(context, payload) {

        /*
         * Do the actual log write.
         */

        logger[payload.level](lodash.omit(payload, "level"));
    }

    function setLogLevel(level) {

        /*
         * normalize the logLevel value and set the new level.
         */

        logger.level = {
            FATAL: "fatal",  fatal: "fatal",
            ERROR: "error",  error: "error",
            ERR: "error",    err: "error",
            WARN: "warn",    warn: "warn",
            WARNING: "warn", warning: "warn",
            INFO: "info",    info: "info",
            DEBUG: "debug",  debug: "debug",
            TRACE: "trace",  trace: "trace",
            CALL: "call",    call: "call",
        }[level] || "info";

    }

    function initLogger() {

        /*
         * Create a new PINO logger.
         */

        var pretty = Pino.pretty({
            levelFirst: true,
            forceColor: true,
        });

        // We could log to a file, or to a syslog or to both.
        // Any stream will do.
        pretty.pipe(process.stdout);

        var logger = Pino({ safe: true }, pretty);

        // At one point this was needed to accomodate seneca startup.
        // logger.addLevel('call',  11);

        return logger;
    }
};
