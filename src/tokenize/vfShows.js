"use strict";

const cheerio = require("cheerio");
const lib = require("../lib");

module.exports = function processVFShows(html, cp, metrics) {

    const seneca = this;
    const $ = cheerio.load(html, { decodeEntities: false });
    const foundTokens = $("[vf-show]").toArray();

    if(!foundTokens) {

        seneca.log.debug({
            msg: "Skipping VF Shows: No tokens found.",
            jobId: cp.jobId || "UNKNOWN",
        });

        return html;
    }

    seneca.log.info({
        msg: "Processing VF Shows",
        jobId: cp.jobId || "UNKNOWN",
    });

    for (let item of foundTokens) {

        var elem = $(item),
            tokenName = elem.attr("vf-show"),
            tokenValue = lib.tryGetToken(cp, tokenName);

        if (tokenValue) {
            lib.unhideElement(elem, $);

        } else {
            lib.hideElement(elem, $);

            seneca.log.debug({
                msg: `Element Hidden: ${elem[0].tagName} <= Falsey Token ${tokenName}`,
                jobId: cp.jobId || "UNKNOWN",
            });

            metrics.hidden++;
        }
    }

    seneca.log.debug({
        msg: "Processing VF Shows: complete",
        jobId: cp.jobId || "UNKONWN",
    });

    return $.html();
};
