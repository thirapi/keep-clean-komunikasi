import { SearchUserUseCase } from "@/lib/application/use-cases/users/search-user.use-case";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { db } from "@/lib/db";

const userRepository = new UserRepository(db);
const searchUserUseCase = new SearchUserUseCase(userRepository);

export async function searchUserController(query: string, limit?: number) {
    return await searchUserUseCase.execute(query, limit);
}
