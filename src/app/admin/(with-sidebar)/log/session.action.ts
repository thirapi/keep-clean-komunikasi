"use server";

import { getAllSessionsController } from "@/lib/interface-adapters/controllers/get-all-sessions.controller";

export const getAllSessionsAction = async () => {
  const users = await getAllSessionsController();

  return users;
};
