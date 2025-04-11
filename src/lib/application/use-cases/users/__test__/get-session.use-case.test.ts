import { describe, it, expect, vi } from "vitest"
import { GetUserSessionUseCase } from "../get-session.use-case"
import type { AuthenticationService } from "@/lib/infrastructure/services/authentication.service"

describe("GetUserSessionUseCase", () => {
  it("should return session from authenticationService", async () => {
    const mockSession = { id: "session123", user: { id: "user1" } }

    const mockAuthService = {
      validateSession: vi.fn().mockResolvedValue(mockSession)
    } as unknown as AuthenticationService

    const useCase = new GetUserSessionUseCase(mockAuthService)

    const result = await useCase.execute("session123")

    expect(mockAuthService.validateSession).toHaveBeenCalledWith("session123")
    expect(result).toEqual(mockSession)
  })
})
