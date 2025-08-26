
'use client';
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  Filter,
  UserPlus,
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Loader2,
  Send
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const SKILL_CATEGORIES: Record<string, string[]> = {
  frontend: ['react', 'next.js', 'vue.js', 'angular', 'svelte', 'javascript', 'typescript', 'frontend'],
  backend: ['node.js', 'express', 'django', 'flask', 'ruby on rails', 'python', 'java', 'c#', 'go', 'rust', 'sql', 'postgresql', 'mongodb', 'firebase', 'supabase', 'aws', 'google cloud', 'azure', 'docker', 'kubernetes', 'backend'],
  design: ['ui design', 'ux design', 'figma', 'adobe xd', 'prototyping', 'design'],
  ml: ['machine learning', 'data science', 'ai', 'tensorflow', 'pytorch', 'ml'],
  mobile: ['mobile dev', 'ios', 'android', 'react native', 'flutter', 'mobile']
};

export const Discover = () => {
  const router = useRouter();
  const supabase = createClient();
  const [activeFilter, setActiveFilter] = useState("all");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [recommendedUsers, setRecommendedUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
        setCurrentUser(profile);
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .not('id', 'eq', user.id); // Exclude the current user
        
        if (error) {
          console.error("Error fetching users:", error);
        } else {
          const allUsers = data || [];
          setUsers(allUsers);

          // Calculate match scores and set top 10 recommended users
          if (profile) {
            const scoredUsers = allUsers.map(otherUser => {
              const commonSkills = profile.tech_stack?.filter((skill: string) => otherUser.tech_stack?.includes(skill)).length || 0;
              const commonInterests = profile.interests?.filter((interest: string) => otherUser.interests?.includes(interest)).length || 0;
              const score = (commonSkills * 2) + commonInterests; // Weight skills more
              return { ...otherUser, score };
            }).sort((a, b) => b.score - a.score);
            
            setRecommendedUsers(scoredUsers.slice(0, 10));
          } else {
            setRecommendedUsers(allUsers.slice(0,10));
          }
        }
      } else {
        router.push('/login');
      }

      setLoading(false);
    };
    fetchUsers();
  }, [supabase, router]);

  const filteredUsers = useMemo(() => {
    // If there is a search query, filter ALL users
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      return users.filter(user =>
        user.full_name?.toLowerCase().includes(lowercasedQuery) ||
        user.location?.toLowerCase().includes(lowercasedQuery) ||
        user.tech_stack?.some((skill: string) => skill.toLowerCase().includes(lowercasedQuery))
      );
    }
    // Otherwise, show the recommended users
    return recommendedUsers;
  }, [searchQuery, users, recommendedUsers]);


  const filters = [
    { id: "all", label: "All" },
    { id: "frontend", label: "Frontend" },
    { id: "backend", label: "Backend" },
    { id: "design", label: "Design" },
    { id: "ml", label: "ML/AI" },
    { id: "mobile", label: "Mobile" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50 dark:bg-background/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Discover Teammates</h1>
          </div>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="container mx-auto px-4 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search by skills, name, or location..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? `${filteredUsers.length} developers found` : "Showing top 10 recommendations for you"}
            </p>
        </div>
      </div>

      {/* People Grid */}
      <div className="container mx-auto px-4 pb-8">
        {loading ? (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((person) => (
                    <PersonCard key={person.id} person={person} currentUser={currentUser} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

const PersonCard = ({ person, currentUser }: { person: any, currentUser: any }) => {
  return (
    <Card className="p-6 hover-lift border-0 shadow-soft bg-card flex flex-col">
        <div className="space-y-4 flex-1">
        <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12">
            <AvatarImage src={person.avatar_url} />
            <AvatarFallback>{person.full_name ? person.full_name[0] : 'U'}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
            <h3 className="font-semibold">{person.full_name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{person.experience} Developer</p>
            
            <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{person.location || 'Unknown location'}</span>
            </div>
            </div>
            
        </div>
        
        <div className="flex flex-wrap gap-2">
            {person.tech_stack?.slice(0, 4).map((skill: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
                {skill}
            </Badge>
            ))}
            {person.tech_stack?.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                    +{person.tech_stack.length - 4} more
                </Badge>
            )}
        </div>
        
        <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-green-600">Available now</span>
        </div>
        </div>

        <div className="flex gap-2 mt-4">
            <Button asChild size="sm" className="flex-1" variant="outline">
                <Link href={`/profile/${person.id}`}>View Profile</Link>
            </Button>
            <InviteToTeamDialog person={person} currentUser={currentUser} />
        </div>
    </Card>
  );
};


const InviteToTeamDialog = ({ person, currentUser }: { person: any, currentUser: any }) => {
    const supabase = createClient();
    const router = useRouter();
    const [ownedTeams, setOwnedTeams] = useState<any[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<string>("");
    const [loading, setLoading] = useState(false);
  
    const handleFetchOwnedTeams = async () => {
      if (!currentUser) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('owner_id', currentUser.id);
  
      if (error) {
        toast.error("Failed to fetch your teams.");
      } else {
        setOwnedTeams(data);
      }
      setLoading(false);
    };

    const handleSendInvite = async () => {
        if (!selectedTeam) {
            toast.error("Please select a team to invite to.");
            return;
        }

        const team = ownedTeams.find(t => t.id === selectedTeam);
        if (!team) return;

        try {
            // Call the new, secure RPC function
            const { error: rpcError } = await supabase.rpc('invite_user_to_team', {
                p_invited_user_id: person.id,
                p_team_id: team.id
            });

            if (rpcError) throw rpcError;
            
            toast.success(`Invitation sent to ${person.full_name} to join ${team.name}!`);

        } catch (error: any) {
            console.error("Error sending invitation:", error);
            if (error.message.includes('already exists')) {
                 toast.info("An invitation has already been sent to this user for this team.");
            } else {
                toast.error("Failed to send invitation.", { description: error.message });
            }
        }
    };
  
    return (
      <Dialog onOpenChange={(open) => open && handleFetchOwnedTeams()}>
        <DialogTrigger asChild>
          <Button size="sm" className="flex-1">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite to Team
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite {person.full_name} to a team</DialogTitle>
            <DialogDescription>
              Select one of your teams to send an invitation. This will send them a notification.
            </DialogDescription>
          </DialogHeader>
          {loading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : ownedTeams.length > 0 ? (
            <Select onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team..." />
              </SelectTrigger>
              <SelectContent>
                {ownedTeams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">You don't own any teams. <Link href="/teams/create" className="text-primary underline">Create one now!</Link></p>
          )}
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSendInvite} disabled={!selectedTeam}>
                <Send className="w-4 h-4 mr-2" />
                Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
