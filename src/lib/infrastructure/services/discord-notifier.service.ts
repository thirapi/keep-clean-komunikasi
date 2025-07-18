import { INotifierService } from "@/lib/application/services/discord-notifier.service";


export class DiscordNotifierService implements INotifierService {
  constructor(private webhookUrl: string) {}

  async sendMessage(message: string): Promise<void> {
    if (!this.webhookUrl) return;

    await fetch(this.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `💬 ${message}` }),
    });
  }
}
