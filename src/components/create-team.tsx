
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, ArrowLeft, Check, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { proctorText } from '@/ai/flows/proctor-flow';

interface CreateTeamForm {
  teamName: string;
  projectName: string;
  description: string;
  skills_needed: string;
  bannerUrl: string;
  member_limit: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const bannerImages = [
    `${supabaseUrl}/storage/v1/object/public/media/teambanner0.png`,
    `${supabaseUrl}/storage/v1/object/public/media/teambanner2.png`,
    `${supabaseUrl}/storage/v1/object/public/media/teambanner3.png`,
    `${supabaseUrl}/storage/v1/object/public/media/teambanner4.png`,
    `${supabaseUrl}/storage/v1/object/public/media/teambanner5.png`,
    `${supabaseUrl}/storage/v1/object/public/media/teambanner6.png`
];


export const CreateTeam = () => {
  const { register, handleSubmit, watch, setValue, control, formState: { errors, isSubmitting } } = useForm<CreateTeamForm>({
    defaultValues: {
        bannerUrl: bannerImages[0],
        member_limit: 5,
    }
  });
  const router = useRouter();
  const supabase = createClient();
  
  const watchedValues = watch();

  const onSubmit = async (data: CreateTeamForm) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Not Authenticated", { description: "You must be logged in to create a team." });
        return;
      }
      
      // Proctor team name and description
      const nameResult = await proctorText({ text: data.teamName });
      if (!nameResult.isSafe) {
          toast.error("Inappropriate Team Name", { description: nameResult.reason });
          return;
      }

      const descriptionResult = await proctorText({ text: data.description });
      if (!descriptionResult.isSafe) {
          toast.error("Inappropriate Description", { description: descriptionResult.reason });
          return;
      }

      const skillsArray = data.skills_needed.split(',').map(skill => skill.trim()).filter(Boolean);

      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: data.teamName,
          project_name: data.projectName,
          description: data.description,
          banner_url: data.bannerUrl,
          owner_id: user.id,
          skills_needed: skillsArray,
          member_limit: data.member_limit
        })
        .select()
        .single();
      
      if (teamError) throw teamError;

      if (teamData) {
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: teamData.id,
            user_id: user.id,
            role: 'owner'
          });
        
        if (memberError) throw memberError;
      }

      toast.success("Team Created Successfully!", { description: `${data.teamName} has been created.` });
      
      router.push('/teams');

    } catch (error: any) {
      toast.error("Error Creating Team", { description: error.message || "Please try again later." });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-overlay opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
      
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50 dark:bg-card/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/teams")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Create Your Team</h1>
          </div>
        </div>
      </header>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
            <Card className="p-8 animate-fade-in-up bg-card/80 backdrop-blur-md">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Team Details</h2>
                <p className="text-muted-foreground">Build your squad and get ready to innovate.</p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-3">
                    <Label htmlFor="bannerUrl" className="text-sm font-medium">Select a Team Banner *</Label>
                    <Controller
                        name="bannerUrl"
                        control={control}
                        rules={{ required: 'Please select a banner' }}
                        render={({ field }) => (
                            <div className="grid grid-cols-3 gap-4">
                                {bannerImages.map((img, index) => (
                                    <div key={index} className="relative aspect-[16/9] cursor-pointer group" onClick={() => field.onChange(img)}>
                                        <Image src={img} alt={`Banner ${index+1}`} layout="fill" className={cn("object-cover rounded-md transition-all", field.value === img && "ring-2 ring-primary ring-offset-2")}/>
                                        {field.value === img && <div className="absolute inset-0 bg-primary/50 flex items-center justify-center rounded-md"><Check className="text-white w-8 h-8"/></div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    />
                     {errors.bannerUrl && (
                      <p className="text-sm text-destructive">{errors.bannerUrl.message}</p>
                    )}
                </div>

                <div className="space-y-3">
                <Label htmlFor="teamName" className="text-sm font-medium">
                    Team Name *
                </Label>
                <Input
                    id="teamName"
                    {...register('teamName', { 
                    required: 'Team name is required',
                    maxLength: { value: 50, message: 'Team name must be 50 characters or less' }
                    })}
                    placeholder="Enter your team name"
                    className="h-12"
                />
                {errors.teamName && (
                    <p className="text-sm text-destructive">{errors.teamName.message}</p>
                )}
                </div>
                
                <div className="space-y-3">
                <Label htmlFor="projectName" className="text-sm font-medium">
                    Project Name
                </Label>
                <Input
                    id="projectName"
                    {...register('projectName')}
                    placeholder="What are you building?"
                    className="h-12"
                />
                </div>

                <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-medium">
                    Description *
                </Label>
                <Textarea
                    id="description"
                    {...register('description', { 
                    required: 'Description is required',
                    maxLength: { value: 300, message: 'Description must be 300 characters or less' }
                    })}
                    placeholder="Describe your team's vision, goals, and what you're looking for..."
                    className="min-h-[120px]"
                />
                 {errors.description && (
                      <p className="text-sm text-destructive">{errors.description.message}</p>
                    )}
                <p className="text-xs text-muted-foreground text-right">
                    {watchedValues.description?.length || 0}/300 characters
                </p>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Label htmlFor="skills_needed" className="text-sm font-medium">
                            Desired Skills & Tech Stack
                        </Label>
                        <Input
                            id="skills_needed"
                            {...register('skills_needed')}
                            placeholder="React, Node.js, Python, Figma..."
                            className="h-12"
                        />
                        <p className="text-xs text-muted-foreground">
                            Separate skills with a comma.
                        </p>
                    </div>
                     <div className="space-y-3">
                        <Label htmlFor="member_limit" className="text-sm font-medium">
                            Member Limit
                        </Label>
                        <Controller
                            name="member_limit"
                            control={control}
                            rules={{ required: true, min: 2, max: 10 }}
                            render={({ field }) => (
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="outline" size="icon" className="h-12 w-12" onClick={() => field.onChange(Math.max(2, field.value - 1))}>
                                        <Minus className="w-4 h-4"/>
                                    </Button>
                                    <Input
                                        {...field}
                                        type="number"
                                        className="h-12 text-center text-lg font-bold"
                                        min={2}
                                        max={10}
                                    />
                                    <Button type="button" variant="outline" size="icon" className="h-12 w-12" onClick={() => field.onChange(Math.min(10, field.value + 1))}>
                                        <Plus className="w-4 h-4"/>
                                    </Button>
                                </div>
                            )}
                        />
                         <p className="text-xs text-muted-foreground">
                            Set the maximum team size (2-10).
                        </p>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 text-lg"
                >
                {isSubmitting ? (
                    <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Creating Team...
                    </>
                ) : (
                    <>
                    <Sparkles className="w-5 h-5 mr-3" />
                    Create Team
                    </>
                )}
                </Button>
            </form>
            </Card>
        </div>
      </div>
    </div>
  );
};
