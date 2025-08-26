
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowRight, ArrowLeft, Wand2, Users, MessageSquare, UserPlus, Search, CheckCircle, Bell, Settings, Shield } from 'lucide-react';

const tourSteps = [
  {
    icon: <Wand2 className="h-8 w-8 text-primary" />,
    title: 'Welcome to HackSaathi!',
    content: 'This quick tour will walk you through the key features to help you find your perfect hackathon team and start building.',
  },
  {
    icon: <Search className="h-8 w-8 text-primary" />,
    title: 'AI-Powered Teammate Search',
    content: "The dashboard has two main ways to find people. Use 'PeerJet' for an AI-powered search, or 'Discover' to browse all users. You can also use the search bar at the top for quick lookups.",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Find, Create, and Manage Teams',
    content: 'Under "Quick Actions", click "Find a Team" to browse existing teams. You can also create and manage your own teams right from the dashboard in the "My Teams" section.',
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: 'Chat & Collaborate',
    content: 'Use the "Chat" action to access your direct messages and team chats. This is where you can coordinate with your new teammates and plan your project.',
  },
  {
    icon: <Bell className="h-8 w-8 text-primary" />,
    title: 'Notifications',
    content: 'Click the Bell icon in the top-right header to see your notifications. This is where you\'ll find team invites and responses to your join requests.',
  },
  {
    icon: <UserPlus className="h-8 w-8 text-primary" />,
    title: 'Your Profile & Settings',
    content: 'Click your avatar in the header to manage your profile. A detailed profile helps others find you! Use the Gear icon to access account settings.',
  },
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: 'Community Safety',
    content: 'We use AI (the Proctor flow) to moderate content like profile pictures and text to ensure a safe and professional environment. Please adhere to community guidelines.',
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-green-500" />,
    title: 'You\'re All Set!',
    content: 'That\'s the rundown! You can always access these features from the dashboard or the header navigation. Happy hacking!',
  }
];

export const ProductTour = ({ onComplete }: { onComplete: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsOpen(false);
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleSkip = () => {
      setIsOpen(false);
      onComplete();
  }

  const step = tourSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) handleSkip() }}>
      <DialogContent 
        className="tour-dialog"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center items-center">
            <div className="mb-4">
                {step.icon}
            </div>
          <DialogTitle className="text-2xl">{step.title}</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground pt-2">{step.content}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-between w-full mt-4">
            <Button variant="ghost" onClick={handleSkip}>Skip Tour</Button>
            <div className='flex gap-2'>
              {currentStep > 0 && <Button variant="outline" onClick={handlePrev}><ArrowLeft className="mr-2 h-4 w-4"/> Previous</Button>}
              <Button onClick={handleNext}>
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                {currentStep < tourSteps.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
