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
    <div className="page-wrapper center-content">
      <div className="container">
        <div className="row">
          <div className="twelve columns">
            <div className="card">
              <h1 className="hero-title">聊天应用</h1>
              <p className="hero-subtitle">输入房间号开始聊天！</p>
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
                    随机
                  </button>
                </div>
                <button type="submit" className="button-primary u-full-width">
                  进入房间
                </button>
              </form>
            </div>
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
    <div className="page-wrapper main-layout">
      <div className="container">
        <div className="row chat-layout-row">
          <div className="four columns sidebar">
            <div className="sidebar-content">
              <h4 className="gradient-text">聊天应用</h4>
              <p className="sidebar-desc">
                房间： <strong>{room}</strong>
              </p>
              <p className="sidebar-info">
                此聊天室托管在单个 Durable Object 中，运行在单一位置的一台机器的一个进程中。
              </p>
              <button onClick={() => navigate("/")} className="u-full-width button-secondary">
                切换房间
              </button>
            </div>
          </div>
          <div className="eight columns chat-section">
            <div className="messages-container" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="empty-chat">暂无消息。打个招呼吧！</div>
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
                placeholder={`你好 ${name}！输入消息...`}
                autoComplete="off"
              />
              <button type="submit" className="button-primary">
                发送
              </button>
            </form>
          </div>
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
