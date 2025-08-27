
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Search, MoreHorizontal, User, Shield, CheckCircle, Ban, Trash2, KeyRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Link from 'next/link';

type User = {
    id: string;
    full_name: string;
    avatar_url: string;
    role: 'admin' | 'user';
    banned_until: string | null;
};

// We need to fetch auth users separately to get their email
type AuthUser = {
    id: string;
    email?: string;
}

export default function AdminUsersPage() {
    const supabase = createClient();
    const [users, setUsers] = useState<User[]>([]);
    const [authUsers, setAuthUsers] = useState<Map<string, AuthUser>>(new Map());
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        // 1. Fetch public profiles
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, full_name, avatar_url, role, banned_until');
        
        if (usersError) {
            toast.error("Failed to fetch users", { description: usersError.message });
            setLoading(false);
            return;
        }
        
        setUsers(usersData || []);

        // 2. Fetch corresponding auth users to get emails using the admin API
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
            toast.error("Failed to fetch user emails", { description: "This action requires elevated privileges. " + authError.message });
        } else {
            const authUsersMap = new Map(authData.users.map(u => [u.id, u]));
            setAuthUsers(authUsersMap);
        }
        
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, [supabase]);

    const handlePasswordReset = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/update-password`,
        });
        if (error) {
            toast.error("Failed to send password reset link.", { description: error.message });
        } else {
            toast.success("Password reset link sent successfully.", { description: `An email has been sent to ${email}.` });
        }
    };

    const handleBanUser = async (userId: string, durationDays: number | null) => {
        const banned_until = durationDays ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString() : null;
        const { error } = await supabase.from('users').update({ banned_until }).eq('id', userId);

        if (error) {
            toast.error("Failed to update user status.", { description: error.message });
        } else {
            toast.success(`User has been ${durationDays ? 'banned' : 'unbanned'}.`);
            fetchUsers(); // Refresh the user list
        }
    };

    const handleDeleteUser = async (userId: string) => {
        const { data, error } = await supabase.rpc('delete_user', { user_id_to_delete: userId });

        if (error || (data && data.startsWith('Permission denied'))) {
            toast.error("Failed to delete user.", { description: error?.message || data });
        } else {
            toast.success("User successfully deleted.");
            fetchUsers(); // Refresh the list
        }
    };

    const filteredUsers = users.filter(user => {
        const authUser = authUsers.get(user.id);
        return user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               authUser?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name or email..." 
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
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map(user => {
                            const email = authUsers.get(user.id)?.email;
                            const isEmailValid = email && email !== 'Email not available';
                            return (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.avatar_url} />
                                                <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{user.full_name}</div>
                                                <div className="text-sm text-muted-foreground">{email || 'Email not available'}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                            {user.role === 'admin' ? <Shield className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.banned_until && new Date(user.banned_until) > new Date() ? (
                                            <Badge variant="destructive">Banned</Badge>
                                        ) : (
                                            <Badge variant="success">Active</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => isEmailValid && handlePasswordReset(email)} disabled={!isEmailValid}>
                                                        <KeyRound className="h-4 w-4 mr-2" /> Send Password Reset
                                                    </DropdownMenuItem>
                                                    {user.banned_until && new Date(user.banned_until) > new Date() ? (
                                                        <DropdownMenuItem onClick={() => handleBanUser(user.id, null)}>
                                                            <CheckCircle className="h-4 w-4 mr-2" /> Unban User
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleBanUser(user.id, 7)}>
                                                            <Ban className="h-4 w-4 mr-2" /> Ban for 7 days
                                                        </DropdownMenuItem>
                                                    )}
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete User
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the user <span className="font-semibold">{user.full_name}</span> and all their associated data. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">Delete User</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
