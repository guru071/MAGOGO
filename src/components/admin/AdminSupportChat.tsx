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
          <h2 className="text-2xl font-bold">Support Chat</h2>
          <p className="text-slate-500">Provide customer support to marketplace users</p>
        </div>
        <Button onClick={fetchSessions} variant="outline">Refresh</Button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left sidebar: Sessions List */}
        <Card className="w-1/3 flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-slate-50 font-semibold shrink-0">
            Active Conversations ({sessions.length})
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && sessions.length === 0 ? (
              <div className="p-4 text-center text-slate-400">Loading...</div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No active chats</div>
            ) : (
              sessions.map(session => (
                <button
                  key={session.user.id}
                  onClick={() => handleSelectUser(session.user)}
                  className={`w-full text-left p-4 border-b flex items-start gap-3 transition-colors ${selectedUser?.id === session.user.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {session.user.avatar ? <img src={session.user.avatar} alt="avatar" /> : <UserIcon className="h-5 w-5 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium truncate">{session.user.name}</p>
                      {session.hasUnread && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0"></span>}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDistanceToNow(new Date(session.lastMessageAt))} ago</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Right side: Chat Window */}
        <Card className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
          {!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageCircle className="h-12 w-12 mb-4 text-slate-300" />
              <p>Select a conversation to view and reply</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-white flex justify-between items-center shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                    {selectedUser.avatar ? <img src={selectedUser.avatar} alt="avatar" /> : <UserIcon className="h-5 w-5 text-slate-400" />}
                  </div>
                  <div>
                    <h3 className="font-bold">{selectedUser.name}</h3>
                    <p className="text-xs text-slate-500">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">No messages found.</div>
                ) : (
                  messages.map((m, i) => {
                    const isAdminMsg = m.senderId !== selectedUser.id;
                    return (
                      <div key={m.id || i} className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isAdminMsg ? 'bg-[#0066CC] text-white rounded-br-sm' : 'bg-white border text-slate-800 rounded-bl-sm shadow-sm'}`}>
                          {m.content.startsWith('**Ticket:') ? (
                            <div>
                              <p className="font-bold text-xs mb-1 border-b pb-1 mb-2 opacity-80">
                                {m.content.split('\n')[0].replace(/\*\*/g, '')}
                              </p>
                              <p className="whitespace-pre-wrap text-sm">{m.content.split('\n').slice(2).join('\n')}</p>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                          )}
                          <div className={`text-[10px] mt-1 flex justify-end gap-1 ${isAdminMsg ? 'text-white/70' : 'text-slate-400'}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isAdminMsg && m.isRead && <CheckCheck className="h-3 w-3" />}
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
              <div className="p-4 bg-white border-t shrink-0">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your reply to the user..."
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={sending || !input.trim()} className="bg-[#0066CC] hover:bg-[#0055AA]">
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
