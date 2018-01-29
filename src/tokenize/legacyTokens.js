"use strict";

const lib = require("../lib");

module.exports = function processLegacyTokens(html, cp, metrics, missing) {

    const seneca = this;
    const foundTokens = html.match(/{{[a-zA-Z0-9.\-_]+}}/g);

    if(!foundTokens) {

        seneca.log.debug({
            msg: "Skipping Legacy Tokens: No tokens found.",
            jobId: cp.jobId || "UNKNOWN",
        });

        return html;
    }

    seneca.log.info({
        msg: "Processing Legacy Tokens",
        jobId: cp.jobId || "UNKNOWN",
    });

    for (let item of foundTokens) {

        var oToken = item,
            tokenName = oToken.slice(2, oToken.length - 2),
            tokenValue = lib.tryGetToken(cp, tokenName);

        if (!tokenValue) {

            seneca.log.debug({
                msg: `Token Skipped: ${tokenName} <= MISSING`,
                jobId: cp.jobId || "UNKNOWN",
            });

            missing.push(tokenName);
            metrics.missing++;

            continue;
        }

        html = html.replace(oToken, tokenValue);
        metrics.replaced++;

        seneca.log.debug({
            msg: `Token Replaced: ${tokenName} <= ${tokenValue}`,
            jobId: cp.jobId || "UNKNOWN",
        });
    }

    seneca.log.debug({
        msg: "Processing Legacy Tokens: Complete",
        jobId: cp.jobId || "UNKONWN",
    });

    return html;
};
