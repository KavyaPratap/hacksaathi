'use client';
import { useState, useEffect, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft,
  Edit3,
  Save,
  Camera,
  Plus,
  X,
  MapPin,
  Calendar,
  Github,
  Linkedin,
  Globe,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { proctorText, proctorImage } from "@/ai/flows/proctor-flow";

const UserProfile = () => {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error && error.code === 'PGRST116') {
          // Profile does not exist for this user, redirect to creation.
          router.push('/profile/create');
          return;
        } else if (error) {
          toast.error("Error fetching profile", { description: error.message });
          setLoading(false);
          return;
        }
        
        if (data) {
          setProfileData({ ...data, email: user.email });
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [supabase, router]);

  const handleSave = () => {
    startTransition(async () => {
        if (!user || !profileData) return;

        // Proctor text fields
        const nameResult = await proctorText({ text: profileData.full_name });
        if (!nameResult.isSafe) {
            toast.error("Inappropriate Name", { description: nameResult.reason });
            return;
        }

        const bioResult = await proctorText({ text: profileData.bio });
        if (!bioResult.isSafe) {
            toast.error("Inappropriate Bio", { description: bioResult.reason });
            return;
        }

        try {
            let avatarUrl = profileData.avatar_url;

            // Proctor and upload new avatar if selected
            if (profileData.avatarFile) {
                const file = profileData.avatarFile;
                const reader = new FileReader();
                reader.readAsDataURL(file);
                
                const imageResult = await new Promise<any>((resolve) => {
                    reader.onloadend = async () => {
                        const base64data = reader.result as string;
                        const result = await proctorImage({ photoDataUri: base64data });
                        resolve(result);
                    };
                });

                if (!imageResult.isSafe) {
                    toast.error("Inappropriate Image", { description: imageResult.reason });
                    return;
                }

                const fileExt = file.name.split('.').pop();
                const filePath = `${user.id}/${new Date().getTime()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                avatarUrl = urlData.publicUrl;
            }

            const { error } = await supabase
                .from('users')
                .update({
                    full_name: profileData.full_name,
                    bio: profileData.bio,
                    location: profileData.location,
                    tech_stack: profileData.tech_stack,
                    interests: profileData.interests,
                    experience: profileData.experience,
                    github_url: profileData.github_url,
                    linkedin_url: profileData.linkedin_url,
                    portfolio_url: profileData.portfolio_url,
                    avatar_url: avatarUrl,
                })
                .eq('id', user.id);

            if (error) throw error;
            
            toast.success("Profile Updated Successfully!");
            setIsEditing(false);
        } catch (error: any) {
            toast.error('Error updating profile', { description: error.message });
        }
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileData((prev: any) => ({
          ...prev,
          avatarFile: file,
          avatar_url: URL.createObjectURL(file), // For instant preview
      }));
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profileData.tech_stack.includes(newSkill.trim())) {
      setProfileData((prev: any) => ({
        ...prev,
        tech_stack: [...prev.tech_stack, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfileData((prev: any) => ({
      ...prev,
      tech_stack: prev.tech_stack.filter((skill: string) => skill !== skillToRemove)
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !profileData.interests.includes(newInterest.trim())) {
      setProfileData((prev: any) => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest("");
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setProfileData((prev: any) => ({
      ...prev,
      interests: prev.interests.filter((interest: string) => interest !== interestToRemove)
    }));
  };

  if (loading || !profileData) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold">My Profile</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {isEditing ? (
                 <Button onClick={handleSave} size="sm" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                 </Button>
              ) : (
                <>
                  <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                   <Button onClick={() => router.push('/profile/create')} size="sm" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 border-0 shadow-soft bg-card">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileData.avatar_url} />
                <AvatarFallback>{profileData.full_name?.[0]}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button size="icon" className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="w-4 h-4" />
                </Button>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </div>
            
            {isEditing ? (
              <div className="w-full max-w-sm space-y-3">
                <Input 
                  value={profileData.full_name}
                  onChange={(e) => setProfileData((prev: any) => ({ ...prev, full_name: e.target.value }))}
                  className="text-center font-semibold text-lg"
                />
                <Textarea 
                  value={profileData.bio}
                  onChange={(e) => setProfileData((prev: any) => ({ ...prev, bio: e.target.value }))}
                  className="text-center"
                  rows={3}
                />
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold">{profileData.full_name}</h2>
                <p className="text-muted-foreground max-w-md">{profileData.bio}</p>
              </>
            )}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {isEditing ? (
                  <Input 
                    value={profileData.location}
                    onChange={(e) => setProfileData((prev: any) => ({ ...prev, location: e.target.value }))}
                    className="h-6 text-sm"
                  />
                ) : (
                  <span>{profileData.location}</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-soft bg-card">
          <h3 className="text-lg font-semibold mb-4">Contact & Links</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Label className="w-20 text-sm">Email</Label>
              <span className="text-sm">{profileData.email}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Github className="w-5 h-5" />
              {isEditing ? (
                <Input 
                  value={profileData.github_url || ''}
                  onChange={(e) => setProfileData((prev: any) => ({ ...prev, github_url: e.target.value }))}
                  className="flex-1"
                  placeholder="GitHub URL"
                />
              ) : (
                <a href={profileData.github_url} className="text-sm text-primary hover:underline">
                  {profileData.github_url}
                </a>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Linkedin className="w-5 h-5" />
              {isEditing ? (
                <Input 
                  value={profileData.linkedin_url || ''}
                  onChange={(e) => setProfileData((prev: any) => ({ ...prev, linkedin_url: e.target.value }))}
                  className="flex-1"
                  placeholder="LinkedIn URL"
                />
              ) : (
                <a href={profileData.linkedin_url} className="text-sm text-primary hover:underline">
                  {profileData.linkedin_url}
                </a>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5" />
              {isEditing ? (
                <Input 
                  value={profileData.portfolio_url || ''}
                  onChange={(e) => setProfileData((prev: any) => ({ ...prev, portfolio_url: e.target.value }))}
                  className="flex-1"
                  placeholder="Portfolio URL"
                />
              ) : (
                <a href={profileData.portfolio_url} className="text-sm text-primary hover:underline">
                  {profileData.portfolio_url}
                </a>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-soft bg-card">
          <h3 className="text-lg font-semibold mb-4">Skills</h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {profileData.tech_stack?.map((skill: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {skill}
                  {isEditing && (
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            
            {isEditing && (
              <div className="flex gap-2">
                <Input 
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill..."
                  onKeyPress={(e) => e.key === "Enter" && addSkill()}
                  className="flex-1"
                />
                <Button size="sm" onClick={addSkill}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-soft bg-card">
          <h3 className="text-lg font-semibold mb-4">Interests</h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {profileData.interests?.map((interest: string, index: number) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {interest}
                  {isEditing && (
                    <button
                      onClick={() => removeInterest(interest)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            
            {isEditing && (
              <div className="flex gap-2">
                <Input 
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add an interest..."
                  onKeyPress={(e) => e.key === "Enter" && addInterest()}
                  className="flex-1"
                />
                <Button size="sm" onClick={addInterest}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-soft bg-card">
          <h3 className="text-lg font-semibold mb-4">Experience</h3>
          {isEditing ? (
            <Textarea 
              value={profileData.experience}
              onChange={(e) => setProfileData((prev: any) => ({ ...prev, experience: e.target.value }))}
              placeholder="Describe your experience..."
              rows={3}
            />
          ) : (
            <p className="text-muted-foreground">{profileData.experience}</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
