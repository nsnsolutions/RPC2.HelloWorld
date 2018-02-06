"use strict";

var Jsonic = require("jsonic");
var _ = require("lodash");

function Pin() {}

Pin.preload = function () {
    var seneca = this;

    seneca.decorate("pin", api_pin);

    seneca.on("ready", () => {
        seneca.root.emit("pin");
        seneca.root.emit("after-pin");
    });

    return {
        name: "pin",
    };
};

module.exports = Pin;

function api_pin(pattern, pinopts) {
    var thispin = this;
    var so = thispin.options();

    pattern = _.isString(pattern) ? Jsonic(pattern) : pattern;

    var methodkeys = [];
    for (var key in pattern) {
        if (/[*?]/.exec(pattern[key])) {
            methodkeys.push(key);
        }
    }

    function make_pin(pattern) {
        var api = {
            toString: function () {
                return "pin:" + thispin.util.pattern(pattern) + "/" + thispin;
            },
        };

        var calcPin = function () {
            var methods = thispin.private$.actrouter.list(pattern);

            methods.forEach((method) => {
                var mpat = method.match;

                var methodname = "";
                for (var mkI = 0; mkI < methodkeys.length; mkI++) {
                    methodname += ((mkI > 0 ? "_" : "")) + mpat[methodkeys[mkI]];
                }

                api[methodname] = function (args) {
                    var si = this && this.seneca ? this : thispin;
                    var fullargs = _.extend({}, args, mpat);
                    return si.rpc.actInternal(fullargs);
                };

                api[methodname].pattern$ = method.match;
                api[methodname].name$ = methodname;
            });

            if (pinopts && pinopts.include) {
                for (var i = 0; i < pinopts.include.length; i++) {
                    var methodname = pinopts.include[i];
                    if (thispin[methodname]) {
                        api[methodname] = thispin.delegate(thispin, thispin[methodname]);
                    }
                }
            }
        };

        var opts = {};
        _.defaults(opts, pinopts, so.pin);

        if (thispin.private$._isReady || opts.immediate) {
            calcPin();
        } else {
            thispin.once("pin", calcPin);
        }

        return api;
    }

    return make_pin(pattern);
}
