import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { chatsApi, ChatListItem, ChatMessageDto } from '@/services/chat-service';
import { Search } from 'lucide-react';

export default function HistoricoChatsPage() {
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const cacheRef = useRef<Record<string, ChatMessageDto[]>>({});

  const loadHistory = async (id: string) => {
    if (cacheRef.current[id]) { setMessages(cacheRef.current[id]); return; }
    const data = await chatsApi.history(id, undefined, 100);
    const msgs = data.messages.sort((a,b)=> new Date(a.ts).getTime() - new Date(b.ts).getTime());
    cacheRef.current[id] = msgs;
    setMessages(msgs);
  };

  useEffect(() => { 
    const refresh = async () => {
      const { items } = await chatsApi.list(search, 1, 200);
      setChats(items.sort((a,b)=> new Date(b.lastMessageAt||'').getTime() - new Date(a.lastMessageAt||'').getTime()));
    };
    refresh(); 
  }, [search]);
  useEffect(() => { if (selectedChatId) loadHistory(selectedChatId); }, [selectedChatId]);

  const selectedChat = useMemo(()=> chats.find(c=> c.id===selectedChatId) || null, [selectedChatId, chats]);

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-4 flex flex-col">
        <Card className="overflow-hidden h-[78svh]">
          <CardHeader className="pb-2">
            <CardTitle>Histórico de Chats</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por título/telefone" className="pl-8" />
            </div>
          </CardHeader>
          <CardContent className="h-full p-0">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-2">
                {chats.map(c => (
                  <div key={c.id} className={`p-2 border rounded cursor-pointer ${selectedChatId===c.id?'bg-primary/5 border-primary':''}`} onClick={()=>setSelectedChatId(c.id)}>
                    <div className="text-sm font-medium truncate">{c.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.contactPhoneE164}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.lastMessagePreview}</div>
                    <div className="text-[11px] text-muted-foreground">{c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString('pt-BR') : ''}</div>
                  </div>
                ))}
                {chats.length===0 && <div className="text-sm text-muted-foreground">Nenhum chat encontrado</div>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8 flex flex-col">
        <Card className="h-[78svh]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{selectedChat ? selectedChat.title : 'Selecione um chat'}</CardTitle>
          </CardHeader>
          <CardContent className="h-full p-0">
            <ScrollArea className="h-full px-4 py-2">
              {messages.map(m => (
                <div key={m.id} className={`my-1 flex ${m.direction==='out'?'justify-end':'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] px-3 py-2 rounded-lg ${m.direction==='out'?'bg-primary text-primary-foreground':'bg-muted'}`}>
                    <div className="whitespace-pre-wrap break-words text-sm">{m.text}</div>
                    <div className="flex gap-2 justify-end items-center text-[10px] opacity-70 mt-1">
                      <span>{new Date(m.ts).toLocaleString('pt-BR')}</span>
                      {m.direction==='out' && <span>{m.status}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {selectedChatId && messages.length===0 && (<div className="p-4 text-sm text-muted-foreground">Sem mensagens</div>)}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


