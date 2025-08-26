

'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft,
  Crown,
  Trash2,
  UserPlus,
  Mail,
  Loader2,
  Settings,
  ShieldX,
  Check,
  XIcon,
  LogOut,
  Users,
  MessageCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Textarea } from "./ui/textarea";

type TeamDetailsProps = {
    teamId: string;
};

type User = {
    id: string;
    full_name: string;
    avatar_url: string;
};

type TeamMember = {
    role: string;
    users: User;
};

type Team = {
    id: string;
    name: string;
    project_name: string;
    description: string;
    banner_url: string;
    owner_id: string;
    skills_needed: string[];
    member_limit: number;
    team_members: TeamMember[];
};

type JoinRequest = {
    id: string;
    user_id: string;
    proposal: string | null;
    type: 'join_request' | 'invitation';
    users: User[];
}

export const TeamDetails = ({ teamId }: TeamDetailsProps) => {
    const router = useRouter();
    const supabase = createClient();
    const [team, setTeam] = useState<Team | null>(null);
    const [teamOwner, setTeamOwner] = useState<User | null>(null);
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const fetchJoinRequests = async () => {
        const { data: requestsData, error: requestsError } = await supabase
            .from('team_join_requests')
            .select('id, user_id, proposal, type, users ( id, full_name, avatar_url )')
            .eq('team_id', teamId)
            .eq('status', 'pending')
            .eq('type', 'join_request'); // Only fetch actual join requests

        if (requestsError) {
            toast.error("Failed to fetch join requests.", { description: requestsError.message });
            return;
        }
        setJoinRequests(requestsData as JoinRequest[]);
    };

    const fetchTeamDetails = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setCurrentUser(user);

        const { data, error } = await supabase
            .from('teams')
            .select(`
                id, name, project_name, description, banner_url, owner_id, skills_needed, member_limit,
                team_members ( role, users ( id, full_name, avatar_url ) )
            `)
            .eq('id', teamId)
            .single();

        if (error) {
            toast.error("Failed to fetch team details", { description: error.message });
            setTeam(null);
        } else {
            setTeam(data as any);
            // Fetch owner details separately to ensure they are always available
            const { data: ownerData, error: ownerError } = await supabase
                .from('users')
                .select('id, full_name, avatar_url')
                .eq('id', data.owner_id)
                .single();
            
            if (ownerError) {
                 toast.error("Failed to fetch team owner details", { description: ownerError.message });
            } else {
                setTeamOwner(ownerData);
            }

            if (user.id === (data as any).owner_id) {
                fetchJoinRequests();
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTeamDetails();
    }, [teamId, supabase, router]);

    const isOwner = currentUser?.id === team?.owner_id;
    const isMember = team?.team_members.some(m => m.users.id === currentUser?.id) && !isOwner;

    const handleRequest = async (request: JoinRequest, approve: boolean) => {
        const newStatus = approve ? 'approved' : 'declined';

        const { error: updateError } = await supabase
            .from('team_join_requests')
            .update({ status: newStatus })
            .eq('id', request.id);
        
        if (updateError) {
            toast.error(`Failed to ${newStatus} request`, { description: updateError.message });
            return;
        }

        if (approve) {
            const { error: insertError } = await supabase
                .from('team_members')
                .insert({ team_id: teamId, user_id: request.user_id, role: 'member' });
            
            if (insertError) {
                 toast.error(`Failed to add member to team`, { description: insertError.message });
                 await supabase.from('team_join_requests').update({ status: 'pending' }).eq('id', request.id); // Revert
                 return;
            }
             await supabase.from('activity_log').insert({ 
                user_id: request.user_id, 
                action: 'joined team', 
                details: { team_name: team?.name } 
            });
        }

        await supabase.from('notifications').insert({
            user_id: request.user_id,
            type: 'team_response',
            data: {
                team_id: team?.id,
                team_name: team?.name,
                status: newStatus,
                sender_id: currentUser.id,
                sender_name: 'Team Owner'
            }
        });

        await supabase.from('activity_log').insert([
            {
                user_id: currentUser.id,
                action: `${approve ? 'approved' : 'declined'} request from`,
                details: { to: request.users[0].full_name, team_name: team?.name }
            }
        ]);
        

        toast.success(`Request has been ${newStatus}.`);
        fetchTeamDetails();
        fetchJoinRequests();
    }

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        if (!isOwner || memberId === currentUser.id) {
            toast.error("You cannot remove the owner or yourself.");
            return;
        }

        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('user_id', memberId);

        if (error) {
            toast.error("Failed to remove member", { description: error.message });
        } else {
            toast.success(`${memberName} removed successfully.`);
            setTeam(prev => prev ? {
                ...prev,
                team_members: prev.team_members.filter(m => m.users.id !== memberId)
            } : null);

            await supabase.from('activity_log').insert({ 
                user_id: currentUser.id, 
                action: 'removed a member from', 
                details: { member: memberName, team_name: team?.name } 
            });
        }
    };
    
    const handleLeaveTeam = async () => {
        if (!isMember) {
            toast.error("Only members can leave a team.");
            return;
        }
         const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('user_id', currentUser.id);
        
        if (error) {
             toast.error("Failed to leave team", { description: error.message });
        } else {
            toast.success(`You have left ${team?.name}.`);
            await supabase.from('activity_log').insert({ 
                user_id: currentUser.id, 
                action: 'left team', 
                details: { team_name: team?.name } 
            });
            router.push('/teams');
        }
    }


    const handleDeleteTeam = async () => {
        if (!isOwner) {
            toast.error("Only the team owner can delete the team.");
            return;
        }

        const { error } = await supabase
            .from('teams')
            .delete()
            .eq('id', teamId);
        
        if (error) {
            toast.error("Failed to delete team", { description: error.message });
        } else {
            toast.success("Team deleted successfully.");
            router.push('/teams');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin w-8 h-8" /></div>;
    }

    if (!team) {
        return (
            <div className="container mx-auto px-4 py-6 text-center">
                <h2 className="text-2xl font-bold">Team not found</h2>
                <p className="text-muted-foreground">The team you are looking for does not exist.</p>
                <Button onClick={() => router.push('/teams')} className="mt-4">Back to Teams</Button>
            </div>
        );
    }
    
    const allMembers = team.team_members.filter(m => m.users.id !== team.owner_id);
    const memberCount = allMembers.length + (teamOwner ? 1 : 0);

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => router.push('/teams')}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <h1 className="text-xl font-semibold">{team.name}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                             {(isOwner || isMember) && (
                                <Button onClick={() => router.push(`/teams/${teamId}/chat`)}>
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Chat
                                </Button>
                             )}
                            {isOwner && (
                                <Button variant="ghost" size="icon">
                                    <Settings className="w-5 h-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 space-y-6">
                <Card className="border-0 shadow-soft overflow-hidden">
                    <div className="relative h-48 w-full">
                        <Image src={team.banner_url} alt={`${team.name} banner`} layout="fill" className="object-cover" />
                    </div>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold">{team.project_name}</h2>
                        <p className="text-muted-foreground mt-2">{team.description}</p>
                    </div>
                </Card>

                {isOwner && joinRequests.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Join Requests ({joinRequests.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {joinRequests.map((req) => (
                                <div key={req.id} className="p-3 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={req.users[0].avatar_url} />
                                                <AvatarFallback>{req.users[0].full_name[0]}</AvatarFallback>
                                            </Avatar>
                                            <p className="font-semibold">{req.users[0].full_name}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="outline" className="h-8 w-8 border-green-500 text-green-500 hover:bg-green-500 hover:text-white" onClick={() => handleRequest(req, true)}>
                                                <Check className="w-4 h-4"/>
                                            </Button>
                                            <Button size="icon" variant="outline" className="h-8 w-8 border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleRequest(req, false)}>
                                                <XIcon className="w-4 h-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                    {req.proposal && (
                                        <div className="mt-3 p-3 bg-muted/50 rounded-md">
                                            <p className="text-sm text-muted-foreground italic">"{req.proposal}"</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}


                <Card>
                    <CardHeader>
                        <CardTitle>Skills Needed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {team.skills_needed?.map((skill, index) => (
                                <Badge key={index} variant="secondary">{skill}</Badge>
                            )) || <p className="text-sm text-muted-foreground">No specific skills listed.</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Members</CardTitle>
                        <Badge variant="outline"><Users className="w-3 h-3 mr-2"/>{memberCount} / {team.member_limit}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {teamOwner && (
                             <div className="flex items-center justify-between">
                                <Link href={`/profile/${teamOwner.id}`} className="flex items-center gap-3 group">
                                    <Avatar>
                                        <AvatarImage src={teamOwner.avatar_url} />
                                        <AvatarFallback>{teamOwner.full_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold group-hover:underline">{teamOwner.full_name}</p>
                                        <Badge variant="secondary" className="text-xs font-medium border-yellow-500/50 text-yellow-600">
                                            <Crown className="w-3 h-3 mr-1.5" />
                                            Owner
                                        </Badge>
                                    </div>
                                </Link>
                            </div>
                       )}
                        {allMembers.map(member => (
                            <div key={member.users.id} className="flex items-center justify-between">
                                <Link href={`/profile/${member.users.id}`} className="flex items-center gap-3 group">
                                    <Avatar>
                                        <AvatarImage src={member.users.avatar_url} />
                                        <AvatarFallback>{member.users.full_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold group-hover:underline">{member.users.full_name}</p>
                                    </div>
                                </Link>
                                {isOwner && (
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><ShieldX className="w-4 h-4 text-destructive"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Remove {member.users.full_name}?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to remove this member from the team? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRemoveMember(member.users.id, member.users.full_name)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                 {isMember && (
                    <Card className="border-destructive/50">
                        <CardHeader>
                            <CardTitle className="text-destructive">Leave Team</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive"><LogOut className="w-4 h-4 mr-2"/> Leave Team</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure you want to leave this team?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            You will need to be invited again to rejoin.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleLeaveTeam} className="bg-destructive hover:bg-destructive/90">Leave Team</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <p className="text-sm text-muted-foreground mt-2">Permanently leave this team.</p>
                        </CardContent>
                    </Card>
                )}

                {isOwner && (
                    <Card className="border-destructive/50">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive"><Trash2 className="w-4 h-4 mr-2"/> Delete Team</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure you want to delete this team?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action is permanent and cannot be undone. All team data will be lost.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteTeam} className="bg-destructive hover:bg-destructive/90">Delete Team</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <p className="text-sm text-muted-foreground mt-2">Permanently delete this team and all of its data.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};
