import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChatSession {
  id: string;
  reason: string;
  status: 'pending' | 'active' | 'closed';
  expert_id: string | null;
}

interface ChatMessage {
  id: string;
  content: string;
  is_expert: boolean;
  created_at: string;
  sender_id: string;
}

export default function ExpertChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'initial' | 'reason' | 'chat'>('initial');
  const [reason, setReason] = useState('');
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkExistingSession();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentSession?.id) {
      fetchMessages();
      const messagesSubscription = subscribeToMessages();
      const sessionSubscription = subscribeToSessionUpdates();

      return () => {
        messagesSubscription?.unsubscribe();
        sessionSubscription?.unsubscribe();
      };
    }
  }, [currentSession?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkExistingSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'closed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessions && sessions.length > 0) {
      setCurrentSession(sessions[0]);
      setStep('chat');
    }
  };

  const fetchMessages = async () => {
    if (!currentSession) return;

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', currentSession.id)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const subscribeToMessages = () => {
    if (!currentSession) return;

    return supabase
      .channel(`messages:${currentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${currentSession.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();
  };

  const subscribeToSessionUpdates = () => {
    if (!currentSession) return;

    return supabase
      .channel(`session:${currentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${currentSession.id}`,
        },
        (payload) => {
          const updatedSession = payload.new as ChatSession;
          setCurrentSession(updatedSession);
          if (updatedSession.status === 'closed') {
            setCurrentSession(null);
            setMessages([]);
            setStep('initial');
          }
        }
      )
      .subscribe();
  };

  const startSession = async () => {
    if (!reason.trim()) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        reason: reason.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return;
    }

    setCurrentSession(session);
    setStep('chat');
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentSession) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSession.id,
        sender_id: user.id,
        is_expert: false,
        content: newMessage.trim(),
      });

    if (!error) {
      setNewMessage('');
    }
  };

  const closeSession = async () => {
    if (!currentSession) return;

    await supabase
      .from('chat_sessions')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
      })
      .eq('id', currentSession.id);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl w-96 max-h-[600px] flex flex-col">
          <div className="p-4 border-b flex justify-between items-center bg-indigo-600 text-white rounded-t-lg">
            <h3 className="font-medium">Expert Chat</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 min-h-[300px] max-h-[400px]">
            {step === 'initial' && (
              <div className="text-center">
                <p className="mb-4">Connect with our experts for personalized assistance.</p>
                <button
                  onClick={() => setStep('reason')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Start a Session
                </button>
              </div>
            )}

            {step === 'reason' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to discuss?
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={4}
                  placeholder="Describe your question or topic..."
                />
                <button
                  onClick={startSession}
                  disabled={loading || !reason.trim()}
                  className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Creating Session...' : 'Submit'}
                </button>
              </div>
            )}

            {step === 'chat' && (
              <>
                {currentSession?.status === 'pending' ? (
                  <div className="text-center text-gray-600">
                    <p>Waiting for an expert to join...</p>
                    <div className="mt-2 flex justify-center">
                      <div className="animate-bounce">⌛</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.is_expert ? 'justify-start' : 'justify-end'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.is_expert
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </>
            )}
          </div>

          {step === 'chat' && currentSession?.status === 'active' && (
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
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

          {step === 'chat' && currentSession && (
            <div className="p-2 border-t text-center">
              <button
                onClick={closeSession}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Close Session
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-700"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}