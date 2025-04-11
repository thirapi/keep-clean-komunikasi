export interface IPasswordService {
    comparePassword(plainPassword: string, hashedPassword: string): Boolean;
    hashPassword(plainPassword: string): string;
}
