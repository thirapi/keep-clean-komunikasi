import { describe, it, expect, vi, beforeEach } from "vitest"
import { SendMessageUseCase } from "../send-message.use-case"
import type { IMessageRepository } from "@/lib/application/repositories/message.repository.interface"
import type { IPusherService } from "@/lib/application/services/pusher.service.interface"
import type { IRoomRepository } from "@/lib/application/repositories/room.repository.interface"
import type { INotifierService } from "@/lib/application/services/discord-notifier.service.interface"
import { MessageRecord } from "@/lib/entities/models/message.model"

describe("SendMessageUseCase", () => {
  const baseMessage: MessageRecord = {
    id: "msg1",
    userId: "user1",
    roomId: "room1",
    content: "Hello",
    attachments: [],
    replyTo: null,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockRepo = {
    createMessage: vi.fn(),
  } as unknown as IMessageRepository

  const mockRoomRepo = {
    getRoomById: vi.fn().mockResolvedValue({ name: "General" }),
    getOtherParticipants: vi.fn().mockResolvedValue([]),
  } as unknown as IRoomRepository

  const mockPusher = {
    trigger: vi.fn(),
    triggerToUsers: vi.fn(),
  } as unknown as IPusherService

  const mockNotifier = {
    sendMessage: vi.fn(),
  } as unknown as INotifierService

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(mockRoomRepo.getRoomById).mockResolvedValue({
      name: "General",
      createdAt: new Date(),
      updatedAt: new Date(),
      participants: [],
      messages: [],
      id: "",
      isDirect: false,
      description: null,
      avatar: "",
      isPublic: false,
      ownerId: null
    })
    vi.mocked(mockRoomRepo.getOtherParticipants).mockResolvedValue([])
    vi.mocked(mockPusher.trigger).mockResolvedValue(undefined as any)
  })

  const createUseCase = () => new SendMessageUseCase(mockRepo, mockRoomRepo, mockPusher, mockNotifier)

  it("should create a message and trigger pusher", async () => {
    const mockMessage = { ...baseMessage, user: { username: "user1" } }
    vi.mocked(mockRepo.createMessage).mockResolvedValue(mockMessage)

    const useCase = createUseCase()
    const result = await useCase.execute("user1", "Hello", "room1")

    expect(mockRepo.createMessage).toHaveBeenCalledWith("user1", "Hello", "room1", undefined, undefined)
    expect(mockPusher.trigger).toHaveBeenCalledWith("chat-room1", "new-message", mockMessage)
    expect(result).toEqual(mockMessage)
  })

  it("should handle message with attachments and replyTo", async () => {
    const attachments = [{ id: "att1", url: "https://example.com/image.jpg", key: "image.jpg", fileType: "image/jpeg", size: 1234, createdAt: new Date(), updatedAt: new Date() }]
    const mockMessage = {
      ...baseMessage,
      user: { username: "user1" },
      attachments,
      replyTo: "reply123",
    }
    vi.mocked(mockRepo.createMessage).mockResolvedValue(mockMessage)

    const useCase = createUseCase()

    const result = await useCase.execute(
      "user1",
      "Hello with image",
      "room1",
      "reply123",
      attachments
    )

    expect(mockRepo.createMessage).toHaveBeenCalledWith("user1", "Hello with image", "room1", "reply123", attachments)
    expect(mockPusher.trigger).toHaveBeenCalledWith("chat-room1", "new-message", mockMessage)
    expect(result).toEqual(mockMessage)
  })

  it("should throw error if messageRepository.createMessage fails", async () => {
    vi.mocked(mockRepo.createMessage).mockRejectedValue(new Error("DB error"))

    const useCase = createUseCase()

    await expect(
      useCase.execute("user1", "fail test", "room1")
    ).rejects.toThrow("DB error")

    expect(mockRepo.createMessage).toHaveBeenCalled()
    expect(mockPusher.trigger).not.toHaveBeenCalled()
  })

  it("should throw error if pusherService.trigger fails", async () => {
    const mockMessage = { ...baseMessage, user: { username: "user1" } }
    vi.mocked(mockRepo.createMessage).mockResolvedValue(mockMessage)
    vi.mocked(mockPusher.trigger).mockRejectedValue(new Error("Pusher error"))

    const useCase = createUseCase()

    await expect(
      useCase.execute("user1", "trigger fail", "room1")
    ).rejects.toThrow("Pusher error")

    expect(mockRepo.createMessage).toHaveBeenCalled()
    expect(mockPusher.trigger).toHaveBeenCalled()
  })

  it("should handle video attachments correctly", async () => {
    const videoAttachments = [{
      id: "vid1",
      url: "https://example.com/video.mp4",
      key: "video.mp4",
      fileType: "video/mp4",
      size: 50 * 1024 * 1024,
      createdAt: new Date(),
      updatedAt: new Date()
    }]
    const mockMessage = {
      ...baseMessage,
      user: { username: "user1" },
      attachments: videoAttachments,
    }
    vi.mocked(mockRepo.createMessage).mockResolvedValue(mockMessage)

    const useCase = createUseCase()

    const result = await useCase.execute(
      "user1",
      "Check out this video",
      "room1",
      undefined,
      videoAttachments
    )

    expect(mockRepo.createMessage).toHaveBeenCalledWith("user1", "Check out this video", "room1", undefined, videoAttachments)
    expect(mockPusher.trigger).toHaveBeenCalledWith("chat-room1", "new-message", mockMessage)
    expect(result.attachments?.[0].fileType).toBe("video/mp4")
    expect(result).toEqual(mockMessage)
  })

  it("should pass through optimisticId if provided", async () => {
    const mockMessage = { ...baseMessage, user: { username: "user1" } }
    vi.mocked(mockRepo.createMessage).mockResolvedValue(mockMessage)
    const optimisticId = "opt-123"

    const useCase = createUseCase()
    const result = await useCase.execute("user1", "Hello", "room1", undefined, undefined, optimisticId)

    const expectedMessage = { ...mockMessage, optimisticId }
    expect(mockPusher.trigger).toHaveBeenCalledWith("chat-room1", "new-message", expectedMessage)
    expect(result.optimisticId).toBe(optimisticId)
  })
})
