import { useState, useEffect } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  read: boolean;
  created_at: string;
  sender: {
    username: string;
  };
}

export default function MessagesPage() {
  const { user } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(username)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMessages(data as any);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Messages</h1>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun message pour le moment</p>
          <p className="text-sm text-gray-400 mt-2">
            Commencez à discuter avec votre communauté
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => {
            const isSent = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    isSent
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                      : 'bg-white shadow-lg text-gray-800'
                  }`}
                >
                  {!isSent && (
                    <p className="font-medium text-sm mb-1 text-cyan-600">
                      {message.sender?.username}
                    </p>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isSent ? 'text-cyan-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="fixed bottom-20 left-0 right-0 max-w-lg mx-auto px-4">
        <div className="bg-white rounded-full shadow-xl flex items-center gap-2 p-2">
          <input
            type="text"
            placeholder="Écrivez un message..."
            className="flex-1 px-4 py-2 bg-transparent focus:outline-none"
          />
          <button className="bg-cyan-500 text-white p-3 rounded-full hover:bg-cyan-600 transition">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
