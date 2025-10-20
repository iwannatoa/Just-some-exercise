import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  getMockChatService,
  type ChatHistoryItem,
  type ChatMessageHandler,
} from './data';

export default function chatList(props: { className: string }) {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const chatListRef = useRef<HTMLDivElement>(null);
  const chatMessageHandler = useRef<ChatMessageHandler>(msg => {
    msg.then(newMessages => {
      setChatHistory(prev => [...prev, ...newMessages].slice(-200));
    });
  });
  const handlerId = useRef<symbol>(Symbol(''));
  const isScrolling = useRef<boolean>(false);
  const scrollData = useRef<{
    scrollTop: number;
    scrollHeight: number;
    clientHeight: Number;
    atBottom: boolean;
  }>({ scrollTop: 0, scrollHeight: 0, clientHeight: 0, atBottom: true });
  const scrollTimeout = useRef<number | null>(null);

  const onChatListScroll = () => {
    if (!chatListRef.current) return;
    isScrolling.current = true;
    refreshScrollData();
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = window.setTimeout(() => {
      isScrolling.current = false;
      scrollTimeout.current = null;
    }, 200);
  };
  // some web browser may not support onscrollend
  const onChatListScrollEnd = () => {
    isScrolling.current = false;
    console.log('Chat list scrolled ended.');
  };
  const refreshScrollData = () => {
    if (!chatListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatListRef.current;
    scrollData.current.scrollTop = scrollTop;
    scrollData.current.scrollHeight = scrollHeight;
    scrollData.current.clientHeight = clientHeight;
    if (scrollTop + clientHeight >= scrollHeight) {
      scrollData.current.atBottom = true;
    } else {
      scrollData.current.atBottom = false;
    }
    // We don't need to calculate the child position in this situation
  };

  useEffect(() => {
    const data = getMockChatService().registerGetChatDataHandler(
      chatMessageHandler.current,
    );
    handlerId.current = data.id;
    console.log('Initial chat history:', data);
    setChatHistory(data.history);
    refreshScrollData();
    return () => {
      getMockChatService().unregisterGetChatDataHandler(handlerId.current);
    };
  }, []);

  useLayoutEffect(() => {
    // execute before render
    if (chatListRef.current) {
      if (!isScrolling.current && scrollData.current.atBottom) {
        // chatListRef.current.scrollTop =
        // chatListRef.current.scrollHeight - chatListRef.current.clientHeight;
        const children = chatListRef.current.children;
        const len = children.length;
        if (len === 0) return;
        const lastEl = children[len - 1];
        lastEl.scrollIntoView({
          block: 'end',
          inline: 'nearest',
          behavior: 'smooth',
        });
      }
    }

    return () => {
      // execute after render
    };
  }, [chatHistory]);

  return (
    <div
      ref={chatListRef}
      onScroll={onChatListScroll}
      // onScrollEnd={onChatListScrollEnd}
      className={props.className}
    >
      {chatHistory.map(item => (
        <div key={item.id} className='p-2 border-b border-zinc-700'>
          <div>
            <span className='font-bold'>{item.sender}</span>
            <span className='ml-2 text-zinc-500 text-sm'>
              {item.timestamp.toLocaleTimeString()}
            </span>
            <span className='ml-2 text-zinc-500 text-sm float-right right-0'>
              ID: {item.id}
            </span>
          </div>
          <div className='mt-1'>{item.message}</div>
        </div>
      ))}
    </div>
  );
}
