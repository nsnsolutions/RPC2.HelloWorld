"use strict";

const lib = require("../lib");
const ex = require("../rpc-protocol/exceptions");

module.exports = async function processLegacyInserts(html, cp, metrics) {

    const seneca = this;
    const foundTokens = html.match(/@@[a-zA-Z0-9.\-_]+@@/g);

    if (!foundTokens) {

        seneca.log.debug({
            msg: "Skipping Legacy Insert: No tokens found.",
            jobId: cp.jobId || "UNKNOWN",
        });

        return html;
    }

    seneca.log.info({
        msg: "Processing Legacy Inserts",
        jobId: cp.jobId || "UNKNOWN",
    });

    for (let item of foundTokens) {

        var oToken = item,
            tokenName = oToken.slice(2, oToken.length - 2),
            tokenValue = lib.tryGetToken(cp, tokenName, [ "", "template" ]);

        if (!tokenValue) {
            throw new ex.BadRequest(`Error processing token insert: ${tokenName}. Details: Missing.`);
        }

        try {
            const body = await seneca.rpc.actInternal("role:internal,cmd:fetchUrl", { url: tokenValue });
            html = html.replace(oToken, body);
            metrics.inserted++;
        } catch (err) {
            throw new ex.BadRequest( `Error processing token insert: ${tokenName}. Details: Failed to fetch content from ${tokenValue}.`, err);
        }

        seneca.log.debug({
            msg: `Token Inserted: ${tokenName} <= ${tokenValue}`,
            jobId: cp.jobId || "UNKNOWN",
        });
    }

    seneca.log.debug({
        msg: "Processing Legacy Inserts: complete",
        jobId: cp.jobId || "UNKONWN",
    });

    return html;
};
