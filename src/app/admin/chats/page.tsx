'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, MessageSquare, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

type Conversation = {
    id: string;
    participant_one_data: { full_name: string; avatar_url: string };
    participant_two_data: { full_name: string; avatar_url: string };
    messages: { content: string; created_at: string }[];
};

export default function AdminChatsPage() {
    const supabase = createClient();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

    useEffect(() => {
        const fetchConversations = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    id,
                    participant_one_data:users!conversations_participant_one_fkey(full_name, avatar_url),
                    participant_two_data:users!conversations_participant_two_fkey(full_name, avatar_url),
                    messages(content, created_at)
                `)
                .order('created_at', { referencedTable: 'messages', ascending: false })
                .limit(1, { referencedTable: 'messages' });

            if (error) {
                toast.error("Failed to fetch conversations", { description: error.message });
            } else {
                setConversations(data as any);
            }
            setLoading(false);
        };
        fetchConversations();
    }, [supabase]);
    
    const filteredConversations = conversations.filter(c => 
        c.participant_one_data.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.participant_two_data.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-150px)]">
            {/* Conversation List */}
            <Card className="md:col-span-1 flex flex-col">
                <CardHeader>
                    <CardTitle>All Conversations</CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name..." 
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <ScrollArea className="flex-grow">
                    <CardContent className="space-y-2">
                        {filteredConversations.map(convo => (
                            <button 
                                key={convo.id} 
                                className="w-full text-left p-2 rounded-lg hover:bg-muted"
                                onClick={() => setSelectedConversation(convo)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-4">
                                        <Avatar className="border-2 border-background">
                                            <AvatarImage src={convo.participant_one_data.avatar_url} />
                                            <AvatarFallback>{convo.participant_one_data.full_name?.[0]}</AvatarFallback>
                                        </Avatar>
                                         <Avatar className="border-2 border-background">
                                            <AvatarImage src={convo.participant_two_data.avatar_url} />
                                            <AvatarFallback>{convo.participant_two_data.full_name?.[0]}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="flex-1 truncate">
                                        <p className="font-semibold text-sm truncate">{convo.participant_one_data.full_name} & {convo.participant_two_data.full_name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{convo.messages[0]?.content || 'No messages yet'}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </CardContent>
                </ScrollArea>
            </Card>

            {/* Chat View */}
            <Card className="md:col-span-2 flex flex-col">
                {selectedConversation ? (
                    <ChatProctorView conversation={selectedConversation} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mb-4" />
                        <p>Select a conversation to view its content.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

const ChatProctorView = ({ conversation }: { conversation: Conversation }) => {
    const supabase = createClient();
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('messages')
                .select('*, sender:users(id, full_name, avatar_url)')
                .eq('conversation_id', conversation.id)
                .order('created_at', { ascending: true });
            
            if (error) {
                toast.error("Failed to load messages for this chat.", { description: error.message });
            } else {
                setMessages(data);
            }
            setLoading(false);
        };
        fetchMessages();
    }, [conversation, supabase]);

    return (
        <div className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>{conversation.participant_one_data.full_name} & {conversation.participant_two_data.full_name}</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-grow p-4 bg-muted/20">
                {loading ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : (
                    <div className="space-y-4">
                        {messages.map(msg => (
                            <div key={msg.id} className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={msg.sender?.avatar_url} />
                                    <AvatarFallback>{msg.sender?.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <p className="font-semibold text-sm">{msg.sender.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="p-2 mt-1 rounded-lg bg-card border text-sm">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
             <CardContent className="p-4 border-t">
                <Button variant="destructive" size="sm">Take Action (Not Implemented)</Button>
            </CardContent>
        </div>
    );
};
