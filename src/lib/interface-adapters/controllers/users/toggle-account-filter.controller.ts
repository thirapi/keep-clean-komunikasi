import { AccountFilterRepository } from "@/lib/infrastructure/repositories/account-filter.repository";
import { RemoteActorRepository } from "@/lib/infrastructure/repositories/remote-actor.repository";
import { ToggleAccountFilterUseCase } from "@/lib/application/use-cases/users/toggle-account-filter.use-case";
import { db } from "@/lib/db";

const accountFilterRepository = new AccountFilterRepository(db);
const remoteActorRepository = new RemoteActorRepository(db);
const toggleAccountFilterUseCase = new ToggleAccountFilterUseCase(accountFilterRepository, remoteActorRepository);

export const toggleAccountFilterController = async (params: {
    userId: string;
    targetId: string;
    isRemote: boolean;
    type: "mute" | "reduce_intensity";
}) => {
    return await toggleAccountFilterUseCase.execute(params);
};

export const getUserFiltersController = async (userId: string) => {
    return await toggleAccountFilterUseCase.getFilters(userId);
};
