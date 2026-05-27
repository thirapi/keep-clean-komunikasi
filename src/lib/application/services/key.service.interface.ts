export interface KeyPair {
    publicKey: string;
    privateKey: string;
}

export interface IKeyService {
    generateKeyPair(): Promise<KeyPair>;
}
