'use client';

import { ArrowLeft, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";

export const TeamChat = ({ teamId }: { teamId: string }) => {
    const router = useRouter();

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="border-b p-4 flex items-center gap-3 flex-shrink-0">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar>
                    <AvatarImage src={`https://picsum.photos/seed/${teamId}/200`} />
                    <AvatarFallback>T</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="font-semibold">Team Chat (Placeholder)</h2>
                    <p className="text-sm text-muted-foreground">Team ID: {teamId}</p>
                </div>
            </header>
            <main className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <p>Team chat functionality is coming soon!</p>
            </main>
            <footer className="border-t p-4 flex-shrink-0 bg-background">
                <div className="relative">
                    <Input placeholder="Message your team..." className="pr-12" />
                    <Button size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8">
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </footer>
        </div>
    )
}
