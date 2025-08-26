
'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast as sonnerToast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Bot,
  Camera,
  Check,
  ChevronLeft,
  Loader2,
  Sparkles,
  User,
  Github,
  Linkedin,
  Globe,
  MapPin,
  Users as GenderIcon,
  Phone,
} from 'lucide-react';
import { generateBio } from '@/ai/flows/profile-flow';
import type { BioInput } from '@/ai/schemas/profile-schema';
import { proctorText, proctorImage } from '@/ai/flows/proctor-flow';

const SKILLS_OPTIONS = [
  'React', 'Python', 'Communication', 'Hardware'
];

const INTEREST_OPTIONS = [
    'Sustainability', 'Health & Wellness', 'FinTech', 'Education', 'Social Good', 
    'Web3', 'Blockchain', 'Gaming', 'AR/VR', 'E-commerce', 'Developer Tools'
];

type Step = 'name' | 'photo' | 'location' | 'phone' | 'gender' | 'skills' | 'interests' | 'experience' | 'socials' | 'bio' | 'review' | 'done';

const Message = ({ children, isUser }: { children: React.ReactNode, isUser: boolean}) => (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        <Avatar className='w-10 h-10'>
            <AvatarFallback>{isUser ? <User /> : <Bot />}</AvatarFallback>
        </Avatar>
        <div className="p-4 rounded-lg bg-background shadow-sm w-full">
            {children}
        </div>
    </div>
);

