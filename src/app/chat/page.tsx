'use client';
import { Chat } from "@/components/chat";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default function ChatPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Chat />
        </Suspense>
    );
}
