import { IKeyService, KeyPair } from "@/lib/application/services/key.service.interface";
import { generateKeyPair } from "crypto";
import { promisify } from "util";

const generateKeyPairAsync = promisify(generateKeyPair);

export class KeyService implements IKeyService {
    async generateKeyPair(): Promise<KeyPair> {
        const { publicKey, privateKey } = await generateKeyPairAsync("rsa", {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: "spki",
                format: "pem",
            },
            privateKeyEncoding: {
                type: "pkcs8",
                format: "pem",
            },
        });

        return {
            publicKey,
            privateKey,
        };
    }
}
