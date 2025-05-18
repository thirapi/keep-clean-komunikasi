import { IPasswordService } from "@/lib/application/services/password.service.interface";
import { compareSync, genSaltSync, hashSync } from "bcrypt-ts";

export class PasswordService implements IPasswordService {
    comparePassword(plainPassword: string, hashedPassword: string): boolean {
        return compareSync(plainPassword, hashedPassword);
    }

    hashPassword(plainPassword: string): string {
        const salt = genSaltSync(10);
        const hash = hashSync(plainPassword, salt);
        return hash;
    }
}
