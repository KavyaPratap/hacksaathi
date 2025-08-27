'use client';
import { TeamDetails } from "@/components/team-details";
import { Suspense } from "react";

export default function TeamDetailsPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <TeamDetails teamId={params.id} />
        </Suspense>
    );
}
