"use strict";

const cheerio = require("cheerio");
const lib = require("../lib");

/*
 * This code is depricated and should be removed once the migration from vfvar is complete.
 */

module.exports = function processVFTokensOldStyle(html, cp, metrics, missing) {

    const seneca = this;
    const $ = cheerio.load(html, { decodeEntities: false });
    const foundTokens = $("[vfvar]").toArray();

    if(!foundTokens) {

        seneca.log.debug({
            msg: "Skipping VF Tokens (old style): No tokens found.",
            jobId: cp.jobId || "UNKNOWN",
        });

        return html;
    }

    seneca.log.info({
        msg: "Processing VF Tokens (old style)",
        jobId: cp.jobId || "UNKNOWN",
    });

    for (let item of foundTokens) {

        var elem = $(item);
        var tokenName = elem.attr("vfvar");
        var tokenValue = lib.tryGetToken(cp, tokenName);

        if(lib.isHidden(elem, 0)) {

            seneca.log.debug({
                msg: `Token Skipped: ${tokenName} <= HIDDEN`,
                jobId: cp.jobId || "UNKNOWN",
                token: tokenName,
            });

            continue;

        } else if(tokenValue !== "" && !tokenValue) {

            seneca.log.debug({
                msg: `Token Skipped: ${tokenName} <= MISSING`,
                jobId: cp.jobId || "UNKNOWN",
            });

            missing.push(tokenName);
            metrics.missing++;
            continue;

        } else if(elem.is("img")) {
            elem.attr("src", tokenValue);

        } else if (elem.is("a") && elem.attr("href") && elem.attr("href").startsWith("mailto")) {
            elem.attr("href", "mailto:" + tokenValue);

        } else if (elem.is("a") && elem.attr("href") && elem.attr("href").startsWith("tel")) {
            elem.attr("href", "tel:" + tokenValue);

        } else if (elem.is("a")) {
            elem.attr("href", tokenValue);

        } else {
            elem.text(tokenValue);

        }

        metrics.replaced++;

        seneca.log.debug({
            msg: `Token Replaced: ${tokenName} <= ${tokenValue}`,
            jobId: cp.jobId || "UNKNOWN",
        });
    }

    seneca.log.debug({
        msg: "Processing VF Tokens (old style): complete",
        jobId: cp.jobId || "UNKONWN",
    });

    return $.html();
};
