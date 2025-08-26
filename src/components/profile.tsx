
'use client';
import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  ArrowLeft,
  Wand2,
  Send,
  Loader2,
  UserPlus,
  MessageCircle,
  MapPin,
  Github,
  Linkedin,
  Globe,
  User
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { findPeers } from "@/ai/flows/peerjet-flow";
import type { PeerSearchOutput, UserProfile as UserProfileType } from "@/ai/schemas/peer-schema";
import { Badge } from "./ui/badge";
import TextGenerateEffect from "./ui/typewriter";
import { toast } from "sonner";


const Message = ({ children, isUser }: { children: React.ReactNode; isUser: boolean }) => (
    <div className={`flex items-start gap-3 w-full my-4 ${isUser ? 'flex-row-reverse' : ''}`}>
        {!isUser && (
            <Avatar className='w-10 h-10'>
                <AvatarFallback><Wand2 /></AvatarFallback>
            </Avatar>
        )}
        <div className={`p-3 rounded-lg shadow-sm max-w-[80%] ${isUser ? 'bg-primary text-primary-foreground ml-auto' : 'bg-card border'}`}>
            {children}
        </div>
    </div>
);


export const Profile = () => {
  const router = useRouter();
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [isSearching, startTransition] = useTransition();

  const [allUsers, setAllUsers] = useState<UserProfileType[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [conversation, setConversation] = useState<React.ReactNode[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfileType & { reason?: string; match_score?: number; } | null>(null);

  const conversationContainerRef = useRef<HTMLDivElement>(null);
  const searchHistory = useRef<string[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  
  useEffect(() => {
    if (conversationContainerRef.current) {
        conversationContainerRef.current.scrollTop = conversationContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (error) {
        console.error("Error fetching current user profile", error);
        setCurrentUser(null);
      } else {
        setCurrentUser(profile);
      }

      const { data: allUsersData, error: allUsersError } = await supabase
        .from('users')
        .select('*')
        .not('id', 'eq', authUser.id);
      
      if (allUsersError) {
        console.error("Error fetching all users", allUsersError);
        setAllUsers([]);
      } else {
        setAllUsers(allUsersData || []);
      }
    };
    fetchInitialData();
  }, [supabase, router]);
  
  const handleSearch = async (newQuery: string) => {
    if (!newQuery.trim() || !currentUser || isSearching || isBlocked) return;
  
    // Spam protection
    searchHistory.current.push(newQuery);
    if (searchHistory.current.length > 3) {
      searchHistory.current.shift();
    }
    if (
      searchHistory.current.length === 3 &&
      searchHistory.current.every(q => q === newQuery)
    ) {
        toast.error("You are searching too quickly. Please wait 30 seconds.");
        setIsBlocked(true);
        setTimeout(() => setIsBlocked(false), 30000);
        return;
    }

    const userMessage = <Message key={Date.now()} isUser={true}>{newQuery}</Message>;
    setConversation(prev => [...prev, userMessage]);
    setQuery("");
  
    startTransition(async () => {
      const loadingMessageId = `loading-${Date.now()}`;
      const loadingMessage = (
        <Message key={loadingMessageId} isUser={false}>
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-muted-foreground">PeerJet is thinking...</p>
          </div>
        </Message>
      );
      setConversation(prev => [...prev, loadingMessage]);
  
      // Local keyword-based pre-sorting
      const keywords = newQuery.toLowerCase().split(/\s+/).filter(Boolean);
      const sortedUsers = [...allUsers]
        .map(user => {
          let score = 0;
          const userContent = [
            user.full_name,
            user.bio,
            ...(user.tech_stack || []),
            ...(user.interests || []),
          ].join(' ').toLowerCase();
  
          keywords.forEach(keyword => {
            if (userContent.includes(keyword)) {
              score++;
            }
          });
          return { ...user, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);
  
      const BATCH_SIZE = 5;
      const usersForAI = sortedUsers.slice(0, BATCH_SIZE);
  
      try {
        const results = await findPeers({
          query: newQuery,
          users: usersForAI.map(u => ({
            id: u.id,
            full_name: u.full_name,
            bio: u.bio,
            experience: u.experience,
            tech_stack: u.tech_stack,
            interests: u.interests,
            avatar_url: u.avatar_url,
            location: u.location,
            github_url: u.github_url,
            linkedin_url: u.linkedin_url,
            portfolio_url: u.portfolio_url,
          })),
          currentUser: {
            id: currentUser.id,
            full_name: currentUser.full_name,
            bio: currentUser.bio,
            experience: currentUser.experience,
            tech_stack: currentUser.tech_stack || [],
            interests: currentUser.interests || [],
            avatar_url: currentUser.avatar_url,
            location: currentUser.location,
            github_url: currentUser.github_url,
            linkedin_url: currentUser.linkedin_url,
            portfolio_url: currentUser.portfolio_url,
          },
        });
  
        const newConversationEntry = (
          <Message key={`ai-response-${Date.now()}`} isUser={false}>
            <AIResponse
              results={results}
              allUsers={allUsers}
              onSelectUser={setSelectedUser}
              loadNextBatch={() => {}} // Placeholder for now
              hasMore={sortedUsers.length > BATCH_SIZE}
            />
          </Message>
        );
  
        setConversation(prev =>
          prev.filter(c => (c as React.ReactElement).key !== loadingMessageId)
              .concat(newConversationEntry)
        );
      } catch (error) {
        console.error("AI search failed:", error);
        const errorMsg = error instanceof Error ? error.message : "An unknown error occurred.";
        const errorMessage = (
          <Message key={`error-${Date.now()}`} isUser={false}>
            <p className="text-destructive">PeerJet search failed: {errorMsg}</p>
          </Message>
        );
        setConversation(prev =>
          prev.filter(c => (c as React.ReactElement).key !== loadingMessageId)
              .concat(errorMessage)
        );
      }
    });
  };

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedUser(null)}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => router.back()}>
                      <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft text-white">
                          <Wand2 className="w-5 h-5" />
                      </div>
                      <h1 className="text-xl font-semibold">PeerJet</h1>
                  </div>
              </div>
            </div>
          </div>
        </header>

        {/* Chat/Search Area */}
        <div ref={conversationContainerRef} className="flex-1 container mx-auto px-4 py-6 flex flex-col gap-4 overflow-y-auto">
          {conversation.length === 0 && (
            <Message isUser={false}>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <h2 className="text-xl font-bold">Welcome to PeerJet!</h2>
                    <p className="text-muted-foreground max-w-md mt-2">
                        Describe your ideal teammate in plain English. For example: "I'm looking for a designer skilled in Figma who is interested in social impact projects."
                    </p>
                </div>
            </Message>
          )}
          {conversation}
        </div>

        {/* Input Area */}
        <div className="mt-auto pt-4 sticky bottom-0 bg-background/80 backdrop-blur-sm pb-2">
            <div className="container mx-auto px-4">
              <div className="relative">
                <Input 
                  placeholder="Tell me what you're looking for..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch(query)}
                  className="pr-12 text-base h-12"
                  disabled={isSearching || isBlocked}
                />
                <Button 
                  size="icon" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9"
                  onClick={() => handleSearch(query)}
                  disabled={isSearching || !query || isBlocked}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                  PeerJet uses AI and may produce inaccurate information.
              </p>
            </div>
        </div>
      </div>
      
      {/* Profile Modal */}
      {selectedUser && <ProfileModal user={selectedUser} isTeamOwner={false} />}
    </Dialog>
  );
};

interface AIResponseProps {
    results: PeerSearchOutput | string;
    allUsers: UserProfileType[];
    onSelectUser: (user: any) => void;
    loadNextBatch: () => void;
    hasMore: boolean;
}

const AIResponse = ({ results, allUsers, onSelectUser, loadNextBatch, hasMore }: AIResponseProps) => {
    if (typeof results === 'string') {
        return <TextGenerateEffect words={results} />;
    }
    if (results.length === 0) {
        return <p>I couldn't find a strong match. Try a different search?</p>;
    }

    const sortedUsersMap = new Map(results.map(u => [u.userId, { reason: u.reason, match_score: u.match_score }]));
    const displayedUsers = allUsers
      .filter(u => sortedUsersMap.has(u.id))
      .map(u => ({ ...u, ...sortedUsersMap.get(u.id) }))
      .sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
    
    return (
        <div>
            <p className="mb-4">Here are the best matches I found for you:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in-up">
                {displayedUsers.map(user => (
                    <UserCard key={user.id} user={user} onSelect={() => onSelectUser(user)} />
                ))}
            </div>
            {hasMore && (
                <div className="mt-4 text-center">
                    <Button onClick={loadNextBatch} variant="outline" size="sm">Load More</Button>
                </div>
            )}
        </div>
    );
};

const UserCard = ({ user, onSelect }: { user: UserProfileType & { reason?: string; match_score?: number; }; onSelect: () => void }) => (
    <DialogTrigger asChild>
        <Card onClick={onSelect} className="p-4 hover-lift border-0 shadow-soft bg-card flex flex-col cursor-pointer">
          <div className="flex-1 flex flex-col items-center text-center">
            <Avatar className="w-20 h-20 mb-3">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <h3 className="font-semibold">{user.full_name}</h3>
            <p className="text-sm text-muted-foreground capitalize mt-1 line-clamp-2">{user.bio}</p>
            <div className="mt-2 text-xs text-primary font-medium">{Math.round((user.match_score || 0) * 100)}% match</div>
          </div>
          <p className="text-xs text-muted-foreground text-center border-t pt-2 mt-2 italic line-clamp-2">"{user.reason}"</p>
        </Card>
    </DialogTrigger>
);

const ProfileModal = ({ user, isTeamOwner }: { user: UserProfileType & { reason?: string; match_score?: number }, isTeamOwner: boolean }) => (
  <DialogContent className="sm:max-w-[70vw] max-h-[80vh] flex flex-col">
    <DialogHeader>
        <DialogTitle>{user.full_name}'s Profile</DialogTitle>
        <DialogDescription>
          Match Score: {Math.round((user.match_score || 0) * 100)}%. Reason: "{user.reason}"
        </DialogDescription>
    </DialogHeader>
    <div className="py-4 space-y-4 overflow-y-auto pr-2 flex-1">
        {/* Profile Header */}
        <Card className="p-6 border-0 shadow-soft bg-card/80">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
            <Avatar className="w-24 h-24">
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback>{user.full_name?.slice(0,2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user.full_name}</h2>
              <p className="text-muted-foreground mt-2">{user.bio}</p>
              <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground mt-3">
                <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{user.location || 'Location not set'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
           {/* Contact & Links */}
          <Card className="p-6 border-0 shadow-soft bg-card/80">
            <h3 className="text-lg font-semibold mb-4">Contact & Links</h3>
            <div className="space-y-3">
                {user.github_url && <div className="flex items-center gap-3">
                <Github className="w-5 h-5" />
                <a href={user.github_url} className="text-sm text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    GitHub
                </a>
                </div>}
                {user.linkedin_url && <div className="flex items-center gap-3">
                <Linkedin className="w-5 h-5" />
                <a href={user.linkedin_url} className="text-sm text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    LinkedIn
                </a>
                </div>}
                {user.portfolio_url && <div className="flex items-center gap-3">
                <Globe className="w-5 h-5" />
                <a href={user.portfolio_url} className="text-sm text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    Portfolio
                </a>
                </div>}
            </div>
          </Card>
          {/* Experience */}
          <Card className="p-6 border-0 shadow-soft bg-card/80">
            <h3 className="text-lg font-semibold mb-4">Experience</h3>
            <p className="text-muted-foreground capitalize">{user.experience || 'Not specified'}</p>
          </Card>
        </div>


        {/* Skills */}
        <Card className="p-6 border-0 shadow-soft bg-card/80">
          <h3 className="text-lg font-semibold mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2">
              {(user.tech_stack || []).map((skill:string, index: number) => (
              <Badge key={index} variant="secondary" className="text-sm">
                  {skill}
              </Badge>
              )) || <p className="text-sm text-muted-foreground">No skills listed.</p>}
          </div>
        </Card>

        {/* Interests */}
        <Card className="p-6 border-0 shadow-soft bg-card/80">
          <h3 className="text-lg font-semibold mb-4">Interests</h3>
          <div className="flex flex-wrap gap-2">
              {(user.interests || []).map((interest: string, index: number) => (
              <Badge key={index} variant="outline" className="text-sm">
                  {interest}
              </Badge>
              )) || <p className="text-sm text-muted-foreground">No interests listed.</p>}
          </div>
        </Card>
    </div>
  </DialogContent>
);
