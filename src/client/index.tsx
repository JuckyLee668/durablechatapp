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
            <h1>Chat App</h1>
            <p>Enter a room number to start chatting!</p>
            <form onSubmit={handleJoin} className="room-form">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Room Number"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="u-full-width"
                />
                <button
                  type="button"
                  onClick={handleRandom}
                  className="button-secondary"
                >
                  Random
                </button>
              </div>
              <button type="submit" className="button-primary u-full-width">
                Join Room
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
              <b>Chat</b>
            </h4>
            <p className="sidebar-desc">
              Room: <strong>{room}</strong>
            </p>
            <p className="sidebar-info">
              This chat room is hosted in a single Durable Object, running in one
              process in one machine in one location.
            </p>
            <button onClick={() => navigate("/")} className="u-full-width">
              Change Room
            </button>
          </div>
        </div>
        <div className="eight columns chat-section">
          <div className="messages-container" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="empty-chat">No messages yet. Say hi!</div>
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
              placeholder={`Hello ${name}! Type a message...`}
              autoComplete="off"
            />
            <button type="submit" className="button-primary">
              Send
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
