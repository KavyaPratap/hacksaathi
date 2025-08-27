
'use client';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft,
  Loader2,
  Search,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";

export const Teams = () => {
  const router = useRouter();
  const supabase = createClient();
  
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const fetchUserAndTeams = async () => {
        setSearchLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUser(user);
             const { data, error } = await supabase
                .from('teams')
                .select('id, name, project_name, banner_url, owner_id, team_members:team_members(count)')
                .not('owner_id', 'eq', user.id);
            
            if (error) {
                toast.error("Failed to fetch teams", { description: error.message });
                setAllTeams([]);
            } else {
                setAllTeams(data);
                setFilteredTeams(data);
            }
        } else {
            router.push('/login');
        }
        setSearchLoading(false);
    }
    fetchUserAndTeams();
  }, [supabase, router]);
  

  const handleSearch = () => {
    setSearchLoading(true);
    if (searchQuery.trim() === '') {
      setFilteredTeams(allTeams);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const results = allTeams.filter(team => 
        team.name.toLowerCase().includes(lowercasedQuery) || 
        team.project_name?.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredTeams(results);
    }
    setSearchLoading(false);
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50 dark:bg-card/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold">Find a Team</h1>
            </div>
          </div>
        </div>
      </header>

       {/* Search Bar */}
       <div className="container mx-auto px-4 pt-4">
            <div className="relative">
                <Input 
                    placeholder="Search for teams by name or project..." 
                    className="pl-10 h-11" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleSearch();
                        }
                    }}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Search className="w-5 h-5 text-muted-foreground" />
                </div>
                <Button 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8"
                    size="sm"
                    onClick={handleSearch}
                    disabled={searchLoading}
                >
                    {searchLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Search"}
                </Button>
            </div>
        </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div>
            {searchLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : filteredTeams.length > 0 ? (
                <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">{filteredTeams.length} teams found.</p>
                    {filteredTeams.map((team) => (
                        <SuggestedTeamCard key={team.id} team={team} currentUser={currentUser} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <h3 className="text-lg font-semibold">No Teams Found</h3>
                    <p className="text-muted-foreground mt-2">No teams matched your search criteria, or there are no teams to join yet.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};


const SuggestedTeamCard = ({ team, currentUser }: { team: any, currentUser: any }) => {
    const supabase = createClient();
    const router = useRouter();
    const [requestStatus, setRequestStatus] = useState<'idle' | 'pending' | 'requested'>('idle');
    const [proposal, setProposal] = useState("");
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    useEffect(() => {
        const checkRequestStatus = async () => {
            if (!currentUser) return;
             const { data } = await supabase
                .from('team_join_requests')
                .select('id')
                .eq('team_id', team.id)
                .eq('user_id', currentUser.id)
                .eq('status', 'pending')
                .eq('type', 'join_request') // Only check for user-initiated requests
                .maybeSingle();
            if (data) {
                setRequestStatus('requested');
            }
        };
        checkRequestStatus();
    }, [currentUser, team.id, supabase]);

    const handleFetchMembers = async () => {
        setLoadingMembers(true);
        const { data, error } = await supabase
            .from('team_members')
            .select('users(id, full_name, avatar_url)')
            .eq('team_id', team.id);
        
        if (error) {
            toast.error("Could not fetch team members.");
        } else {
            setTeamMembers(data.map(m => m.users));
        }
        setLoadingMembers(false);
    }

    const handleRequestToJoin = async () => {
        if (!currentUser) {
            toast.error("You must be logged in to join a team.");
            return;
        }
        setRequestStatus('pending');

        try {
            const { error } = await supabase.rpc('request_to_join_team', {
                p_team_id: team.id,
                p_proposal: proposal || null
            });
            if (error) throw error;
            
            toast.success("Your request to join has been sent!");
            setRequestStatus('requested');

        } catch (error: any) {
             if (error.message.includes('already a member')) {
                toast.info("You are already a member of this team.");
            } else if (error.message.includes('already requested')) {
                toast.info("You have already sent a request to join this team.");
            } else {
                toast.error("Failed to send join request.", { description: error.message });
            }
            setRequestStatus('idle');
        }
    };
    
    return (
        <Card className="p-6 hover-lift border-0 shadow-soft bg-card dark:bg-card">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div 
                    className="flex items-start gap-4 flex-1 cursor-pointer" 
                    onClick={() => router.push(`/teams/${team.id}`)}
                >
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={team.banner_url} />
                        <AvatarFallback>{team.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-lg">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">{team.project_name}</p>
                    </div>
                </div>
                <Dialog onOpenChange={(open) => open && handleFetchMembers()}>
                    <DialogTrigger asChild>
                         <Button disabled={requestStatus !== 'idle'} className="w-full sm:w-auto">
                            {requestStatus === 'pending' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {requestStatus === 'requested' ? 'Request Sent' : 'Request to Join'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Request to join {team.name}</DialogTitle>
                            <DialogDescription>
                                You can include an optional message to the team owner. This team has {teamMembers.length > 0 ? teamMembers.length : team.team_members[0]?.count || 0} member(s).
                            </DialogDescription>
                        </DialogHeader>
                         <div className="space-y-3">
                            <h4 className="font-medium text-sm">Current Members</h4>
                            {loadingMembers ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <div className="flex flex-wrap gap-4">
                                    {teamMembers && teamMembers.length > 0 ? teamMembers.map(member => (
                                        <div key={member?.id} className="flex flex-col items-center gap-1">
                                            <Avatar>
                                                <AvatarImage src={member?.avatar_url} />
                                                <AvatarFallback>{member?.full_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <p className="text-xs text-muted-foreground">{member?.full_name?.split(' ')[0]}</p>
                                        </div>
                                    )) : <p className="text-xs text-muted-foreground">No members found.</p>}
                                </div>
                            )}
                        </div>
                        <Textarea 
                            placeholder="Why would you be a good fit for this team? (Optional)"
                            value={proposal}
                            onChange={(e) => setProposal(e.target.value)}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="ghost">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button onClick={handleRequestToJoin}>Send Request</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </Card>
    )
};
