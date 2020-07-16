import { User } from './user';

export class SocketMessage {
  type: string;
  message: string;
  sender: number;
  channelId: number
}
