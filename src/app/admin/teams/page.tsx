'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Search, Users, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type Team = {
    id: string;
    name: string;
    project_name: string;
    description: string;
    users: { full_name: string }; // Correctly aliased from owner_id
    team_members: { count: number }[];
};

export default function AdminTeamsPage() {
    const supabase = createClient();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchTeams = async () => {
            setLoading(true);
            // Corrected the query to explicitly reference the foreign key relationship
            const { data, error } = await supabase
                .from('teams')
                .select(`
                    id,
                    name,
                    project_name,
                    description,
                    users:owner_id(full_name),
                    team_members(count)
                `);

            if (error) {
                toast.error("Failed to fetch teams", { description: error.message });
            } else {
                setTeams(data as any);
            }
            setLoading(false);
        };
        fetchTeams();
    }, [supabase]);

    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.users.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>All Teams</CardTitle>
                 <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by team, project, or owner..." 
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Team Name</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Members</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTeams.map(team => (
                            <TableRow key={team.id}>
                                <TableCell className="font-semibold">{team.name}</TableCell>
                                <TableCell>{team.project_name}</TableCell>
                                <TableCell>{team.users.full_name}</TableCell>
                                <TableCell>{team.team_members[0].count}</TableCell>
                                <TableCell>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/teams/${team.id}`}>View</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
