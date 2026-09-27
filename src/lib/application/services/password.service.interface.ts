export interface IPasswordService {
    comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
    hashPassword(plainPassword: string): Promise<string>;
}
