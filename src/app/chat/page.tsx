'use client';
import { Chat } from "@/components/chat";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading Chat...</p></div>}>
            <Chat />
        </Suspense>
    );
}
