"use strict";

const cheerio = require("cheerio");
const lib = require("../lib");
const ex = require("../rpc-protocol/exceptions");

module.exports = async function processVFInserts(html, cp, metrics) {

    const seneca = this;
    const $ = cheerio.load(html, { decodeEntities: false });
    const foundTokens = $("[vf-insert]").toArray();

    if(!foundTokens) {

        seneca.log.debug({
            msg: "Skipping VF Insert: No tokens found.",
            jobId: cp.jobId || "UNKNOWN",
        });

        return html;
    }

    seneca.log.info({
        msg: "Processing VF Inserts",
        jobId: cp.jobId || "UNKNOWN",
    });

    for (let item of foundTokens) {

        var elem = $(item),
            tokenName = elem.attr("vf-insert"),
            tokenValue = lib.tryGetToken(cp, tokenName, [ "", "template" ]);

        if(!tokenValue) {
            throw new ex.BadRequest(`Error processing token insert: ${tokenName}. Details: Missing.`);
        }

        try {
            elem.html(await seneca.rpc.actInternal("role:internal,cmd:fetchUrl", { url: tokenValue }));
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
        msg: "Processing VF Inserts: complete",
        jobId: cp.jobId || "UNKONWN",
    });

    return $.html();
};
