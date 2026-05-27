import { createSign } from "crypto";

export interface SignatureOptions {
    keyId: string; // The URL of the actor's public key (e.g., https://domain.com/users/thirafi#main-key)
    privateKey: string;
    method: string;
    target: string; // The path (e.g., /inbox)
    headers: Record<string, string>;
}

export class HttpSignatureService {
    /**
     * Generates an HTTP Signature header for ActivityPub requests
     * Specification: https://tools.ietf.org/html/draft-cavage-http-signatures-12
     */
    static sign(options: SignatureOptions): string {
        const { keyId, privateKey, method, target, headers } = options;
        
        // 1. Create the string to sign
        // The order of headers matters and must match the 'headers' parameter in the signature
        const headerNames = ["(request-target)", ...Object.keys(headers).map(h => h.toLowerCase())];
        const stringToSign = [
            `(request-target): ${method.toLowerCase()} ${target}`,
            ...Object.entries(headers).map(([name, value]) => `${name.toLowerCase()}: ${value}`)
        ].join("\n");

        // 2. Sign the string using RSA-SHA256
        const signer = createSign("sha256");
        signer.update(stringToSign);
        signer.end();
        
        const signature = signer.sign(privateKey, "base64");

        // 3. Build the Signature header
        return `keyId="${keyId}",algorithm="rsa-sha256",headers="${headerNames.join(" ")}",signature="${signature}"`;
    }

    /**
     * Helper to create Digest header for the body
     */
    static createDigest(body: string): string {
        const crypto = require("crypto");
        const hash = crypto.createHash("sha256").update(body).digest("base64");
        return `SHA-256=${hash}`;
    }
}
