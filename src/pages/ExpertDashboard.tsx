import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Send, X } from "lucide-react";

interface ChatSession {
  id: string;
  reason: string;
  status: "pending" | "active" | "closed";
  created_at: string;
  user: {
    name: string;
  };
}

interface ChatMessage {
  id: string;
  content: string;
  is_expert: boolean;
  created_at: string;
  sender_id: string;
}

export default function ExpertDashboard() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [expertId, setExpertId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeExpert = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: expert } = await supabase
          .from("experts")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();

        if (expert) {
          setExpertId(expert.id);
          fetchSessions();
        }
      }
    };

    initializeExpert();
  }, []);

  useEffect(() => {
    if (expertId) {
      const subscription = subscribeToSessions();
      return () => {
        subscription?.unsubscribe();
      };
    }
  }, [expertId]);

  useEffect(() => {
    if (selectedSession?.id) {
      fetchMessages();
      const subscription = subscribeToMessages();
      return () => {
        subscription?.unsubscribe();
      };
    }
  }, [selectedSession?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSessions = async () => {
    const { data } = await supabase
      .from("chat_sessions")
      .select(
        `
        *,
        user:user_id (
          name
        )
      `
      )
      .order("created_at", { ascending: false });

    if (data) {
      setSessions(data);
      // Update selected session if it exists in the new data
      if (selectedSession) {
        const updatedSession = data.find((s) => s.id === selectedSession.id);
        if (updatedSession) {
          setSelectedSession(updatedSession);
        }
      }
    }
  };

  const subscribeToSessions = () => {
    return supabase
      .channel("sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_sessions",
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();
  };

  const fetchMessages = async () => {
    if (!selectedSession) return;

    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", selectedSession.id)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const subscribeToMessages = () => {
    if (!selectedSession) return;

    return supabase
      .channel(`messages:${selectedSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${selectedSession.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();
  };

  const acceptSession = async (session: ChatSession) => {
    if (!expertId) return;

    await supabase
      .from("chat_sessions")
      .update({
        expert_id: expertId,
        status: "active",
      })
      .eq("id", session.id);

    setSelectedSession({ ...session, status: "active" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession || !expertId) return;

    const { error } = await supabase.from("chat_messages").insert({
      session_id: selectedSession.id,
      sender_id: expertId,
      is_expert: true,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
    }
  };

  const closeSession = async () => {
    if (!selectedSession) return;

    await supabase
      .from("chat_sessions")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
      })
      .eq("id", selectedSession.id);

    setSelectedSession(null);
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Expert Dashboard
            </h3>
          </div>

          <div className="flex h-[calc(100vh-200px)]">
            {/* Sessions List */}
            <div className="w-1/3 border-r">
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-4">
                  Active Sessions
                </h4>
                <div className="space-y-2">
                  {sessions
                    .filter((s) => s.status !== "closed")
                    .map((session) => (
                      <div
                        key={session.id}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedSession?.id === session.id
                            ? "bg-indigo-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedSession(session)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{session.user?.name}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(session.created_at).toLocaleString()}
                            </p>
                          </div>
                          {session.status === "pending" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {session.reason}
                        </p>
                        {session.status === "pending" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              acceptSession(session);
                            }}
                            className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                          >
                            Accept Session
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Chat Area */}
            {selectedSession ? (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">
                      {selectedSession.user?.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {selectedSession.reason}
                    </p>
                  </div>
                  <button
                    onClick={closeSession}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.is_expert ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.is_expert
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {selectedSession.status === "active" && (
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="inline-flex items-center p-2 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a session to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
