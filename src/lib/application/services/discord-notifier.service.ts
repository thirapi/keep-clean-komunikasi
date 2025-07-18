export interface INotifierService {
  sendMessage(message: string): Promise<void>;
}
