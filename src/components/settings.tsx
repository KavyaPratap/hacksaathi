'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  ArrowLeft,
  Bell,
  Shield,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  Smartphone,
  Mail,
  MessageSquare,
  Users,
  Eye,
  Lock,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";


export const Settings = () => {
  const router = useRouter();
  const supabase = createClient();
  const { setTheme } = useTheme();

  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    teamInvites: true,
    newMessages: true,
    hackathonUpdates: false,
    weeklyDigest: true
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: true,
    showSkills: true,
    showLocation: true,
    allowDirectMessages: true
  });

  const settingsCategories = [
    {
      title: "Account",
      items: [
        { icon: <Bell />, label: "Notifications", action: "notifications" },
        { icon: <Shield />, label: "Privacy & Security", action: "privacy" },
        { icon: <Globe />, label: "Language & Region", action: "language" }
      ]
    },
    {
      title: "Support",
      items: [
        { icon: <HelpCircle />, label: "Help Center", action: "help" },
        { icon: <MessageSquare />, label: "Contact Support", action: "contact" },
        { icon: <Users />, label: "Community Guidelines", action: "guidelines" }
      ]
    }
  ];

  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };
  
  const handleSettingClick = (action: string) => {
    setActiveSection(action);
  };

  const renderMainSettings = () => (
    <div className="space-y-6">
      {settingsCategories.map((category, index) => (
        <Card key={index} className="p-6 border-0 shadow-soft bg-card">
          <h3 className="text-lg font-semibold mb-4">{category.title}</h3>
          <div className="space-y-1">
            {category.items.map((item, itemIndex) => (
              <button
                key={itemIndex}
                onClick={() => handleSettingClick(item.action)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-smooth text-left"
              >
                <div className="w-5 h-5 text-muted-foreground">
                  {item.icon}
                </div>
                <span className="flex-1">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </Card>
      ))}

      {/* Danger Zone */}
      <Card className="p-6 border-0 shadow-soft bg-card">
        <h3 className="text-lg font-semibold mb-4 text-destructive">Danger Zone</h3>
        <div className="space-y-3">
          <Button onClick={handleSignOut} variant="outline" className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/10">
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
               <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="w-4 h-4 mr-3" />
                  Delete Account
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove your data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={() => toast.error("Account deletion is not yet implemented.")}>
                      Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card className="p-6 border-0 shadow-soft bg-card">
        <h3 className="text-lg font-semibold mb-4">Push Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <Label>Enable push notifications</Label>
            </div>
            <Switch 
              checked={notifications.push}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <Label>Team invitations</Label>
            </div>
            <Switch 
              checked={notifications.teamInvites}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, teamInvites: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <Label>New messages</Label>
            </div>
            <Switch 
              checked={notifications.newMessages}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, newMessages: checked }))}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 border-0 shadow-soft bg-card">
        <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <Label>Email notifications</Label>
            </div>
            <Switch 
              checked={notifications.email}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <Label>Hackathon updates</Label>
            </div>
            <Switch 
              checked={notifications.hackathonUpdates}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, hackathonUpdates: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <Label>Weekly digest</Label>
            </div>
            <Switch 
              checked={notifications.weeklyDigest}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyDigest: checked }))}
            />
          </div>
        </div>
      </Card>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <Card className="p-6 border-0 shadow-soft bg-card">
        <h3 className="text-lg font-semibold mb-4">Profile Visibility</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label>Public profile</Label>
                <p className="text-sm text-muted-foreground">Make your profile visible to other users</p>
              </div>
            </div>
            <Switch 
              checked={privacy.profileVisibility}
              onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, profileVisibility: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label>Show skills</Label>
                <p className="text-sm text-muted-foreground">Display your skills on your profile</p>
              </div>
            </div>
            <Switch 
              checked={privacy.showSkills}
              onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, showSkills: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label>Show location</Label>
                <p className="text-sm text-muted-foreground">Display your location to other users</p>
              </div>
            </div>
            <Switch 
              checked={privacy.showLocation}
              onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, showLocation: checked }))}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 border-0 shadow-soft bg-card">
        <h3 className="text-lg font-semibold mb-4">Communication</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label>Allow direct messages</Label>
                <p className="text-sm text-muted-foreground">Let other users message you directly</p>
              </div>
            </div>
            <Switch 
              checked={privacy.allowDirectMessages}
              onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, allowDirectMessages: checked }))}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 border-0 shadow-soft bg-card">
        <h3 className="text-lg font-semibold mb-4">Security</h3>
        <div className="space-y-3">
          <button onClick={() => router.push('/auth/forgot-password')} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-smooth text-left">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <div>Change password</div>
              <p className="text-sm text-muted-foreground">Update your account password</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => activeSection ? setActiveSection(null) : router.push("/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">
              {activeSection === "notifications" && "Notifications"}
              {activeSection === "privacy" && "Privacy & Security"}
              {activeSection === "appearance" && "Appearance"}
              {!activeSection && "Settings"}
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {!activeSection && renderMainSettings()}
        {activeSection === "notifications" && renderNotificationSettings()}
        {activeSection === "privacy" && renderPrivacySettings()}
        
        {activeSection === "language" && (
          <Card className="p-6 border-0 shadow-soft bg-card">
            <h3 className="text-lg font-semibold mb-4">Language & Region</h3>
            <p className="text-muted-foreground">Multi-language support coming soon!</p>
          </Card>
        )}
        
        {activeSection === "help" && (
          <Card className="p-6 border-0 shadow-soft bg-card">
            <h3 className="text-lg font-semibold mb-4">Help Center</h3>
            <p className="text-muted-foreground">Comprehensive help documentation is being prepared!</p>
          </Card>
        )}
      </div>
    </div>
  );
};
