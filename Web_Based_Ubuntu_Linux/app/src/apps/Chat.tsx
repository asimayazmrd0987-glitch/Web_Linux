// ============================================================
// Chat — Instant messaging with contacts, AI bot, emoji picker
// ============================================================

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  Search, Send, Smile, Circle, Plus, Bot
} from 'lucide-react';

// ---- Types ----
interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  type: 'text';
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  isBot: boolean;
  messages: Message[];
  lastRead?: number;
}

// ---- Emoji Picker ----
const EMOJIS = ['😀','😂','🥰','😎','🤔','👍','👎','❤️','🎉','🔥','👏','😊','🙌','💯','✨','🎵','🌟','💪','🙏','😅','🤗','😴','😋','🤩','😇','🥳','😷','🤯','🥺','😜'];

const EmojiPicker = memo(function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-14 right-4 z-50 p-3 rounded-xl" style={{ background: 'var(--bg-titlebar)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)', width: 240 }}>
      <div className="grid grid-cols-6 gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose(); }}
            className="flex items-center justify-center p-1.5 rounded hover:bg-[var(--bg-hover)] transition-all"
            style={{ fontSize: '20px' }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
});

// ---- AI Bot Responses ----
const BOT_RESPONSES: Record<string, string> = {
  hello: 'Hello there! How can I help you today?',
  hi: 'Hi! I\'m your UbuntuOS Assistant. What can I do for you?',
  hey: 'Hey! Need any help with something?',
  help: 'I can help you with:\n- Opening apps\n- System settings\n- File management\n- General questions\n\nJust let me know what you need!',
  time: `The current time is ${new Date().toLocaleTimeString()}.`,
  date: `Today is ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`,
  weather: 'I can check the weather for you! Open the Weather app for detailed forecasts.',
  joke: 'Why do programmers prefer dark mode? Because light attracts bugs! 🐛',
  thanks: 'You\'re welcome! Let me know if you need anything else.',
  bye: 'Goodbye! Have a great day! 👋',
  default: 'That\'s interesting! Tell me more, or ask me about time, date, weather, or jokes.',
};

const getBotResponse = (input: string): string => {
  const lower = input.toLowerCase().trim();
  for (const [key, response] of Object.entries(BOT_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  return BOT_RESPONSES.default;
};

// ---- Initial Conversations ----
const createInitialConversations = (): Conversation[] => [
  {
    id: 'bot', name: 'OS Assistant', avatar: 'bot', status: 'online', isBot: true,
    messages: [
      { id: '1', senderId: 'bot', content: 'Hello! I\'m your UbuntuOS Assistant. I can help you with various tasks. Try asking me about the time, weather, or just say hello!', timestamp: Date.now() - 3600000, type: 'text' },
    ],
  },
  {
    id: 'alice', name: 'Alice Johnson', avatar: 'AJ', status: 'online', isBot: false,
    messages: [
      { id: '1', senderId: 'alice', content: 'Hey! Are we still on for the meeting tomorrow?', timestamp: Date.now() - 7200000, type: 'text' },
      { id: '2', senderId: 'user', content: 'Yes, definitely! 2pm works for me.', timestamp: Date.now() - 7000000, type: 'text' },
      { id: '3', senderId: 'alice', content: 'Perfect, see you then!', timestamp: Date.now() - 6800000, type: 'text' },
    ],
  },
  {
    id: 'bob', name: 'Bob Smith', avatar: 'BS', status: 'away', isBot: false,
    messages: [
      { id: '1', senderId: 'bob', content: 'The project files are ready for review.', timestamp: Date.now() - 86400000, type: 'text' },
      { id: '2', senderId: 'user', content: 'Great, I\'ll take a look this afternoon.', timestamp: Date.now() - 85000000, type: 'text' },
    ],
  },
  {
    id: 'carol', name: 'Carol White', avatar: 'CW', status: 'offline', isBot: false,
    messages: [
      { id: '1', senderId: 'carol', content: 'Thanks for your help last week!', timestamp: Date.now() - 172800000, type: 'text' },
      { id: '2', senderId: 'user', content: 'No problem at all, happy to help!', timestamp: Date.now() - 170000000, type: 'text' },
    ],
  },
];

// ---- Typing Indicator ----
const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex items-center gap-1 px-4 py-2.5 rounded-2xl" style={{ background: 'var(--bg-titlebar)', borderRadius: '16px 16px 16px 4px' }}>
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-secondary)', animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-secondary)', animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-secondary)', animationDelay: '300ms' }} />
      </div>
    </div>
  );
});

