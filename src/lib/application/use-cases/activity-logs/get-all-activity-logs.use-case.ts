import { IActivityLogRepository } from "../../repositories/activity-log.repository.interface";

export class GetAllActivityLogsUseCase {
    constructor(private activityLogRepository: IActivityLogRepository) { }

    async execute() {
        return await this.activityLogRepository.findAll();
    }
}
