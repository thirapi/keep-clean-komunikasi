import { GetAllActivityLogsUseCase } from "@/lib/application/use-cases/activity-logs/get-all-activity-logs.use-case";
import { DrizzleActivityLogRepository } from "@/lib/infrastructure/repositories/activity-log.repository";

const activityLogRepository = new DrizzleActivityLogRepository();
const getAllActivityLogsUseCase = new GetAllActivityLogsUseCase(activityLogRepository);

export const getAllActivityLogsController = async () => {
    return await getAllActivityLogsUseCase.execute();
};