export function ProfileCreate() {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [user, setUser] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<Step>('name');
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    avatarFile: null as File | null,
    avatarPreview: '',
    techStack: [] as string[],
    interests: [] as string[],
    experience: '',
    bio: '',
    location: '',
    phone: '',
    gender: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
  });

  const [otherSkills, setOtherSkills] = useState("");
  const [conversationHistory, setConversationHistory] = useState<React.ReactNode[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
        setProfileData(prev => ({...prev, fullName: data.user?.user_metadata.full_name || ''}));
      } else {
        router.push('/login');
      }
    };
    fetchUser();
  }, [router, supabase]);

  const handleNextStep = async (nextStep: Step, userInput?: React.ReactNode) => {
    startTransition(async () => {
      // Validation and Proctoring
      if (currentStep === 'name') {
        if (!profileData.fullName.trim()) {
          sonnerToast.error("Please enter your name.");
          return;
        }
        const textResult = await proctorText({ text: profileData.fullName });
        if (!textResult.isSafe) {
          sonnerToast.error("Inappropriate Name", { description: textResult.reason });
          return;
        }
      }
      if (currentStep === 'bio') {
         if (!profileData.bio.trim()) {
          sonnerToast.error("Please write a bio.");
          return;
        }
        const textResult = await proctorText({ text: profileData.bio });
        if (!textResult.isSafe) {
          sonnerToast.error("Inappropriate Bio", { description: textResult.reason });
          return;
        }
      }
      if (currentStep === 'phone') {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format-ish
        if (!profileData.phone.trim() || !phoneRegex.test(profileData.phone.trim())) {
            sonnerToast.error("Please enter a valid phone number.", { description: "Include your country code, e.g., +919876543210"});
            return;
        }
      }
      
      if (userInput) {
          setConversationHistory(prev => [...prev, <Message isUser={true} key={prev.length}>{userInput}</Message>]);
      }
      
      setCurrentStep(nextStep);
    });
  };
  
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const MAX_FILE_SIZE_MB = 5;
      const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

      if (file.size > MAX_FILE_SIZE_BYTES) {
        sonnerToast.error('Image Too Large', {
          description: `Please upload an image smaller than ${MAX_FILE_SIZE_MB}MB.`,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        startTransition(async () => {
          const imageResult = await proctorImage({ photoDataUri: base64data });
          if (!imageResult.isSafe) {
            sonnerToast.error("Inappropriate Image", { description: imageResult.reason });
            return;
          }

          setProfileData(prev => ({
              ...prev,
              avatarFile: file,
              avatarPreview: base64data,
          }));
          
          handleNextStep('location', (
             <div className="w-24 h-24 rounded-lg overflow-hidden">
                <img src={base64data} alt="Avatar preview" className="w-full h-full object-cover" />
            </div>
          ));
        });
      };
    }
  };

  const toggleSelection = (field: 'techStack' | 'interests', value: string) => {
      setProfileData(prev => ({
          ...prev,
          [field]: prev[field].includes(value)
            ? prev[field].filter(item => item !== value)
            : [...prev[field], value]
      }));
  };

  const handleSkillsNext = () => {
    const combinedSkills = [
        ...profileData.techStack,
        ...otherSkills.split(',').map(s => s.trim()).filter(Boolean)
    ];
    // Remove duplicates
    const uniqueSkills = [...new Set(combinedSkills)];
    
    setProfileData(prev => ({...prev, techStack: uniqueSkills }));
    handleNextStep('interests', <blockquote>{uniqueSkills.join(', ')}</blockquote>);
  };

  const handleGenerateBio = () => {
    startTransition(async () => {
      try {
        const bioInput: BioInput = {
          name: profileData.fullName,
          skills: profileData.techStack,
          interests: profileData.interests,
          experience: profileData.experience,
        }
        const generated = await generateBio(bioInput);
        setProfileData(prev => ({...prev, bio: generated}));
        sonnerToast.success("Bio Generated!", { description: "Feel free to edit it as you like."})
      } catch (error) {
        sonnerToast.error("Error generating bio", { description: "Please try again."});
      }
    });
  };

  const handleProfileSubmit = async () => {
    if (!user || !profileData.avatarFile) return;

    startTransition(async () => {
        try {
            const fileExt = profileData.avatarFile!.name.split('.').pop();
            const filePath = `${user.id}/${new Date().getTime()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, profileData.avatarFile!);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

            const { error: profileError } = await supabase.from('users').upsert({
                id: user.id,
                full_name: profileData.fullName,
                avatar_url: urlData.publicUrl,
                tech_stack: profileData.techStack,
                interests: profileData.interests,
                experience: profileData.experience,
                bio: profileData.bio,
                location: profileData.location,
                phone_number: profileData.phone,
                gender: profileData.gender,
                github_url: profileData.github_url,
                linkedin_url: profileData.linkedin_url,
                portfolio_url: profileData.portfolio_url,
                updated_at: new Date().toISOString(),
            });

            if (profileError) throw profileError;
            
            sonnerToast.success("Profile Created!", { description: "Welcome to HackSaathi!"});
            router.push('/dashboard');

        } catch (error: any) {
            sonnerToast.error("Failed to create profile", { description: error.message });
        }
    });
  };

  const handleDetectLocation = () => {
    startTransition(async () => {
        if (!navigator.geolocation) {
            sonnerToast.error("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await response.json();
                const city = data.address.city || data.address.town || data.address.village;
                const country = data.address.country;
                if (city && country) {
                    const locationString = `${city}, ${country}`;
                    setProfileData(p => ({ ...p, location: locationString }));
                    sonnerToast.success("Location Detected!", { description: locationString });
                } else {
                    throw new Error("Could not determine city and country.");
                }
            } catch (error) {
                sonnerToast.error("Could not fetch location name.");
            }
        }, () => {
            sonnerToast.error("Unable to retrieve your location. Please grant permission.");
        });
    });
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 'name':
        return (
            <Message isUser={false}>
                <h3 className="font-semibold mb-2">Welcome to HackSaathi! I'm your personal onboarding assistant. What's your full name?</h3>
                <Input defaultValue={profileData.fullName} onBlur={(e) => setProfileData(p => ({...p, fullName: e.target.value}))} placeholder="e.g., Alex Johnson" />
                <Button onClick={() => handleNextStep('photo', <blockquote>{profileData.fullName}</blockquote>)} className="mt-3" disabled={isPending}>
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Continue
                </Button>
            </Message>
        );
      case 'photo':
        return (
            <Message isUser={false}>
                 <h3 className="font-semibold mb-2">Great to meet you, {profileData.fullName}! Now, please upload a profile picture (max 5MB).</h3>
                 <div className='flex items-center gap-4'>
                    <Avatar className='w-20 h-20'>
                        <AvatarImage src={profileData.avatarPreview} />
                        <AvatarFallback><User className='w-8 h-8' /></AvatarFallback>
                    </Avatar>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isPending}>
                        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                        Upload Photo
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                 </div>
                 <div className='mt-4 flex gap-2'>
                    <Button variant="ghost" onClick={() => setCurrentStep('name')}><ChevronLeft className='w-4 h-4 mr-1' /> Back</Button>
                 </div>
            </Message>
        );
      case 'location':
        return (
          <Message isUser={false}>
            <h3 className="font-semibold mb-2">Where are you located?</h3>
            <div className="space-y-3">
              <Button onClick={handleDetectLocation} disabled={isPending} className="w-full">
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
                Detect My Location
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or enter manually
                    </span>
                </div>
              </div>
              <Input 
                value={profileData.location} 
                onChange={(e) => setProfileData(p => ({ ...p, location: e.target.value }))} 
                placeholder="e.g., San Francisco, CA" 
              />
            </div>
            <div className='mt-4 flex gap-2'>
              <Button variant="ghost" onClick={() => setCurrentStep('photo')}><ChevronLeft className='w-4 h-4 mr-1' /> Back</Button>
              <Button onClick={() => handleNextStep('phone', <blockquote>{profileData.location}</blockquote>)} disabled={isPending || !profileData.location}>Next</Button>
            </div>
          </Message>
        );
      case 'phone':
        return (
            <Message isUser={false}>
                <h3 className="font-semibold mb-2">What is your phone number?</h3>
                <p className="text-sm text-muted-foreground mb-3">This is for administrative use only and will not be shown on your public profile. <br/><strong className="font-semibold">It cannot be changed later.</strong></p>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        value={profileData.phone} 
                        onChange={(e) => setProfileData(p => ({ ...p, phone: e.target.value }))} 
                        placeholder="+919876543210"
                        className="pl-10"
                    />
                </div>
                <div className='mt-4 flex gap-2'>
                    <Button variant="ghost" onClick={() => setCurrentStep('location')}><ChevronLeft className='w-4 h-4 mr-1' /> Back</Button>
                    <Button onClick={() => handleNextStep('gender', <blockquote>Phone number added</blockquote>)} disabled={isPending || !profileData.phone}>Next</Button>
                </div>
            </Message>
        );
      case 'gender':
          return (
            <Message isUser={false}>
              <h3 className="font-semibold mb-2">What is your gender?</h3>
              <RadioGroup value={profileData.gender} onValueChange={(val) => setProfileData(p => ({ ...p, gender: val }))} className='space-y-2'>
                <div className="flex items-center space-x-2"><RadioGroupItem value="male" id="male" /><Label htmlFor="male">Male</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="female" id="female" /><Label htmlFor="female">Female</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="other" id="other" /><Label htmlFor="other">Other</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="prefer_not_to_say" id="prefer_not_to_say" /><Label htmlFor="prefer_not_to_say">Prefer not to say</Label></div>
              </RadioGroup>
              <div className='mt-4 flex gap-2'>
                <Button variant="ghost" onClick={() => setCurrentStep('phone')}><ChevronLeft className='w-4 h-4 mr-1' /> Back</Button>
                <Button onClick={() => handleNextStep('skills', <blockquote>Selected {profileData.gender}</blockquote>)} disabled={!profileData.gender}>Next</Button>
              </div>
            </Message>
          );
      case 'skills':
          return (
            <Message isUser={false}>
                <h3 className="font-semibold mb-2">What are your top skills? Select from the list or add your own.</h3>
                <div className="flex flex-wrap gap-2">
                    {SKILLS_OPTIONS.map(skill => (
                        <Badge key={skill} variant={profileData.techStack.includes(skill) ? 'default' : 'secondary'} onClick={() => toggleSelection('techStack', skill)} className="cursor-pointer">{skill}</Badge>
                    ))}
                </div>

                <div className="mt-4 space-y-2">
                    <Label htmlFor="other-skills">Other Skills</Label>
                    <Input 
                        id="other-skills"
                        placeholder="e.g., Figma, Node.js, Public Speaking"
                        value={otherSkills}
                        onChange={(e) => setOtherSkills(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Enter any other skills, separated by commas.</p>
                </div>

                <div className='mt-4 flex gap-2'>
                    <Button variant="ghost" onClick={() => setCurrentStep('gender')}><ChevronLeft className='w-4 h-4 mr-1' /> Back</Button>
                    <Button onClick={handleSkillsNext}>Next Step</Button>
                </div>
            </Message>
          )
      case 'interests':
          return (
            <Message isUser={false}>
                 <h3 className="font-semibold mb-2">What kind of projects are you passionate about?</h3>
                 <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map(interest => (
                        <Badge key={interest} variant={profileData.interests.includes(interest) ? 'default' : 'secondary'} onClick={() => toggleSelection('interests', interest)} className="cursor-pointer">{interest}</Badge>
                    ))}
                 </div>
                 <div className='mt-4 flex gap-2'>
                    <Button variant="ghost" onClick={() => setCurrentStep('skills')}><ChevronLeft className='w-4 h-4 mr-1' /> Back</Button>
                    <Button onClick={() => handleNextStep('experience', <blockquote>{profileData.interests.join(', ')}</blockquote>)}>Next Step</Button>
                 </div>
            </Message>
          )
      case 'experience':
        return (
            <Message isUser={false}>
                 <h3 className="font-semibold mb-2">What's your experience level?</h3>
                 <RadioGroup value={profileData.experience} onValueChange={(val) => setProfileData(p => ({...p, experience: val}))} className='space-y-2'>
                     <div className="flex items-center space-x-2"><RadioGroupItem value="beginner" id="beginner" /><Label htmlFor="beginner">Beginner (Just starting out)</Label></div>
                     <div className="flex items-center space-x-2"><RadioGroupItem value="intermediate" id="intermediate" /><Label htmlFor="intermediate">Intermediate (A few projects under my belt)</Label></div>
                     <div className="flex items-center space-x-2"><RadioGroupItem value="advanced" id="advanced" /><Label htmlFor="advanced">Advanced (Multiple years of experience)</Label></div>
                 </RadioGroup>
                 <div className='mt-4 flex gap-2'>
                    <Button variant="ghost" onClick={() => setCurrentStep('interests')}><ChevronLeft className='w-4 h-4 mr-1' /> Back</Button>
                    <Button onClick={() => handleNextStep('socials', <blockquote>{profileData.experience}</blockquote>)} disabled={!profileData.experience}>Next Step</Button>
                 </div>
            </Message>
        )
      case 'socials':
        return (
          <Message isUser={false}>
            <h3 className="font-semibold mb-2">Share your professional links (optional).</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2"><Github className="w-5 h-5 text-muted-foreground" /><Input value={profileData.github_url} onChange={(e) => setProfileData(p => ({...p, github_url: e.target.value}))} placeholder="GitHub URL" /></div>
              <div className="flex items-center gap-2"><Linkedin className="w-5 h-5 text-muted-foreground" /><Input value={profileData.linkedin_url} onChange={(e) => setProfileData(p => ({...p, linkedin_url: e.target.value}))} placeholder="LinkedIn URL" /></div>
              <div className="flex items-center gap-2"><Globe className="w-5 h-5 text-muted-foreground" /><Input value={profileData.portfolio_url} onChange={(e) => setProfileData(p => ({...p, portfolio_url: e.target.value}))} placeholder="Portfolio URL" /></div>
            </div>
            <div className='mt-4 flex gap-2'>
              <Button variant="ghost" onClick={() => setCurrentStep('experience')}><ChevronLeft className='w-4 h-4 mr-1' /> Back</Button>
              <Button onClick={() => handleNextStep('bio', <blockquote>Links saved</blockquote>)}>Next</Button>
            </div>
          </Message>
        );
      case 'bio':
        return (
            <Message isUser={false}>
                 <h3 className="font-semibold mb-2">Last step! Write a short bio. Or, I can generate one for you based on your profile.</h3>
                 <Textarea value={profileData.bio} onChange={(e) => setProfileData(p => ({...p, bio: e.target.value}))} placeholder="Tell us a bit about yourself..." rows={4} />
                 <Button onClick={handleGenerateBio} variant="outline" size="sm" className="mt-2" disabled={isPending}>
                     {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                     Generate with AI
                 </Button>
                 <div className='mt-4 flex gap-2'>
                    <Button variant="ghost" onClick={() => setCurrentStep('socials')}><ChevronLeft className='w-4 h-4 mr-1' /> Back</Button>
                    <Button onClick={() => handleNextStep('review', <blockquote>{profileData.bio || '(Skipped)'}</blockquote>)} disabled={isPending || !profileData.bio}>
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Review Profile
                    </Button>
                 </div>
            </Message>
        )
      case 'review':
        return (
            <Message isUser={false}>
                <h3 className="font-semibold mb-4">Everything looks great! Here's your profile. Ready to go?</h3>
                <div className="p-4 border rounded-lg bg-background/50 space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16"><AvatarImage src={profileData.avatarPreview} /></Avatar>
                        <div>
                          <h4 className='text-xl font-bold'>{profileData.fullName}</h4>
                          <p className="text-sm text-muted-foreground">{profileData.location}</p>
                        </div>
                    </div>
                    <div><strong className='text-sm text-muted-foreground'>Bio:</strong><p>{profileData.bio}</p></div>
                    <div><strong className='text-sm text-muted-foreground'>Experience:</strong><p className='capitalize'>{profileData.experience}</p></div>
                    <div>
                        <strong className='text-sm text-muted-foreground'>Skills:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {profileData.techStack.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                        </div>
                    </div>
                    <div>
                        <strong className='text-sm text-muted-foreground'>Interests:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {profileData.interests.map(i => <Badge key={i} variant="outline">{i}</Badge>)}
                        </div>
                    </div>
                </div>
                 <div className='mt-4 flex gap-2'>
                    <Button variant="ghost" onClick={() => setCurrentStep('bio')}><ChevronLeft className='w-4 h-4 mr-1' /> Back</Button>
                    <Button onClick={handleProfileSubmit} disabled={isPending}>
                        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                        Finish & Create Profile
                    </Button>
                 </div>
            </Message>
        )
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-end p-4">
        <div className="w-full max-w-2xl space-y-4 h-[90vh] overflow-y-auto pb-4">
            {conversationHistory}
            {renderStepContent()}
        </div>
    </div>
  );
}

