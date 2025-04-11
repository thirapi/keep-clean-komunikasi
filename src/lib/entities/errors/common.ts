export class AuthenticationError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
    }
}

export class UnauthorizedError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
    }
}

export class OperationalError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
    }
}

export class InputParsedError extends Error {
    fields: Record<string, string> | null;

    constructor(
        message: string,
        fields: Record<string, string[]>,
        options?: ErrorOptions
    ) {
        super(message, options);
        this.name = "InputParsedError";
        this.fields = this._extractFirstError(fields);
    }

    _extractFirstError(
        field: Record<string, string[]>
    ): Record<string, string> {
        const extractedErrors: Record<string, string> = {};
        for (const [key, errors] of Object.entries(field)) {
            if (errors.length > 0) {
                extractedErrors[key] = errors[0];
            }
        }
        return extractedErrors;
    }
}
