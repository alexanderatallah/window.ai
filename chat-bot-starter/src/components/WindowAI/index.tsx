import classNames from "classnames";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactTextareaAutosize from "react-textarea-autosize";
import { scrollToBottom } from "../../utils/scrollToBottom";
import { v4 as uuid } from "uuid";

interface Message {
  isUserMessage: boolean;
  text: string;
  id: string;
}

const createMessage = (text: string, isUserMessage: boolean): Message => {
  return {
    isUserMessage,
    text,
    id: uuid(),
  };
};

export default function WindowAI() {
  // ref to track text area and scroll text into view
  const ref = useRef<HTMLParagraphElement | null>(null);

  const handleScroll = useCallback(() => {
    if (ref.current) {
      scrollToBottom(ref.current);
    }
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    handleScroll();
  }, [messages, handleScroll]);

  const [userInput, setUserInput] = useState("");

  const getAgentReply = async (userData: any) => {
    return await window.ai.getCompletion(userData.userText);
  };

  const clearChatHistory = async () => {
    setMessages([]);
  };

  const submit = async () => {
    setMessages((prevMessages) => {
      return [
        ...prevMessages,
        createMessage(userInput, true),
        createMessage("", false),
      ];
    });

    const userText = userInput;
    setUserInput("");
    const response = await getAgentReply({ userText });

    handleScroll();

    setMessages((prevMessages) => {
      return [...prevMessages.slice(0, -1), createMessage(response, false)];
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  const handleClear = async () => {
    setMessages([]);
    clearChatHistory();
  };

  useEffect(() => {
    console.log("messages", messages);
  }, [messages]);

  return (
    <div className="flex flex-grow flex-col justify-between">
      <div className="h-[400px] flex-grow overflow-y-scroll pb-20" ref={ref}>
        {!messages.length && (
          <div className="flex h-full w-full flex-col items-center justify-center space-y-2">
            <div className="text-xl font-semibold">Chat bot starter!</div>
          </div>
        )}
        <ul>
          {messages.map((msg) => {
            return (
              <li key={msg.id} className="py-2">
                {msg.isUserMessage ? (
                  <UserMessage msg={msg} />
                ) : (
                  <BotMessage msg={msg} />
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mx-20 mb-8 flex items-center space-x-2">
        <ReactTextareaAutosize
          maxRows={5}
          onKeyDown={handleKeyDown}
          className={classNames(
            "flex-grow resize-none rounded-md py-2 px-2 text-3xl shadow-xl outline outline-base-300",
            "scroll m-0 box-border resize-none border-none bg-transparent hover:ring-2",
            "min-w-none p max-w-none"
          )}
          onChange={(e) => setUserInput(e.target.value)}
          value={userInput}
        />
        <button
          onClick={() => submit()}
          className={classNames("daisy-btn-primary daisy-btn")}
        >
          Run
        </button>
        <button
          disabled={!messages.length}
          onClick={handleClear}
          className={classNames("daisy-btn")}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export const UserMessage = ({ msg }: { msg: Message }) => {
  return (
    <div className="flex items-center space-x-8 py-10 px-40 text-xl">
      <div className="daisy-placeholder daisy-avatar">
        <div className="daisy-mask daisy-mask-square w-8 bg-primary text-3xl font-black text-accent">
          {""}
        </div>
      </div>
      <p>{msg.text}</p>
    </div>
  );
};

export const BotMessage = ({ msg }: { msg: Message }) => {
  return (
    <div className="flex items-center space-x-8 border-y-2 bg-base-300 py-10 px-40 text-xl">
      <div className="daisy-placeholder daisy-avatar">
        <div className="daisy-mask daisy-mask-square w-8 bg-secondary text-3xl font-black text-accent"></div>
      </div>
      <div className={classNames("rounded-md text-xl text-base-content")}>
        {msg.text?.length ? (
          msg.text.trim()
        ) : (
          <span className="">Loading...</span>
        )}
      </div>
    </div>
  );
};
