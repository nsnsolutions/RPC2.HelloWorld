"use strict";

const ex = require("../rpc-protocol/exceptions");
const encodingMap = {
    "base64": "base64",
    "ascii": "ascii",
    "utf8": "utf8",
    "utf-8": "utf8",
};

module.exports = function Tokenize() {

    const seneca = this;
    const processLegacyInserts = require("./legacyInserts").bind(seneca);
    const processVFInserts = require("./vfInserts").bind(seneca);
    const processVFShows = require("./vfShows").bind(seneca);
    const processVFTokens = require("./vfTokens").bind(seneca);
    const processVFTokensOldStyle = require("./vfTokensDeprecated").bind(seneca);
    const processLegacyTokens = require("./legacyTokens").bind(seneca);

    seneca.rpc.add({ role: "public", cmd: "tokenize", ver: "v1" }, tokenize_v1);
    seneca.rpc.add({ role: "public", cmd: "tokenizeUrl", ver: "v1" }, tokenizeUrl_v1);

    seneca.rpc.add({ role: "public", cmd: "tokenize", ver: "v2" }, tokenize_v2);
    seneca.rpc.add({ role: "public", cmd: "tokenizeUrl", ver: "v2" }, tokenizeUrl_v2);

    return { name: module.exports.name };

    // -------------------------------------------------------------------------

    async function tokenize_v1(args) {

        /*
         * Fill the tokens in a document using keys in the provided command packet.
         *
         * Arguments:
         *   args.html: string
         *     The HTML document to fill with data.
         *   args.cp: {}
         *     The command packeted used to provide values for the tokens.
         *
         * Optional Arguments:
         *   args.encoding: string
         *     A string indicating how to decode the data stored in HTML.
         */

        const encoding = encodingMap[args.encoding || "base64"];

        if (!args.html) {
            throw new ex.BadRequest("Missing required field 'html'");

        } else if (typeof args.html !== "string") {
            throw new ex.BadRequest("Unexpected type for field 'html'. Expected: string");

        } else if (!args.cp) {
            throw new ex.BadRequest("Missing required field 'cp'");

        } else if (typeof args.cp !== "object") {
            throw new ex.BadRequest("Unexpected type for field 'cp'. Expected: object");

        } else if (!encoding) {
            throw new ex.BadRequest(`Unknown encoding type: ${args.encodinig}`);

        }

        const result = await tokenize(new Buffer(args.html, encoding).toString(), args.cp);

        /* V1 Repr re-dates the RPC Protocal response. */

        return {
            hasError: false,
            result: new Buffer(result.html).toString(encoding),
            message: "Completed",
            encoding: encoding,
            meta: {
                missing: result.missing,
                message: `replaced=${result.metrics.replaced}, inserted=${result.metrics.inserted}, hidden=${result.metrics.hidden}`,
            },
        };
    }

    async function tokenizeUrl_v1(args) {

        /*
         * Fill the tokens in a document reference using keys in the provided command packet.
         *
         * Arguments:
         *   args.url: string
         *     A URL referencing a HTML document to fill with data.
         *   args.cp: {}
         *     The command packet used to provide values for the tokens.
         */

        if (!args.url) {
            throw new ex.BadRequest("Missing required field 'url'");

        } else if (typeof args.url !== "string") {
            throw new ex.BadRequest("Unexpected type for field 'url'. Expected: string");

        } else if (!args.cp) {
            throw new ex.BadRequest("Missing required field 'cp'");

        } else if (typeof args.cp !== "object") {
            throw new ex.BadRequest("Unexpected type for field 'cp'. Expected: object");

        }

        let html;

        try {
            html = await seneca.rpc.actInternal("role:internal,cmd:fetchUrl", { url: args.url });
        } catch (err) {
            throw new ex.BadRequest( `Failed to fetch document from '${args.url}. ${err}`);
        }

        const result = await tokenize(html, args.cp);

        /* V1 Repr re-dates the RPC Protocal response. */

        return {
            hasError: false,
            result: result.html,
            message: "Completed",
            encoding: "utf8",
            meta: {
                missing: result.missing,
                message: `replaced=${result.metrics.replaced}, inserted=${result.metrics.inserted}, hidden=${result.metrics.hidden}`,
            },
        };
    }

    async function tokenize_v2(args) {

        /*
         * Fill the tokens in a document using keys in the provided command packet.
         *
         * Arguments:
         *   args.html: string
         *     The HTML document to fill with data.
         *   args.cp: {}
         *     The command packeted used to provide values for the tokens.
         *
         * Optional Arguments:
         *   args.encoding: string
         *     A string indicating how to decode the data stored in HTML.
         */

        const encoding = encodingMap[args.encoding || "base64"];

        if (!args.html) {
            throw new ex.BadRequest("Missing required field 'html'");

        } else if (typeof args.html !== "string") {
            throw new ex.BadRequest("Unexpected type for field 'html'. Expected: string");

        } else if (!args.cp) {
            throw new ex.BadRequest("Missing required field 'cp'");

        } else if (typeof args.cp !== "object") {
            throw new ex.BadRequest("Unexpected type for field 'cp'. Expected: object");

        } else if (!encoding) {
            throw new ex.BadRequest(`Unknown encoding type: ${args.encodinig}`);

        }

        const result = await tokenize(new Buffer(args.html, encoding).toString(), args.cp);

        return {
            html: new Buffer(result.html).toString(encoding),
            encoding: encoding,
            missing: result.missing,
            message: `replaced=${result.metrics.replaced}, inserted=${result.metrics.inserted}, hidden=${result.metrics.hidden}`,
        };
    }

    async function tokenizeUrl_v2(args) {

        /*
         * Fill the tokens in a document reference using keys in the provided command packet.
         *
         * Arguments:
         *   args.url: string
         *     A URL referencing a HTML document to fill with data.
         *   args.cp: {}
         *     The command packet used to provide values for the tokens.
         */

        if (!args.url) {
            throw new ex.BadRequest("Missing required field 'url'");

        } else if (typeof args.url !== "string") {
            throw new ex.BadRequest("Unexpected type for field 'url'. Expected: string");

        } else if (!args.cp) {
            throw new ex.BadRequest("Missing required field 'cp'");

        } else if (typeof args.cp !== "object") {
            throw new ex.BadRequest("Unexpected type for field 'cp'. Expected: object");

        }
        let html;

        try {
            html = await seneca.rpc.actInternal("role:internal,cmd:fetchUrl", { url: args.url });
        } catch (err) {
            throw new ex.BadRequest( `Failed to fetch document from '${args.url}. ${err}`);
        }

        const result = await tokenize(html, args.cp);

        return {
            html: result.html,
            encoding: "utf8",
            missing: result.missing,
            message: `replaced=${result.metrics.replaced}, inserted=${result.metrics.inserted}, hidden=${result.metrics.hidden}`,
        };
    }

    async function tokenize(html, cp) {

        const missing = [];
        const metrics =  { inserted: 0, hidden: 0, replaced: 0, missing: 0 };

        seneca.log.info({
            msg: "Filling document tokens",
            jobId: cp.jobId || "UNKNOWN",
        });



        html = await processLegacyInserts(html, cp, metrics, missing);
        html = await processVFInserts(html, cp, metrics, missing);
        html = processVFShows(html, cp, metrics, missing);
        html = await processVFTokens(html, cp, metrics, missing);
        html = processVFTokensOldStyle(html, cp, metrics, missing);
        html = processLegacyTokens(html, cp, metrics, missing);

        return { html, missing, metrics };
    }
};
