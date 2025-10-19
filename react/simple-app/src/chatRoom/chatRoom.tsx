import {
  useEffect,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { getMockChatService } from "./data";
import ChatList from "./chatList";

export default function chatRoom() {
  const [inputValue, setInputValue] = useState<string>("");
  const [speedValue, setSpeedValue] = useState<number>(200);

  const inputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  const keyUpHandler = (e: KeyboardEvent) => {
    if (e.code !== "Enter") return;
    if (inputValue.trim() === "") {
      return;
    }
    getMockChatService().sendMessage("You", inputValue.trim());
    setInputValue("");
  };
  const setMessageSpeed = (e: ChangeEvent<HTMLInputElement>) => {
    const speed = Number(e.target.value);
    setSpeedValue(speed);
  };
  const speedKeyUpHandler = (e: KeyboardEvent) => {
    if (e.code !== "Enter") return;
    const speed = Number(speedValue);
    getMockChatService().setMessageSpeed(speed);
    setSpeedValue(speed);
  };

  useEffect(() => {
    setSpeedValue(getMockChatService().getChatSpeed());
  }, []);

  return (
    <div className='h-full w-full p-4 flex flex-col gap-2'>
      <ChatList></ChatList>
      <div className='flex flex-none border-2 h-16 p-2 border-zinc-800'>
        <input
          className='h-full w-full'
          type='text'
          placeholder='Enter message to send'
          value={inputValue}
          onChange={inputChange}
          onKeyUp={keyUpHandler}
        ></input>
        <div className='flex flex-row'>
          <span>Message Speed (ms) </span>
          <input
            type='number'
            className='mt-2 w-1/3'
            value={speedValue}
            onChange={setMessageSpeed}
            onKeyUp={speedKeyUpHandler}
          />
        </div>
      </div>
    </div>
  );
}
