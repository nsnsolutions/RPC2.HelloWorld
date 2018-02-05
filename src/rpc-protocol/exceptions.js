"use strict";

class RpcError extends Error {
    constructor(message, code, inner) {
        super(message);
        this.code = code;
        this.inner = inner;
    }
}

class BadRequest extends RpcError {
    constructor(message, inner) {
        super(`Bad Request: ${message || "The requested  resource was not found."}`, 400, inner);
    }
}

class Unauthorized extends RpcError {
    constructor(message, inner) {
        super(`Not Authorized: ${message || "You must be authenticiated."}`, 401, inner);
    }
}

class Forbidden extends RpcError {
    constructor(message, inner) {
        super(`Forbidden: ${message || "Insufficient Privileges"}`, 403, inner);
    }
}

class NotFound extends RpcError {
    constructor(message, inner) {
        super(`Not Found: ${message || "Unable to locate the requested resource."}`, 404, inner);
    }
}

class Conflict extends RpcError {
    constructor(message, inner) {
        super(`Conflict: ${message || "The request could not be completed due to a conflict with the current state of the resource."}`,
            409, inner);
    }
}

class InternalError extends RpcError {
    constructor(message, inner) {
        super(`Internal Server Error: ${message || "The server encountered an error and cannot continue."}`,
            500, inner);
    }
}

class NotImplemented extends RpcError {
    constructor(message, inner) {
        super(`Not Implemented: ${message || "The requested function is not implemented."}`,  501, inner);
    }
}

class ServiceUnavailable extends RpcError {
    constructor(message, inner) {
        super(`Service Not Available: ${message || "An external service failed to respond."}`,  503, inner);
    }
}

function fromCode(code, message, inner) {

    switch (code) {

    case 400:
        return new BadRequest(message, inner);

    case 401:
        return new Unauthorized(message, inner);

    case 403:
        return new Forbidden(message, inner);

    case 404:
        return new NotFound(message, inner);

    case 409:
        return new Conflict(message, inner);

    case 500:
        return new InternalError(message, inner);

    case 501:
        return new NotImplemented(message, inner);

    case 503:
        return new ServiceUnavailable(message, inner);

    default:
        return new Error(message);
    }
}

module.exports = {
    RpcError: RpcError,
    BadRequest: BadRequest,
    Unauthorized: Unauthorized,
    Forbidden: Forbidden,
    NotFound: NotFound,
    Conflict: Conflict,
    InternalError: InternalError,
    NotImplemented: NotImplemented,
    ServiceUnavailable: ServiceUnavailable,
    fromCode: fromCode,
};
