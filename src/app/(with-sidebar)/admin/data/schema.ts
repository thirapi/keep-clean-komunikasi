import { z } from "zod"

export const userSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  email: z.string().email(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  role: z.enum(["ADMIN", "STAFF"]),
});

export type User = z.infer<typeof userSchema>;

