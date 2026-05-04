import { createRoot } from "react-dom/client";
import { usePartySocket } from "partysocket/react";
import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router";
import { nanoid } from "nanoid";

import { names, type ChatMessage, type Message } from "../shared";

function Home() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/${roomId.trim()}`);
    }
  };

  const handleRandom = () => {
    setRoomId(nanoid(8));
  };

  return (
    <div className="container center-content">
      <div className="row">
        <div className="twelve columns">
          <div className="card">
            <h1>悄悄话聊天室</h1>
            <p>这是我们的小秘密!</p>
            <form onSubmit={handleJoin} className="room-form">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="房间号"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="u-full-width"
                />
                <button
                  type="button"
                  onClick={handleRandom}
                  className="button-secondary"
                >
                  随机生成
                </button>
              </div>
              <button type="submit" className="button-primary u-full-width">
                加入房间
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chat() {
  const [name] = useState(names[Math.floor(Math.random() * names.length)]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { room } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const socket = usePartySocket({
    party: "chat",
    room,
    onMessage: (evt) => {
      const message = JSON.parse(evt.data as string) as Message;
      if (message.type === "add") {
        setMessages((messages) => {
          const foundIndex = messages.findIndex((m) => m.id === message.id);
          if (foundIndex === -1) {
            return [
              ...messages,
              {
                id: message.id,
                content: message.content,
                user: message.user,
                role: message.role,
              },
            ];
          }
          return messages.map((m) =>
            m.id === message.id
              ? {
                  id: message.id,
                  content: message.content,
                  user: message.user,
                  role: message.role,
                }
              : m,
          );
        });
      } else if (message.type === "update") {
        setMessages((messages) =>
          messages.map((m) =>
            m.id === message.id
              ? {
                  id: message.id,
                  content: message.content,
                  user: message.user,
                  role: message.role,
                }
              : m,
          ),
        );
      } else {
        setMessages(message.messages);
      }
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="container main-layout">
      <div className="row">
        <div className="four columns sidebar">
          <div className="sidebar-content">
            <h4>
              <b>悄悄话</b>
            </h4>
            <p className="sidebar-desc">
              房间号: <strong>{room}</strong>
            </p>
            <p className="sidebar-info">
              你一定设了一个特别的房间号吧，那么将会没有人会知道你说了什么，尽情聊天吧！如果想换个地方聊，点击下面的按钮。
            </p>
            <button onClick={() => navigate("/")} className="u-full-width">
              换个地方聊天
            </button>
          </div>
        </div>
        <div className="eight columns chat-section">
          <div className="messages-container" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="empty-chat">还没有消息。说声你好吧！</div>
            )}
            {messages.map((message) => (
              <div key={message.id} className="message-row">
                <span className="user-name">{message.user}</span>
                <span className="message-content">{message.content}</span>
              </div>
            ))}
          </div>
          <form
            className="input-row"
            onSubmit={(e) => {
              e.preventDefault();
              const contentInput = e.currentTarget.elements.namedItem(
                "content",
              ) as HTMLInputElement;
              if (!contentInput.value.trim()) return;

              const chatMessage: ChatMessage = {
                id: nanoid(8),
                content: contentInput.value,
                user: name,
                role: "user",
              };

              setMessages((messages) => [...messages, chatMessage]);

              socket.send(
                JSON.stringify({
                  type: "add",
                  ...chatMessage,
                } satisfies Message),
              );

              contentInput.value = "";
            }}
          >
            <input
              type="text"
              name="content"
              className="u-full-width"
              placeholder={`你好 ${name}! 悄悄告诉他没人会知道的...`}
              autoComplete="off"
            />
            <button type="submit" className="button-primary">
              发送
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/:room" element={<Chat />} />
    </Routes>
  </BrowserRouter>,
);
