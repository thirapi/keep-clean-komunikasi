import { createVerify } from "crypto";

export class SignatureVerificationService {
    /**
     * Verifies an incoming HTTP Signature
     * @param method HTTP method (e.g., POST)
     * @param url Request URL path (e.g., /api/users/thirafi/inbox)
     * @param headers Request headers
     * @param publicKeyPem The public key of the sender in PEM format
     */
    static async verify(method: string, url: string, headers: Record<string, string>, publicKeyPem: string): Promise<boolean> {
        const signatureHeader = headers["signature"] || headers["Signature"];
        if (!signatureHeader) return false;

        // 1. Parse signature header
        const parts = this.parseSignatureHeader(signatureHeader);
        if (!parts.signature || !parts.headers) return false;

        // 2. Reconstruct the string that was signed
        const headerNames = parts.headers.split(" ");
        const stringToVerify = headerNames.map(name => {
            if (name === "(request-target)") {
                return `(request-target): ${method.toLowerCase()} ${url}`;
            }
            const value = headers[name] || headers[name.toLowerCase()] || headers[name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()];
            return `${name}: ${value}`;
        }).join("\n");

        // 3. Verify using RSA-SHA256
        try {
            const verifier = createVerify("sha256");
            verifier.update(stringToVerify);
            return verifier.verify(publicKeyPem, parts.signature, "base64");
        } catch (err) {
            console.error("Signature verification error:", err);
            return false;
        }
    }

    private static parseSignatureHeader(header: string): Record<string, string> {
        const parts: Record<string, string> = {};
        const pairs = header.split(",");
        for (const pair of pairs) {
            const [key, value] = pair.split("=");
            if (key && value) {
                parts[key.trim()] = value.trim().replace(/"/g, "");
            }
        }
        return parts;
    }

    /**
     * Fetches a remote public key from a keyId URL
     */
    static async fetchRemotePublicKey(keyId: string): Promise<string | null> {
        try {
            const response = await fetch(keyId, {
                headers: {
                    "Accept": "application/activity+json, application/ld+json; profile=\"https://www.w3.org/ns/activitystreams\"",
                    "User-Agent": "Mozilla/5.0 (compatible; Komunikasi/1.0; +https://komunikasi.qzz.io)"
                }
            });

            if (!response.ok) {
                console.error(`[Signature] Failed to fetch remote public key from ${keyId}: ${response.status} ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            
            // The key might be directly in the actor object or a separate Key object
            if (data.publicKey?.publicKeyPem) {
                return data.publicKey.publicKeyPem;
            }
            
            if (data.publicKeyPem) {
                return data.publicKeyPem;
            }

            console.error(`[Signature] No public key found in response from ${keyId}`);
            return null;
        } catch (err) {
            console.error(`[Signature] Exception fetching remote public key from ${keyId}:`, err);
            return null;
        }
    }
}
