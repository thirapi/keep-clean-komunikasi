import "server-only";
import { IPasswordService } from "@/lib/application/services/password.service.interface";
import { hash as bcryptHash, verify as bcryptVerify } from "@node-rs/bcrypt";

const COST = 10;

export class PasswordService implements IPasswordService {
    async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        // @node-rs/bcrypt takes (password, hash) in that order.
        return bcryptVerify(plainPassword, hashedPassword);
    }

    async hashPassword(plainPassword: string): Promise<string> {
        return bcryptHash(plainPassword, COST);
    }
}
