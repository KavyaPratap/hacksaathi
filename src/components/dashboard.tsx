'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  Users, 
  MessageCircle, 
  Star,
  Code,
  UserPlus,
  Bell,
  Settings,
  Activity,
  Calendar,
  Trophy,
  Lightbulb,
  Wand2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

export const Dashboard = () => {
  const router = useRouter();

  const handleProfileClick = () => {
    // This now navigates to the user's own editable profile
    window.location.href = "/profile";
  };

  const handleSettingsClick = () => {
    window.location.href = "/settings";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
                <Code className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">HackSaathi</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></span>
              </Button>
              
              <Button variant="ghost" size="icon" onClick={handleSettingsClick}>
                <Settings className="w-5 h-5" />
              </Button>
              
              <Avatar className="hover-scale cursor-pointer" onClick={handleProfileClick}>
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" />
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="container mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search teams, people, or projects..." className="pl-10" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="container mx-auto px-4 mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <QuickActionCard 
            icon={<Wand2 className="w-6 h-6 text-primary" />}
            title="PeerJet"
            subtitle="AI Teammate Finder"
            onClick={() => window.location.href = "/profile/finder"}
          />
          <QuickActionCard 
            icon={<Star className="w-6 h-6 text-primary" />}
            title="Discover"
            subtitle="Find teammates"
            onClick={() => window.location.href = "/discover"}
          />
          <QuickActionCard 
            icon={<Users className="w-6 h-6 text-primary" />}
            title="My Teams"
            subtitle="View teams"
            onClick={() => window.location.href = "/teams"}
          />
          <QuickActionCard 
            icon={<MessageCircle className="w-6 h-6 text-primary" />}
            title="Chat"
            subtitle="Messages"
            onClick={() => window.location.href = "/chat"}
          />
        </div>
      </div>

      {/* Activity Feed */}
      <div className="container mx-auto px-4 mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <ActivityItem 
            icon={<UserPlus className="w-5 h-5 text-green-600" />}
            title="New team member joined"
            description="Sarah joined your EcoTrack project"
            time="2h ago"
          />
          <ActivityItem 
            icon={<MessageCircle className="w-5 h-5 text-blue-600" />}
            title="New message in team chat"
            description="Project Phoenix team discussion"
            time="4h ago"
          />
          <ActivityItem 
            icon={<Trophy className="w-5 h-5 text-yellow-600" />}
            title="Hackathon submission completed"
            description="HealthHub project submitted to MLH"
            time="1d ago"
          />
        </div>
      </div>

      {/* Suggested Teams */}
      <div className="container mx-auto px-4 pb-8">
        <h2 className="text-xl font-semibold mb-4">Suggested Teams</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <SuggestedTeamCard 
            name="Team Alpha"
            members={4}
            project="AI-powered fitness tracker"
            skills={["React", "Python", "ML"]}
          />
          <SuggestedTeamCard 
            name="Team Beta"
            members={6}
            project="Sustainable energy dashboard"
            skills={["Vue.js", "Node.js", "IoT"]}
          />
        </div>
      </div>
    </div>
  );
};

const QuickActionCard = ({ icon, title, subtitle, onClick }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) => (
  <Card className="p-4 hover-lift cursor-pointer border-0 shadow-soft bg-card" onClick={onClick}>
    <div className="text-center">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-soft">
        {icon}
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  </Card>
);

const ActivityItem = ({ icon, title, description, time }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
}) => (
  <Card className="p-4 border-0 shadow-soft bg-card">
    <div className="flex items-start gap-3">
      <div className="mt-1">{icon}</div>
      <div className="flex-1">
        <h4 className="font-medium text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground">{time}</span>
    </div>
  </Card>
);

const SuggestedTeamCard = ({ name, members, project, skills }: {
  name: string;
  members: number;
  project: string;
  skills: string[];
}) => (
  <Card className="p-4 hover-lift border-0 shadow-soft bg-card">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-10 h-10 gradient-secondary rounded-xl flex items-center justify-center">
        <Lightbulb className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground">{members} members</p>
      </div>
    </div>
    
    <p className="text-sm text-muted-foreground mb-3">{project}</p>
    
    <div className="flex flex-wrap gap-1 mb-4">
      {skills.map((skill, index) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {skill}
        </Badge>
      ))}
    </div>
    
    <Button size="sm" className="w-full">Join Team</Button>
  </Card>
);
