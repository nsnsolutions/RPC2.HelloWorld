"use strict";

const RpcExceptions = require("./exceptions");
const util = require("util");

module.exports = function RpcProtocol() { };
module.exports.preload = function RpcProtocolPreload() {

    const seneca = this;
    const act = util.promisify(seneca.act).bind(seneca);

    seneca.decorate("rpc", {
        add: rpcAdd,
        act: rpcActInternal, // should work
        addInternal: rpcAddInternal,
        actInternal: rpcActInternal,
        exception: RpcExceptions,
    });

    return { name: module.exports.name };

    // -------------------------------------------------------------------------

    function rpcAdd() {

        const args = Array.from(arguments);
        const fn = args.pop();

        args.push((request, done) => {
            fn.call(seneca, request)
                .then((result) => toResponse(result))
                .catch((err) => toErrorResponse(err))
                .then((response) => done(null, response));
        });

        seneca.add.apply(seneca, args);
    }

    function rpcAddInternal() {

        const args = Array.from(arguments);
        const fn = args.pop();

        args.push((request, done) => {
            fn.call(seneca, request)
                .then((result) => toResponse(result))
                .catch((err) => toTransparentErrorResponse(err))
                .then((response) => done(null, response));
        });

        seneca.add.apply(seneca, args);
    }

    async function rpcActInternal() {

        const result = await act.apply(seneca, arguments);

        if (result.hasError) {
            const e = RpcExceptions.fromCode(result.code, result.message);
            e.stack = result.stack;
            throw e;
        }

        return result.result;
    }

    async function toResponse(result) {
        return {
            hasError: false,
            result: result,
        };
    }

    async function toTransparentErrorResponse(err) {
        return {
            hasError: true,
            errorName: err.name,
            message: err.message,
            code: err.code,
            stack: err.stack,
        };
    }

    async function toErrorResponse(err) {

        const _err = err instanceof RpcExceptions.RpcError
            ? err
            : new RpcExceptions.InternalError("Unhandled Exception", err);

        logError(_err);

        return {
            hasError: true,
            code: _err.code,
            message: _err.message,
        };
    }

    function logError(err) {
        process.nextTick(() => {
            for (let e = err; e; e = e.inner) {
                seneca.log.error({ msg: e.stack });
            }
        });
    }
};