// ---- Helpers ----
const formatTime = (ts: number): string => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDateSeparator = (ts: number): string => {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};

// ---- Main Chat Component ----
export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('ubuntuos_chat');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return createInitialConversations();
  });
  const [activeConvId, setActiveConvId] = useState('bot');
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('ubuntuos_chat', JSON.stringify(conversations));
  }, [conversations]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv.messages, isTyping]);

  const sendMessage = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    const newMessage: Message = {
      id: Math.random().toString(36).slice(2),
      senderId: 'user',
      content: text,
      timestamp: Date.now(),
      type: 'text',
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId ? { ...c, messages: [...c.messages, newMessage] } : c
      )
    );
    setInputText('');

    // Bot response
    if (activeConv?.isBot) {
      setIsTyping(true);
      setTimeout(() => {
        const response: Message = {
          id: Math.random().toString(36).slice(2),
          senderId: 'bot',
          content: getBotResponse(text),
          timestamp: Date.now(),
          type: 'text',
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId ? { ...c, messages: [...c.messages, response] } : c
          )
        );
        setIsTyping(false);
      }, 1000 + Math.random() * 1000);
    } else {
      // Simulate reply from human contacts
      setIsTyping(true);
      setTimeout(() => {
        const responses = [
          'That sounds great!',
          'I agree with you.',
          'Let me think about that.',
          'Interesting point!',
          'Can you tell me more?',
          'Absolutely!',
          'I\'ll get back to you on that.',
        ];
        const response: Message = {
          id: Math.random().toString(36).slice(2),
          senderId: activeConvId,
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: Date.now(),
          type: 'text',
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId ? { ...c, messages: [...c.messages, response] } : c
          )
        );
        setIsTyping(false);
      }, 2000 + Math.random() * 2000);
    }
  }, [inputText, activeConvId, activeConv?.isBot, activeConvId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const addEmoji = (emoji: string) => setInputText((prev) => prev + emoji);

  const createNewChat = (name: string) => {
    const id = Math.random().toString(36).slice(2);
    const newConv: Conversation = {
      id, name, avatar: name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
      status: 'offline', isBot: false, messages: [],
    };
    setConversations((prev) => [...prev, newConv]);
    setActiveConvId(id);
    setShowNewChat(false);
  };

  const filteredConvs = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  activeConv.messages.forEach((msg) => {
    const dateLabel = formatDateSeparator(msg.timestamp);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === dateLabel) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateLabel, messages: [msg] });
    }
  });

  return (
    <div className="flex h-full" style={{ background: 'var(--bg-window)' }}>
      {/* Left Sidebar */}
      <div className="flex flex-col shrink-0" style={{ width: 220, borderRight: '1px solid var(--border-subtle)' }}>
        <div className="p-3 shrink-0">
          <div className="flex items-center gap-2 px-3" style={{ height: 36, borderRadius: 18, background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
            <Search size={14} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations"
              className="flex-1 bg-transparent outline-none"
              style={{ color: 'var(--text-primary)', fontSize: '13px' }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredConvs.map((conv) => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className="flex items-start gap-3 w-full px-3 py-2 text-left transition-all"
                style={{
                  background: conv.id === activeConvId ? 'var(--bg-selected)' : 'transparent',
                }}
              >
                <div className="relative shrink-0">
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 44, height: 44,
                      background: conv.isBot ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                      color: 'white', fontSize: '14px', fontWeight: 600,
                    }}
                  >
                    {conv.isBot ? <Bot size={20} /> : conv.avatar}
                  </div>
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                    style={{
                      background: conv.status === 'online' ? 'var(--accent-success)' : conv.status === 'away' ? 'var(--accent-warning)' : 'var(--text-disabled)',
                      borderColor: 'var(--bg-window)',
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{conv.name}</span>
                    {lastMsg && (
                      <span style={{ fontSize: '10px', color: 'var(--text-disabled)', flexShrink: 0 }}>{formatTime(lastMsg.timestamp)}</span>
                    )}
                  </div>
                  {lastMsg && (
                    <span className="truncate block" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {lastMsg.senderId === 'user' ? 'You: ' : ''}{lastMsg.content}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setShowNewChat(true)}
            className="w-full flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-primary)', color: 'white', fontSize: '13px', fontWeight: 500 }}
          >
            <Plus size={16} /> New Chat
          </button>
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-titlebar)' }}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 36, height: 36,
                background: activeConv.isBot ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                color: 'white', fontSize: '12px', fontWeight: 600,
              }}
            >
              {activeConv.isBot ? <Bot size={18} /> : activeConv.avatar}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{activeConv.name}</div>
              <div className="flex items-center gap-1">
                <Circle size={8} fill={activeConv.status === 'online' ? 'var(--accent-success)' : activeConv.status === 'away' ? 'var(--accent-warning)' : 'var(--text-disabled)'} style={{ color: 'transparent' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {activeConv.status === 'online' ? 'Online' : activeConv.status === 'away' ? 'Away' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 flex flex-col gap-1">
          {groupedMessages.map((group) => (
            <div key={group.date} className="flex flex-col gap-1">
              <div className="flex justify-center my-2">
                <span className="px-3 py-1 rounded-full" style={{ fontSize: '11px', color: 'var(--text-disabled)', background: 'var(--bg-titlebar)' }}>
                  {group.date}
                </span>
              </div>
              {group.messages.map((msg) => {
                const isSent = msg.senderId === 'user';
                return (
                  <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-1`}>
                    <div className="flex flex-col max-w-[70%]">
                      <div
                        className="px-3.5 py-2.5"
                        style={{
                          borderRadius: isSent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isSent ? 'var(--accent-primary)' : 'var(--bg-titlebar)',
                          color: isSent ? 'white' : 'var(--text-primary)',
                          fontSize: '13px',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.content}
                      </div>
                      <span className={`mt-0.5 ${isSent ? 'text-right' : 'text-left'}`} style={{ fontSize: '10px', color: 'var(--text-disabled)', opacity: 0.7 }}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex items-center gap-2 px-3 py-2 shrink-0 relative" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-titlebar)' }}>
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="flex items-center justify-center rounded-full transition-all hover:bg-[var(--bg-hover)]"
            style={{ width: 32, height: 32, flexShrink: 0 }}
          >
            <Smile size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
          {showEmoji && <EmojiPicker onSelect={addEmoji} onClose={() => setShowEmoji(false)} />}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 outline-none"
            style={{
              height: 40, borderRadius: 20, background: 'var(--bg-input)',
              border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim()}
            className="flex items-center justify-center rounded-full transition-all hover:opacity-90"
            style={{
              width: 36, height: 36,
              background: inputText.trim() ? 'var(--accent-primary)' : 'var(--border-default)',
              color: inputText.trim() ? 'white' : 'var(--text-disabled)',
              flexShrink: 0,
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* New Chat Dialog */}
      {showNewChat && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="p-5 rounded-xl" style={{ width: 320, background: 'var(--bg-window)', boxShadow: 'var(--shadow-xl)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>New Conversation</h3>
            <NewChatForm onCreate={createNewChat} onCancel={() => setShowNewChat(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---- New Chat Form ----
function NewChatForm({ onCreate, onCancel }: { onCreate: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Contact name"
        autoFocus
        className="w-full px-3 outline-none"
        style={{ height: 36, borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
      />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg transition-all hover:bg-[var(--bg-hover)]" style={{ fontSize: '13px', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}>Cancel</button>
        <button
          onClick={() => { if (name.trim()) onCreate(name.trim()); }}
          disabled={!name.trim()}
          className="px-4 py-2 rounded-lg transition-all hover:opacity-90"
          style={{ fontSize: '13px', fontWeight: 500, background: 'var(--accent-primary)', color: 'white', opacity: name.trim() ? 1 : 0.5 }}
        >
          Start Chat
        </button>
      </div>
    </div>
  );
}
