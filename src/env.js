"use strict";

const util = require("util");
const AWS = require("aws-sdk");

module.exports = function Environment() {};

module.exports.preload = function EnvironmentPreload(opts) {

    const seneca = this;
    const stage = process.env.SERVICE_ENV || "local";
    const catalog = opts.options.overrides || {};

    /*
     * Check the catalog for any environmental variable overrides and apply them.
     */

    const envPrefix = `${stage}.env.`;
    for (let env in catalog) {
        if (env.startsWith(envPrefix)) {
            process.env[env.substr(envPrefix.length)] = catalog[env];
        }
    }

    /* Initialize AWS SSMClient */

    const ssmClient = new AWS.SSM({ apiVersion: "2014-11-06" });
    const _getParameters = util.promisify(ssmClient.getParameters)
        .bind(ssmClient);

    seneca.decorate("env", {
        get stage() {
            return stage;
        },
        has: has,
        get: get,
        watch: watch,
    });

    return { name: module.exports.name };

    // -------------------------------------------------------------------------

    async function has(path) {
        const fullPath = _getFullPath(path);
        return _has(fullPath);
    }

    async function get(path, def) {
        const fullPath = _getFullPath(path);
        return _get(fullPath, def);
    }

    async function watch(path) {
        throw new Error("Not Implemented", path);
    }

    function _getFullPath(path) {
        return `${stage}.${path}`;
    }

    async function _has(fullPath) {

        if (catalog.hasOwnProperty(fullPath)) {
            return true;
        }

        var ret = await _getParameters({ Names: [ fullPath ] });

        if (ret.Parameters[0]) {
            return true;

        } else {
            return false;

        }
    }

    async function _get(fullPath, def) {

        if (catalog.hasOwnProperty(fullPath)) {
            return catalog[fullPath];
        }

        var ret = await _getParameters({ Names: [ fullPath ] });

        if (ret.Parameters[0]) {

            /*
             * Add the returned value to the catalog so we do not repeat requests for things we
             * already know.
             */

            return catalog[fullPath] = ret.Parameters[0].Value;

        } else {
            return def;

        }
    }
};
