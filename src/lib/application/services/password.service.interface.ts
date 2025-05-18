export interface IPasswordService {
    comparePassword(plainPassword: string, hashedPassword: string): boolean;
    hashPassword(plainPassword: string): string;
}
