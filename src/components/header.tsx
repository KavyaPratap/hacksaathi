
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import {
  Code,
  Bell,
  Settings,
  Users,
  Star,
  MessageSquare,
  Mail,
  UserPlus,
  Check,
  Shield,
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);


  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
            .from('users')
            .select('full_name, avatar_url, role')
            .eq('id', authUser.id)
            .single();
        setUser({ ...authUser, ...profile });
        if (profile?.role === 'admin') {
            setIsAdmin(true);
        }
      }
    };
    fetchUserAndProfile();
  }, [supabase]);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
      } else {
        setNotifications(data);
        const unread = data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    };
    
    fetchNotifications();

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        toast.info("You have a new notification!");
        setNotifications(current => [payload.new, ...current]);
        setUnreadCount(current => current + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }

  }, [user, supabase]);


  const handleProfileClick = () => {
    router.push('/profile');
  };

  const handleSettingsClick = () => {
    router.push('/settings');
  };
  
  const handleAdminClick = () => {
    router.push('/admin/dashboard');
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: <Star /> },
    { href: '/discover', label: 'Discover', icon: <Users /> },
    { href: '/chat', label: 'Chat', icon: <MessageSquare /> },
  ];

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50 h-[var(--header-height)]">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
                <Code className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold hidden sm:block">HackSaathi</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  variant={pathname === link.href ? 'secondary' : 'ghost'}
                  onClick={() => router.push(link.href)}
                  className="gap-2"
                >
                  {link.icon}
                  {link.label}
                </Button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
                <Button variant="outline" size="sm" onClick={handleAdminClick}>
                    <Shield className="w-4 h-4 mr-2"/>
                    Admin
                </Button>
            )}
            <ThemeToggle />
            
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent className="flex flex-col">
                    <SheetHeader>
                        <SheetTitle>Notifications</SheetTitle>
                    </SheetHeader>
                    <NotificationList 
                        notifications={notifications} 
                        setNotifications={setNotifications}
                        unreadCount={unreadCount}
                        setUnreadCount={setUnreadCount} 
                        userId={user?.id}
                    />
                </SheetContent>
            </Sheet>


            <Button
              variant="ghost"
              size="icon"
              onClick={handleSettingsClick}
            >
              <Settings className="w-5 h-5" />
            </Button>

            <Avatar
              className="hover-scale cursor-pointer"
              onClick={handleProfileClick}
            >
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback>{user?.full_name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
};


const NotificationList = ({ notifications, setNotifications, unreadCount, setUnreadCount, userId }: { notifications: any[], setNotifications: Function, unreadCount: number, setUnreadCount: Function, userId: string }) => {
    const supabase = createClient();
    const router = useRouter();
  
    const handleAcceptInvite = async (notification: any) => {
        if (!notification.data.team_id || !notification.id) {
            toast.error("Invalid invitation. Team ID is missing.");
            return;
        }

        const { error } = await supabase.from('team_members').insert({
            team_id: notification.data.team_id,
            user_id: notification.user_id,
            role: 'member'
        });

        if (error) {
            toast.error("Failed to join team.", { description: error.message });
        } else {
            toast.success(`You have joined ${notification.data.team_name}!`);
            await supabase.from('activity_log').insert({ 
                user_id: notification.user_id, 
                action: 'joined team', 
                details: { team_name: notification.data.team_name } 
            });
            // Mark the original request as 'approved'
            await supabase
              .from('team_join_requests')
              .update({ status: 'approved' })
              .eq('team_id', notification.data.team_id)
              .eq('user_id', notification.user_id);
              
            await handleMarkAsRead(notification.id);
        }
    };
  
    const handleMarkAsRead = async (id: number) => {
        const notification = notifications.find(n => n.id === id);
        const wasUnread = notification && !notification.is_read;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
        
        if (!error) {
            setNotifications((current: any[]) => 
                current.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            if(wasUnread) setUnreadCount((count: number) => Math.max(0, count - 1));
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!userId) return;
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        
        if (!error) {
            setNotifications((current: any[]) => 
                current.map(n => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);
            toast.success("All notifications marked as read.");
        } else {
            toast.error("Failed to mark all as read.", { description: error.message });
        }
    };

    const getNotificationContent = (n: any) => {
        if (n.type === 'team_invite') {
            return {
                icon: <UserPlus className="w-5 h-5 text-primary" />,
                message: <>You have an invitation from <span className="font-semibold">{n.data.sender_name}</span> to join the team <span className="font-semibold">"{n.data.team_name}"</span>.</>,
                action: (
                    <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => handleAcceptInvite(n)}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(n.id)}>Decline</Button>
                    </div>
                )
            }
        }
        if (n.type === 'team_response') {
             return {
                icon: <Mail className="w-5 h-5 text-blue-500" />,
                message: <>Your request to join <span className="font-semibold">{n.data.team_name}</span> was <span className={`font-semibold ${n.data.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}>{n.data.status}</span>.</>,
                action: (
                    <SheetClose asChild>
                        <Button size="sm" variant="outline" className="mt-2" onClick={() => {
                            handleMarkAsRead(n.id)
                            if (n.data.status === 'approved') {
                                router.push(`/teams/${n.data.team_id}`)
                            }
                        }}>
                            <Check className="w-4 h-4 mr-2" />
                            {n.data.status === 'approved' ? 'View Team' : 'Mark as read'}
                        </Button>
                    </SheetClose>
                )
            }
        }
        if (n.type === 'new_message') {
            return {
                icon: <MessageSquare className="w-5 h-5 text-green-500" />,
                message: <>You have a new message from <span className="font-semibold">{n.data.sender_name}</span>: <span className="italic text-muted-foreground">"{n.data.message_content.substring(0, 30)}..."</span></>,
                action: (
                     <SheetClose asChild>
                        <Button size="sm" variant="outline" className="mt-2" onClick={() => {
                            handleMarkAsRead(n.id)
                            router.push(`/chat?conversationId=${n.data.conversation_id}`)
                        }}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            View Message
                        </Button>
                    </SheetClose>
                )
            }
        }
        return {
            icon: <Bell className="w-5 h-5 text-muted-foreground" />,
            message: "You have a new notification."
        }
    }
  
    if (!notifications || notifications.length === 0) {
      return <div className="text-center text-muted-foreground py-10 flex-1">You have no notifications.</div>;
    }
  
    return (
      <>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3 pr-2">
            {notifications.map((n) => {
              const { icon, message, action } = getNotificationContent(n);
              return (
                <div key={n.id} className={`p-3 rounded-lg ${n.is_read ? 'bg-transparent' : 'bg-primary/10'}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{icon}</div>
                    <div className="flex-1">
                      <p className="text-sm">{message}</p>
                      <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                      {!n.is_read && action}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <SheetFooter className="mt-auto pt-4 border-t -mx-6 px-6">
            <Button variant="outline" className="w-full" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                Mark all as read
            </Button>
        </SheetFooter>
      </>
    );
  };

export default Header;
