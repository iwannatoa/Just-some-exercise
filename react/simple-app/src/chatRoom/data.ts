export interface ChatHistoryItem {
  sender: string;
  message: string;
  timestamp: Date;
  id: string;
}

export type ChatMessageHandler = (
  newMessage: Promise<ChatHistoryItem[]>,
) => void;

const mockRandomMessages = [
  "Deserunt cillum velit quis velit.",
  "Ex fugiat in laborum reprehenderit.",
  "Aliqua officia velit irure minim duis quis nisi id consectetur irure.",
  "Ut proident consectetur nostrud ad velit duis eiusmod aliquip eiusmod sunt magna.",
  "Irure amet incididunt laboris aliquip consequat do dolore in Lorem quis irure deserunt ex.",
  "Velit amet nisi magna nisi.",

  "Ea enim aliqua labore culpa nisi fugiat qui.",
  "Duis aliquip id enim nulla ipsum nostrud adipisicing dolore sunt fugiat ullamco anim exercitation culpa.",
  "Velit in ad ea veniam anim minim.",

  "Magna incididunt velit officia anim ipsum esse duis reprehenderit ad et.",
  "Ipsum fugiat sunt exercitation magna.",
  "Cillum ipsum consectetur adipisicing duis excepteur id laboris commodo mollit consectetur.",
  "Ullamco esse sint ipsum veniam non anim nisi aliquip incididunt minim.",
  "Ex irure consequat id duis sit sunt mollit esse incididunt dolore enim minim.",

  "Irure consectetur ex sint elit exercitation sint quis eiusmod enim velit proident nisi voluptate.",
  "Consectetur pariatur nostrud anim ipsum mollit culpa enim sint quis commodo excepteur.",
  "Incididunt aliqua est nostrud est duis.",
  "Sint labore eiusmod elit est minim est.",
  "Laboris velit non ex ex laborum sit.",

  "Aliquip nulla dolore excepteur occaecat fugiat eu do.",
  "Eiusmod enim aliqua incididunt incididunt magna.",
  "Eiusmod velit fugiat Lorem magna laboris ullamco sunt eu dolore.",
  "Lorem minim ex est dolore esse ex in esse laborum id labore ullamco ex.",
  "Eiusmod officia cupidatat Lorem commodo cillum ex sint consequat.",

  "Et mollit voluptate velit esse anim eiusmod veniam laboris nisi.",
  "Incididunt aliquip voluptate et elit adipisicing nostrud.",
  "Minim do incididunt ut labore in reprehenderit aute.",
  "Cillum tempor officia in sit sit ut laborum tempor dolor ullamco officia labore.",
  "Fugiat cupidatat minim excepteur ea ad elit laboris magna minim culpa anim cillum laborum nisi.",
  "Nostrud ut consequat adipisicing cillum commodo anim cupidatat cillum sint.",

  "Eiusmod amet ea nulla minim voluptate pariatur ipsum consequat eiusmod pariatur nisi sit quis proident.",
  "Qui pariatur cillum sint exercitation cillum.",
  "Aliquip tempor incididunt non ut pariatur commodo cupidatat excepteur consectetur veniam id.",
  "Amet elit reprehenderit ipsum enim ad incididunt anim ipsum sunt laboris.",

  "Incididunt nostrud elit occaecat dolor aliquip.",
  "Ipsum duis voluptate ut exercitation.",
  "Occaecat et consectetur enim labore dolor dolor fugiat sit velit minim incididunt.",
  "Adipisicing consectetur culpa non eiusmod officia tempor sunt ut ut.",

  "Pariatur consequat occaecat est magna laboris.",
  "Anim duis sunt aliquip do culpa amet commodo irure dolore sint magna.",
  "Lorem aliquip et et eiusmod sunt anim officia amet veniam esse in laboris exercitation aliquip.",
  "Deserunt elit minim incididunt proident excepteur fugiat consequat deserunt est ad.",
  "Duis cupidatat irure elit quis.",
  "Velit occaecat incididunt velit occaecat enim.",
  "Tempor ea dolor ex enim anim qui do.",

  "Nisi in sit mollit velit nisi qui mollit quis nulla amet eu magna.",
  "Aliqua do esse nisi ex.",
  "Ut eu nisi qui irure cillum do officia in.",
  "Veniam eiusmod pariatur esse quis aute sint minim veniam id culpa Lorem aute duis.",
  "Eiusmod aliquip nisi quis sunt do.",
];
export class MockChartService {
  chatId: number = 1;
  chatData: ChatHistoryItem[] = [];

  sendDataInterval: any = null;

  chatDataHandlers: Map<symbol, ChatMessageHandler> = new Map();

  sendMessageSpeed = 1000; // milliseconds

  registerGetChatDataHandler(handler: ChatMessageHandler): {
    id: symbol;
    history: ChatHistoryItem[];
  } {
    const id = Symbol("chat-data-sender");
    this.chatDataHandlers.set(id, handler);
    if (this.chatDataHandlers.size === 1) {
      this.startSendingData();
    }
    console.log("current chat data handlers:", this.chatDataHandlers);
    return { id, history: this.chatData.slice(-20) };
  }

  unregisterGetChatDataHandler(id: symbol) {
    this.chatDataHandlers.delete(id);
    if (this.chatDataHandlers.size === 0) {
      this.stopSendingData();
    }
    console.log(
      "unregister chat handle, current chat data handlers:",
      this.chatDataHandlers,
    );
  }

  startSendingData() {
    this.sendDataInterval = setInterval(() => {
      const newMessage: ChatHistoryItem = {
        sender: this.getRandomSender(),
        message:
          mockRandomMessages[
            Math.floor(Math.random() * mockRandomMessages.length)
          ],
        timestamp: new Date(),
        id: (this.chatId++).toString(),
      };
      this.chatData.push(newMessage);
      this.chatDataHandlers.forEach(handler => {
        handler(Promise.resolve([newMessage]));
      });
      this.chatData = this.chatData.slice(-1000);
    }, this.sendMessageSpeed);
  }

  stopSendingData() {
    clearInterval(this.sendDataInterval);
    this.sendDataInterval = null;
  }

  getRandomSender(): string {
    const senders = ["Alice", "Bob", "Charlie", "David", "Eve"];
    return senders[Math.floor(Math.random() * senders.length)];
  }

  sendMessage(sender: string, message: string) {
    const newMessage: ChatHistoryItem = {
      sender,
      message,
      timestamp: new Date(),
      id: (this.chatId++).toString(),
    };
    this.chatData.push(newMessage);
    this.chatDataHandlers.forEach(handler => {
      handler(Promise.resolve([newMessage]));
    });
  }

  setMessageSpeed(speed: number) {
    this.sendMessageSpeed = speed;
    if (this.sendDataInterval) {
      this.stopSendingData();
      this.startSendingData();
    }
  }

  getChatSpeed(): number {
    return this.sendMessageSpeed;
  }
}

let mockChatServiceInstance: MockChartService | null = null;

export const getMockChatService = () => {
  if (!mockChatServiceInstance) {
    mockChatServiceInstance = new MockChartService();
  }
  return mockChatServiceInstance;
};
