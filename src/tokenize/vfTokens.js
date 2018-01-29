"use strict";

const cheerio = require("cheerio");
const entities = require("html-entities");
const util = require("util");
const lib = require("../lib");

module.exports = async function processVFTokens(html, cp, metrics, missing) {
    const seneca = this;
    const jobBucket = await seneca.env.get("token-service.jobBucket");

    const $ = cheerio.load(html, { decodeEntities: false });
    const stage = seneca.env.stage;
    const foundTokens = [ ];

    /*
     * Set/append the text or html, identified in targetType of the node
     */

    $("[vf-var]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "set",
        targetAttr: null,
        targetType: "html",
        tokenName: $(item).attr("vf-var"),
        valueFormat: "%s",
        vfAttr: "vf-html",
    }));

    $("[vf-html]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "set",
        targetAttr: null,
        targetType: "html",
        tokenName: $(item).attr("vf-html"),
        valueFormat: "%s",
        vfAttr: "vf-html",
    }));

    $("[vf-text]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "set",
        targetAttr: null,
        targetType: "text",
        tokenName: $(item).attr("vf-text"),
        valueFormat: "%s",
        vfAttr: "vf-text",
    }));

    /* Global attributes                                              *
        * Set/append the value of the attribute identified in targetAttr */

    $("[vf-title]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "set",
        targetAttr: "title",
        targetType: "attr",
        tokenName: $(item).attr("vf-title"),
        valueFormat: "%s",
        vfAttr: "vf-title",
    }));

    $("[vf-class]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "append",
        targetAttr: "class",
        targetType: "attr",
        tokenName: $(item).attr("vf-class"),
        valueFormat: "%s",
        vfAttr: "vf-class",
    }));

    $("[vf-style]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "append",
        targetAttr: "style",
        targetType: "attr",
        tokenName: $(item).attr("vf-style"),
        valueFormat: "%s",
        vfAttr: "vf-style",
    }));

    /* Specific Tag Attributes                                        *
        * Set/append the value of the attribute identified in targetAttr */

    $("img[vf-src], img[vf-ref]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "set",
        targetAttr: "src",
        targetType: "attr",
        tokenName: $(item).attr("vf-src") || $(item).attr("vf-ref"),
        valueFormat: "%s",
        vfAttr: "vf-src",
    }));

    $("img[vf-alt]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "set",
        targetAttr: "alt",
        targetType: "attr",
        tokenName: $(item).attr("vf-alt"),
        valueFormat: "%s",
        vfAttr: "vf-alt",
    }));

    $("progress[vf-value]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "set",
        targetAttr: "value",
        targetType: "attr",
        tokenName: $(item).attr("vf-value"),
        valueFormat: "%s",
        vfAttr: "vf-value",
    }));

    $("a[vf-href], a[vf-ref]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "set",
        targetAttr: "href",
        targetType: "attr",
        tokenName: $(item).attr("vf-href") || $(item).attr("vf-ref"),
        valueFormat: "%s",
        vfAttr: "vf-href",
    }));

    /* Specials Tokens                                                *
        * Set/append the value of the attribute identified in targetAttr */

    $("a[vf-tel]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "set",
        targetAttr: "href",
        targetType: "attr",
        tokenName: $(item).attr("vf-tel"),
        valueFormat: "tel:%s",
        vfAttr: "vf-tel",
    }));

    $("a[vf-mailto], a[vf-mail]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "set",
        targetAttr: "href",
        targetType: "attr",
        tokenName: $(item).attr("vf-mailto") || $(item).attr("vf-mail"),
        valueFormat: "mailto:%s",
        vfAttr: "vf-mailto",
    }));

    $("a[vf-thumb]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "set",
        targetAttr: "href",
        targetType: "attr",
        tokenName: $(item).attr("vf-thumb"),
        valueFormat: `https://${jobBucket}.s3.amazonaws.com/${stage}/%s/document.thumb`,
        vfAttr: "vf-thumb",
    }));

    $("a[vf-preview]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "set",
        targetAttr: "href",
        targetType: "attr",
        tokenName: $(item).attr("vf-preview"),
        valueFormat: `https://${jobBucket}.s3.amazonaws.com/${stage}/%s/document.preview.1`,
        vfAttr: "vf-preview",
    }));

    $("a[vf-output]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "set",
        targetAttr: "href",
        targetType: "attr",
        tokenName: $(item).attr("vf-output"),
        valueFormat: `https://${jobBucket}.s3.amazonaws.com/${stage}/%s/FinalOutput`,
        vfAttr: "vf-output",
    }));

    $("img[vf-thumb]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "set",
        targetAttr: "src",
        targetType: "attr",
        tokenName: $(item).attr("vf-thumb"),
        valueFormat: `https://${jobBucket}.s3.amazonaws.com/${stage}/%s/document.thumb`,
        vfAttr: "vf-thumb",
    }));

    $("img[vf-preview]").each((_, item) => foundTokens.push({
        elem: $(item),
        strategy: "set",
        targetAttr: "src",
        targetType: "attr",
        tokenName: $(item).attr("vf-preview"),
        valueFormat: `https://${jobBucket}.s3.amazonaws.com/${stage}/%s/document.preview.1`,
        vfAttr: "vf-preview",
    }));

    if(!foundTokens || foundTokens.length === 0) {

        seneca.log.debug({
            msg: "Skipping VF Tokens: No tokens found.",
            jobId: cp.jobId || "UNKNOWN",
        });

        return html;
    }

    seneca.log.info({
        msg: "Processing VF Tokens",
        jobId: cp.jobId || "UNKNOWN",
    });

    for (let m of foundTokens) {

        var elem = m.elem,
            tokenName = m.tokenName,
            valueFormat = m.valueFormat || "%s",
            targetType = m.targetType,
            targetAttr = m.targetAttr,
            strategy = m.strategy,
            tokenValue = lib.tryGetToken(cp, m.tokenName),
            value = util.format(valueFormat, tokenValue);

        // TODO: Add error handing to this. right now if it throws, it
        // will kill the entire job. it should just flag this token as
        // invalid.

        if(m.transform) {
            value = m.transform(value);
        }

        if(lib.isHidden(elem, 0)) {

            seneca.log.debug({
                msg: `Token Skipped: ${tokenName} <= HIDDEN`,
                jobId: cp.jobId || "UNKNOWN",
                token: tokenName,
            });

            continue;

        } else if(!tokenValue) {

            seneca.log.debug({
                msg: `Token Skipped: ${tokenName} <= MISSING`,
                jobId: cp.jobId || "UNKNOWN",
            });

            missing.push(tokenName);
            metrics.missing++;

            continue;

        /* Attributes */
        } else if(targetType === "attr" && strategy === "set") {
            elem.attr(targetAttr, value);

        } else if(targetType === "attr" && strategy === "append") {
            elem.attr(targetAttr, (elem.attr(targetAttr) && elem.attr(targetAttr) + " " || "") + value);

        } else if(targetType === "attr" && strategy === "prefix") {
            elem.attr(targetAttr, value + (elem.attr(targetAttr) && elem.attr(targetAttr) + " " || ""));

        /* Inner HTML */

        } else if(targetType === "html" && strategy === "set") {
            elem.html(value);

        } else if(targetType === "html" && strategy === "append") {
            elem.html((elem.html() || "") + value);

        } else if(targetType === "html" && strategy === "prefix") {
            elem.html(value + (elem.html() || ""));

        /* Inner Text */

        } else if(targetType === "text" && strategy === "set") {
            elem.text(entities.AllHtmlEntities.encode(value));

        } else if(targetType === "text" && strategy === "append") {
            elem.text(entities.AllHtmlEntities.encode((elem.html() || "") + value));

        } else if(targetType === "text" && strategy === "prefix") {
            elem.text(entities.AllHtmlEntities.encode(value + (elem.html() || "")));

        }

        metrics.replaced++;

        seneca.log.debug({
            msg: `Token Replaced: ${tokenName} <= ${tokenValue}`,
            jobId: cp.jobId || "UNKNOWN",
            TargetAttr: targetAttr,
            SourceNode: tokenName,
            Strategy: strategy,
            Transform: m.transform && m.transform.name || "passthru",
        });
    }

    seneca.log.debug({
        msg: "Processing VF Tokens: complete",
        jobId: cp.jobId || "UNKONWN",
    });

    return $.html();
};
