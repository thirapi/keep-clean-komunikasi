import { describe, it, expect, vi } from "vitest"
import { SendMessageUseCase } from "../send-message.use-case"
import type { IMessageRepository } from "@/lib/application/repositories/message.repository.interface"
import type { IPusherService } from "@/lib/application/services/pusher.service.interface"
import { MessageRecord } from "@/lib/entities/models/message.model"

describe("SendMessageUseCase", () => {
  const baseMessage: MessageRecord = {
    id: "msg1",
    userId: "user1",
    roomId: "room1",
    content: "Hello",
    imageUrl: undefined,
    replyTo: undefined,
    isDeleted: false,
  }

  it("should create a message and trigger pusher", async () => {
    const mockMessage = { ...baseMessage }

    const mockRepo: IMessageRepository = {
      createMessage: vi.fn().mockResolvedValue(mockMessage),
    } as unknown as IMessageRepository

    const mockPusher: IPusherService = {
      trigger: vi.fn().mockResolvedValue(undefined),
    } as unknown as IPusherService

    const useCase = new SendMessageUseCase(mockRepo, mockPusher)
    const result = await useCase.execute("user1", "Hello", "room1")

    expect(mockRepo.createMessage).toHaveBeenCalledWith("user1", "Hello", "room1", undefined, undefined)
    expect(mockPusher.trigger).toHaveBeenCalledWith("chat-room1", "new-message", { message: mockMessage })
    expect(result).toEqual(mockMessage)
  })

  it("should handle message with image and replyTo", async () => {
    const mockMessage = {
      ...baseMessage,
      imageUrl: "https://example.com/image.jpg",
      replyTo: "reply123",
    }

    const mockRepo: IMessageRepository = {
      createMessage: vi.fn().mockResolvedValue(mockMessage),
    } as unknown as IMessageRepository

    const mockPusher: IPusherService = {
      trigger: vi.fn().mockResolvedValue(undefined),
    } as unknown as IPusherService

    const useCase = new SendMessageUseCase(mockRepo, mockPusher)

    const result = await useCase.execute(
      "user1",
      "Hello with image",
      "room1",
      "https://example.com/image.jpg",
      "reply123"
    )

    expect(mockRepo.createMessage).toHaveBeenCalledWith("user1", "Hello with image", "room1", "https://example.com/image.jpg", "reply123")
    expect(mockPusher.trigger).toHaveBeenCalledWith("chat-room1", "new-message", { message: mockMessage })
    expect(result).toEqual(mockMessage)
  })

  it("should throw error if messageRepository.createMessage fails", async () => {
    const mockRepo: IMessageRepository = {
      createMessage: vi.fn().mockRejectedValue(new Error("DB error")),
    } as unknown as IMessageRepository

    const mockPusher: IPusherService = {
      trigger: vi.fn(),
    } as unknown as IPusherService

    const useCase = new SendMessageUseCase(mockRepo, mockPusher)

    await expect(
      useCase.execute("user1", "fail test", "room1")
    ).rejects.toThrow("DB error")

    expect(mockRepo.createMessage).toHaveBeenCalled()
    expect(mockPusher.trigger).not.toHaveBeenCalled()
  })

  it("should throw error if pusherService.trigger fails", async () => {
    const mockMessage = { ...baseMessage }

    const mockRepo: IMessageRepository = {
      createMessage: vi.fn().mockResolvedValue(mockMessage),
    } as unknown as IMessageRepository

    const mockPusher: IPusherService = {
      trigger: vi.fn().mockRejectedValue(new Error("Pusher error")),
    } as unknown as IPusherService

    const useCase = new SendMessageUseCase(mockRepo, mockPusher)

    await expect(
      useCase.execute("user1", "trigger fail", "room1")
    ).rejects.toThrow("Pusher error")

    expect(mockRepo.createMessage).toHaveBeenCalled()
    expect(mockPusher.trigger).toHaveBeenCalled()
  })
})
