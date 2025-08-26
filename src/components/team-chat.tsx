
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft,
  Send,
  Loader2,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Team = {
    id: string;
    name: string;
    banner_url: string;
};

type Message = {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    sender: {
        full_name: string;
        avatar_url: string;
    }
}

export const TeamChat = ({ teamId }: { teamId: string }) => {
    const router = useRouter();
    const supabase = createClient();
    const [team, setTeam] = useState<Team | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setCurrentUser(user);

            // Fetch team details
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .select('id, name, banner_url')
                .eq('id', teamId)
                .single();

            if (teamError || !teamData) {
                toast.error("Failed to load team details.");
                router.push('/teams');
                return;
            }
            setTeam(teamData);

            // Fetch messages
            const { data: messagesData, error: messagesError } = await supabase
                .from('team_messages')
                .select('*, sender:users(full_name, avatar_url)')
                .eq('team_id', teamId)
                .order('created_at', { ascending: true });
            
            if (messagesError) {
                toast.error("Failed to load messages.");
            } else {
                setMessages(messagesData as any[]);
            }

            setLoading(false);
        };
        fetchInitialData();
    }, [teamId, supabase, router]);
    
    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel(`team-chat-${teamId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_messages', filter: `team_id=eq.${teamId}` }, 
            async (payload) => {
                if (payload.new.sender_id === currentUser?.id) return;
                
                const { data: senderProfile } = await supabase
                    .from('users')
                    .select('full_name, avatar_url')
                    .eq('id', payload.new.sender_id)
                    .single();

                setMessages(current => [...current, { ...payload.new, sender: senderProfile } as Message]);
            })
            .subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        }
    }, [teamId, supabase, currentUser?.id]);

     useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !currentUser || !team) return;

        setIsSending(true);
        const optimisticMessage = {
            id: `temp-${Date.now()}`,
            team_id: teamId,
            sender_id: currentUser.id,
            content: newMessage,
            created_at: new Date().toISOString(),
            sender: {
                full_name: 'You',
                avatar_url: '',
            }
        };

        setMessages(current => [...current, optimisticMessage as Message]);
        setNewMessage("");

        const { error } = await supabase.from('team_messages').insert({
            team_id: teamId,
            sender_id: currentUser.id,
            content: newMessage,
        });

        if (error) {
            toast.error("Failed to send message.");
            setMessages(current => current.filter(m => m.id !== optimisticMessage.id));
        }
        setIsSending(false);
    };


    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin w-8 h-8" /></div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-var(--header-height,0px))] bg-background">
            <header className="border-b p-4 flex items-center gap-3 flex-shrink-0">
                 <Button variant="ghost" size="icon" onClick={() => router.push(`/teams/${teamId}`)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar>
                    <AvatarImage src={team?.banner_url} />
                    <AvatarFallback><Users /></AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="font-semibold">{team?.name}</h2>
                    <p className="text-sm text-muted-foreground">Team Chat</p>
                </div>
            </header>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 pr-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={cn(
                            'flex items-start gap-2 w-full',
                            msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'
                        )}>
                             {msg.sender_id !== currentUser.id && (
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={msg.sender?.avatar_url} />
                                    <AvatarFallback>{msg.sender?.full_name?.[0] || '?'}</AvatarFallback>
                                </Avatar>
                            )}
                            <div>
                                {msg.sender_id !== currentUser.id && <p className="text-xs text-muted-foreground ml-2 mb-1">{msg.sender.full_name}</p>}
                                <div className={cn(
                                    'max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl',
                                    msg.sender_id === currentUser.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                )}>
                                    <p>{msg.content}</p>
                                    <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </ScrollArea>
             <footer className="border-t p-4 flex-shrink-0 bg-background">
                <div className="relative">
                    <Input 
                        placeholder="Type your message..."
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
        </div>
    )
}

    