    
'use client';
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft,
  Search,
  Plus,
  Send,
  Loader2,
  MessageSquare,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useRouter,  useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";


type User = {
  id: string;
  full_name: string;
  avatar_url: string;
};

// This type matches the structure returned by the Supabase RPC function
type RpcConversation = {
  id:string;
  participant_one: string;
  participant_two: string;
  last_message_content: string | null;
  last_message_created_at: string | null;
  status: 'pending' | 'accepted' | 'blocked';
  requester_id: string;
};

type Conversation = {
  id: string;
  other_participant: User;
  last_message: {
    content: string;
    created_at: string;
  } | null;
  status: 'pending' | 'accepted' | 'blocked';
  requester_id: string;
};


export const Chat = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Set active conversation from URL on initial load
  useEffect(() => {
    const conversationIdFromParams = searchParams?.get('conversationId');
    if (conversationIdFromParams) {
        setActiveConversationId(conversationIdFromParams);
    }
  }, [searchParams]);

  // Fetch user and their conversations
  useEffect(() => {
    const fetchUserAndConversations = async () => {
      setLoading(true);
  
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        setLoading(false);
        return;
      }
      setCurrentUser(user);
  
      // Fetch all conversations and their last message using the RPC function
      const { data: convosData, error: rpcError } = await supabase.rpc('get_conversations_with_last_message', {
          p_user_id_param: user.id
      });

      if (rpcError) {
          console.error('Error fetching conversations via RPC:', rpcError);
          toast.error("Failed to load chats.", { description: rpcError.message });
          setConversations([]);
          setLoading(false);
          return;
      }
      
      if (!convosData || convosData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const participantIds = Array.from(new Set(convosData.flatMap((convo: RpcConversation) => 
          [convo.participant_one, convo.participant_two].filter(id => id !== user.id)
      )));
      
      if (participantIds.length === 0) {
        const validConvos = convosData.filter((c: RpcConversation) => c.participant_one !== c.participant_two);
        if(validConvos.length === 0) {
            setConversations([]);
            setLoading(false);
            return;
        }
      }
      
      const { data: profiles, error: profilesError } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .in('id', participantIds);

      if (profilesError) {
        console.error('Error fetching participant profiles:', profilesError);
        toast.error("Failed to load participant details.", { description: profilesError.message });
        setConversations([]);
        setLoading(false);
        return;
      }
      
      if (!profiles) {
        setConversations([]);
        setLoading(false);
        return;
      }
      
      const profilesMap = new Map(profiles.map(p => [p.id, p]));

      const formattedConversations = convosData.map((convo: RpcConversation) => {
        const otherParticipantId = convo.participant_one === user.id ? convo.participant_two : convo.participant_one;
        const otherParticipant = profilesMap.get(otherParticipantId);
        if (!otherParticipant) return null;

        return {
          id: convo.id,
          other_participant: otherParticipant,
          last_message: (convo.last_message_content && convo.last_message_created_at) ? {
            content: convo.last_message_content,
            created_at: convo.last_message_created_at,
          } : null,
          status: convo.status,
          requester_id: convo.requester_id,
        }
      }).filter(Boolean);
      setConversations(formattedConversations as Conversation[]);
      setLoading(false);
    };
  
    fetchUserAndConversations();
  }, [supabase, router]);

  // Realtime subscription for conversation list updates
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel('public-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (payload) => {
          router.refresh();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const newMsg = payload.new;
          setConversations(currentConvos => {
              const convoIndex = currentConvos.findIndex(c => c.id === newMsg.conversation_id);
              if (convoIndex === -1) return currentConvos;

              const updatedConvo = { ...currentConvos[convoIndex] };
              updatedConvo.last_message = {
                  content: newMsg.content,
                  created_at: newMsg.created_at
              };
              
              const newConvos = [...currentConvos];
              newConvos.splice(convoIndex, 1);
              newConvos.unshift(updatedConvo);
              
              return newConvos;
          })
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [supabase, router, currentUser]);

  const handleCreateNewChat = () => {
    router.push('/discover');
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    router.push(`/chat?conversationId=${conversationId}`, { scroll: false });
  };
  
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  
  return (
    <div className="grid h-full md:grid-cols-[350px_1fr]">
      {/* Sidebar for Conversation List */}
      <aside className={cn(
        "col-span-1 flex flex-col border-r bg-background h-screen",
        activeConversationId ? "hidden md:flex" : "flex"
      )}>
          <header className="border-b p-4">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <h1 className="text-xl font-semibold">Chats</h1>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleCreateNewChat}>
                      <Plus className="w-5 h-5"/>
                  </Button>
              </div>
              <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4"/>
                  <Input placeholder="Search chats..." className="pl-10 bg-muted"/>
              </div>
          </header>

          <ScrollArea className="flex-1">
              <nav className="p-2 space-y-1">
                  {loading ? (
                      <div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div>
                  ) : conversations.length > 0 ? (
                      conversations.map(convo => {
                          const otherUser = convo.other_participant;
                          if (!otherUser) return null;
                          const lastMessage = convo.last_message;
                          const isRequest = convo.status === 'pending' && convo.requester_id !== currentUser?.id;

                          return (
                              <button key={convo.id} onClick={() => handleSelectConversation(convo.id)}
                                      className={cn('w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                                        activeConversationId === convo.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                      )}>
                                  <Avatar>
                                      <AvatarImage src={otherUser.avatar_url}/>
                                      <AvatarFallback>{otherUser.full_name?.[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <h3 className="font-semibold truncate">{otherUser.full_name}</h3>
                                        {isRequest && <Badge variant="default" className="text-xs shrink-0">Request</Badge>}
                                      </div>
                                      <p className="text-sm text-muted-foreground truncate">{lastMessage?.content || 'No messages yet'}</p>
                                  </div>
                                  {lastMessage && <p className="text-xs text-muted-foreground shrink-0">{new Date(lastMessage.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>}
                              </button>
                          );
                      })
                  ) : (
                    <div className="text-center text-muted-foreground p-8">
                        <p>No conversations yet.</p>
                        <p className="text-sm">Find teammates on the Discover page to start chatting.</p>
                    </div>
                  )}
              </nav>
          </ScrollArea>
      </aside>

      {/* Main Chat Area */}
      <main className={cn(
        "col-span-1 flex flex-col bg-muted/40 h-screen",
         activeConversationId ? "flex" : "hidden md:flex"
      )}>
          {activeConversation && currentUser ? (
              <ActiveChatView
                key={activeConversationId}
                initialConversation={activeConversation}
                currentUser={currentUser}
                onBack={() => {
                  setActiveConversationId(null)
                  router.push('/chat', {scroll: false});
                }}
              />
          ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-4 hidden md:flex">
                  <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-4"/>
                  <h2 className="text-2xl font-semibold">Select a conversation</h2>
                  <p className="text-muted-foreground max-w-sm mt-2">Choose from your existing conversations or start a new one from the Discover page.</p>
               </div>
          )}
      </main>
    </div>
  );
};


const ActiveChatView = ({ initialConversation, currentUser, onBack }: { initialConversation: Conversation, currentUser: any, onBack: () => void }) => {
    const supabase = createClient();
    const [isSending, setIsSending] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [conversation, setConversation] = useState(initialConversation);
    const [loadingChat, setLoadingChat] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    
    // Fetch initial messages for the conversation
    useEffect(() => {
        const fetchInitialMessages = async () => {
            setLoadingChat(true);
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select('*, sender:users(id, full_name, avatar_url)')
                .eq('conversation_id', conversation.id)
                .order('created_at', { ascending: true });
            
            if (messagesError) {
              console.error("Error fetching messages:", messagesError);
            } else {
              setMessages(messagesData || []);
            }
            setLoadingChat(false);
        };
        fetchInitialMessages();
    }, [conversation.id, supabase]);

    useEffect(() => {
        const channel = supabase
            .channel(`chat-room-${conversation.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversation.id}`
            }, async (payload) => {
                // If the new message is from the current user, it's already handled optimistically.
                if (payload.new.sender_id === currentUser.id) {
                    return;
                }
                
                // Fetch sender details for the new message
                const { data: senderData } = await supabase
                    .from('users')
                    .select('id, full_name, avatar_url')
                    .eq('id', payload.new.sender_id)
                    .single();

                // Append the fully-formed message to the state
                const msgWithSender = {...payload.new, sender: senderData};
                setMessages(currentMessages => [...currentMessages, msgWithSender]);
            })
            .on('postgres_changes', {
                 event: 'UPDATE',
                 schema: 'public',
                 table: 'conversations',
                 filter: `id=eq.${conversation.id}`
            }, (payload) => {
                 setConversation(prev => ({...prev, status: payload.new.status}))
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }

    }, [conversation.id, supabase, currentUser.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        const content = newMessage.trim();
        if (!content || isSending) return;
        
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
            id: tempId,
            conversation_id: conversation.id,
            sender_id: currentUser.id,
            content: content,
            created_at: new Date().toISOString(),
            sender: {
                id: currentUser.id,
                full_name: currentUser.user_metadata?.full_name,
                avatar_url: currentUser.user_metadata?.avatar_url,
            }
        };

        // Optimistically update the UI
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage("");
        setIsSending(true);
        
        const { error } = await supabase.from('messages').insert({
                conversation_id: conversation.id,
                sender_id: currentUser.id,
                content: content
        });
        
        setIsSending(false);
        inputRef.current?.focus();

        if (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message.", { description: error.message });
            // Revert the optimistic update on failure
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    const handleRequestAction = async (accept: boolean) => {
        const newStatus = accept ? 'accepted' : 'blocked';
        const { error } = await supabase
            .from('conversations')
            .update({ status: newStatus })
            .eq('id', conversation.id);

        if (error) {
            toast.error(`Failed to ${accept ? 'accept' : 'decline'} chat.`);
        } else {
            toast.success(`Chat has been ${accept ? 'accepted' : 'declined'}.`);
            setConversation(prev => ({...prev, status: newStatus}));
        }
    };

    const otherParticipant = conversation.other_participant;

    if (loadingChat) {
        return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin"/></div>
    }

    if (!otherParticipant) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-4"/>
                <h2 className="text-2xl font-semibold">Conversation not found</h2>
                <p className="text-muted-foreground max-w-sm mt-2">Could not load the participant data for this chat.</p>
            </div>
        );
    }
    
    const isRequestPending = conversation?.status === 'pending';
    const amIRequester = conversation?.requester_id === currentUser.id;
    const isChatLockedForRequester = isRequestPending && amIRequester && messages.length >= 1;

    const renderFooter = () => {
        if (isChatLockedForRequester) {
            return (
                <footer className="border-t p-4 flex-shrink-0 bg-background text-center">
                    <p className="text-sm text-muted-foreground">Your message has been sent. You can send more messages once {otherParticipant.full_name} accepts your request.</p>
                </footer>
            );
        }

        if (isRequestPending && !amIRequester) {
            return (
                <footer className="border-t p-4 flex-shrink-0 bg-background text-center space-y-2">
                    <p className="text-sm text-muted-foreground">{otherParticipant.full_name} has sent you a message request.</p>
                    <div className="flex gap-2 justify-center">
                        <Button onClick={() => handleRequestAction(true)}><CheckCircle className="w-4 h-4 mr-2"/>Accept</Button>
                        <Button variant="destructive" onClick={() => handleRequestAction(false)}><XCircle className="w-4 h-4 mr-2"/>Decline</Button>
                    </div>
                </footer>
            );
        }
        
        if (conversation?.status === 'blocked') {
            return (
                 <footer className="border-t p-4 flex-shrink-0 bg-background text-center">
                    <p className="text-sm text-destructive">You cannot reply to this conversation.</p>
                </footer>
            );
        }

        return (
             <footer className="border-t p-4 flex-shrink-0 bg-background">
                <div className="relative">
                    <Input
                        ref={inputRef}
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={isSending}
                        className="pr-12"
                    />
                    <Button 
                        size="icon" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={handleSendMessage}
                        disabled={isSending || !newMessage.trim()}
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </footer>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background">
            <header className="border-b p-4 flex items-center gap-3 flex-shrink-0">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar>
                    <AvatarImage src={otherParticipant.avatar_url} />
                    <AvatarFallback>{otherParticipant.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="font-semibold">{otherParticipant.full_name}</h2>
                </div>
            </header>

            <ScrollArea className="flex-1 bg-muted/20">
                <div className="p-4 space-y-4">
                     {messages.map(msg => {
                        const isSender = msg.sender_id === currentUser.id;
                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full items-end gap-2",
                                    isSender ? "justify-end" : "justify-start"
                                )}
                            >
                                {!isSender && msg.sender && (
                                    <Avatar className="w-8 h-8 flex-shrink-0 self-start">
                                        <AvatarImage src={msg.sender?.avatar_url} />
                                        <AvatarFallback>{typeof msg.sender?.full_name === 'string' ? msg.sender.full_name?.[0] : '?'}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={cn(
                                        "max-w-[75%] p-3 rounded-2xl break-words",
                                        isSender
                                            ? "bg-primary text-primary-foreground rounded-br-none"
                                            : "bg-card border rounded-bl-none"
                                    )}
                                >
                                    <p>{msg.content}</p>
                                    <p className="text-xs opacity-70 mt-1 text-right">
                                        {new Date(msg.created_at).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div ref={messagesEndRef} />
            </ScrollArea>
            
            {renderFooter()}
        </div>
    );
};
