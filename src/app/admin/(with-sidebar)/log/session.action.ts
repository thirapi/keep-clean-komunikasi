"use server";

import { getAllSessionsController } from "@/lib/interface-adapters/controllers/get-all-sessions.controller";
import { getAllActivityLogsController } from "@/lib/interface-adapters/controllers/admin/get-all-activity-logs.controller";

export const getAllSessionsAction = async () => {
  const users = await getAllSessionsController();

  return users;
};

export const getAllActivityLogsAction = async () => {
  return await getAllActivityLogsController();
};
