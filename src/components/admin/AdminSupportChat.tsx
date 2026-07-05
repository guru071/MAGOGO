'use client';
import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, MessageCircle, Send, Check, CheckCheck, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminSupportChat({ token, adminId }: { token: string; adminId?: string }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/chat?token=${token}`);
      const json = await res.json();
      if (json.success) setSessions(json.data);
    } catch (e) {
      toast.error('Failed to load chat sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/chat?userId=${userId}&token=${token}`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data);
        // Mark as read
        await fetch(`/api/admin/chat?token=${token}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        // Update local session state
        setSessions(prev => prev.map(s => s.user.id === userId ? { ...s, hasUnread: false } : s));
      }
    } catch (e) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // Poll for new messages every 10 seconds
    const interval = setInterval(() => {
      fetchSessions();
      if (selectedUser) fetchMessages(selectedUser.id);
    }, 10000);
    return () => clearInterval(interval);
  }, [token, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectUser = (sessionUser: any) => {
    setSelectedUser(sessionUser);
    fetchMessages(sessionUser.id);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || !selectedUser) return;
    
    setSending(true);
    const content = input.trim();
    setInput('');

    // Optimistic UI update
    const tempMsg = {
      id: Date.now().toString(),
      senderId: adminId || 'admin',
      receiverId: selectedUser.id,
      content,
      createdAt: new Date().toISOString(),
      role: 'admin' // virtual role
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch(`/api/admin/chat?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, receiverId: selectedUser.id }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? json.data : m));
      } else {
        toast.error('Failed to send message');
      }
    } catch (e) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-150px)]">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Support Chat</h2>
          <p className="text-white/60">Provide customer support to marketplace users</p>
        </div>
        <Button onClick={fetchSessions} variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white">Refresh</Button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left sidebar: Sessions List */}
        <Card className="glass-panel w-1/3 flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <div className="p-4 border-b border-white/10 bg-black/40 font-bold text-white shrink-0">
            Active Conversations ({sessions.length})
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && sessions.length === 0 ? (
              <div className="p-4 text-center text-white/50 font-medium">Loading...</div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-white/50 font-medium">No active chats</div>
            ) : (
              sessions.map(session => (
                <button
                  key={session.user.id}
                  onClick={() => handleSelectUser(session.user)}
                  className={`w-full text-left p-4 border-b border-white/5 flex items-start gap-3 transition-colors ${selectedUser?.id === session.user.id ? 'bg-neon-blue/10 border-l-4 border-l-neon-blue' : 'hover:bg-white/5'}`}
                >
                  <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden border border-white/20">
                    {session.user.avatar ? <img src={session.user.avatar} alt="avatar" className="w-full h-full object-cover" /> : <UserIcon className="h-5 w-5 text-white/60" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-white truncate">{session.user.name}</p>
                      {session.hasUnread && <span className="h-2.5 w-2.5 rounded-full bg-neon-blue shrink-0 shadow-[0_0_5px_rgba(0,210,255,0.8)]"></span>}
                    </div>
                    <p className="text-xs text-white/60 truncate">{session.user.email}</p>
                    <p className="text-[10px] text-white/40 mt-1 font-medium">{formatDistanceToNow(new Date(session.lastMessageAt))} ago</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Right side: Chat Window */}
        <Card className="glass-panel flex-1 flex flex-col overflow-hidden bg-black/40 shadow-[0_0_20px_rgba(0,0,0,0.3)] border-white/10">
          {!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/50">
              <MessageCircle className="h-12 w-12 mb-4 text-white/20" />
              <p className="font-medium">Select a conversation to view and reply</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 bg-black/30 flex justify-between items-center shrink-0 shadow-sm z-10 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                    {selectedUser.avatar ? <img src={selectedUser.avatar} alt="avatar" className="w-full h-full object-cover" /> : <UserIcon className="h-5 w-5 text-white/60" />}
                  </div>
                  <div>
                    <h3 className="font-black text-white">{selectedUser.name}</h3>
                    <p className="text-xs text-white/60 font-medium">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-white/40 font-medium">No messages found.</div>
                ) : (
                  messages.map((m, i) => {
                    const isAdminMsg = m.senderId !== selectedUser.id;
                    return (
                      <div key={m.id || i} className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isAdminMsg ? 'bg-neon-blue text-black font-medium rounded-br-sm shadow-[0_0_10px_rgba(0,210,255,0.3)]' : 'bg-white/10 border border-white/20 text-white rounded-bl-sm backdrop-blur-md shadow-sm'}`}>
                          {m.content.startsWith('**Ticket:') ? (
                            <div>
                              <p className={`font-bold text-xs mb-1 border-b pb-1 mb-2 ${isAdminMsg ? 'border-black/20' : 'border-white/20'}`}>
                                {m.content.split('\n')[0].replace(/\*\*/g, '')}
                              </p>
                              <p className="whitespace-pre-wrap text-sm">{m.content.split('\n').slice(2).join('\n')}</p>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                          )}
                          <div className={`text-[10px] mt-1 flex justify-end gap-1 font-bold ${isAdminMsg ? 'text-black/60' : 'text-white/40'}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isAdminMsg && m.isRead && <CheckCheck className="h-3 w-3 text-black/80" />}
                            {isAdminMsg && !m.isRead && <Check className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-black/30 border-t border-white/10 shrink-0 backdrop-blur-md">
                <form onSubmit={handleSend} className="flex gap-3">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your reply to the user..."
                    disabled={sending}
                    className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue rounded-xl h-11"
                  />
                  <Button type="submit" disabled={sending || !input.trim()} className="bg-neon-blue hover:bg-neon-blue/80 text-black font-extrabold h-11 px-6 rounded-xl shadow-[0_0_15px_rgba(0,210,255,0.4)]">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="ml-2">Send</span>
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
