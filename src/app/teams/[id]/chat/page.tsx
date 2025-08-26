
'use client';

import { Suspense } from 'react';
import { TeamChat } from '@/components/team-chat';

export default function TeamChatPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading team chat...</div>}>
      <TeamChat teamId={params.id} />
    </Suspense>
  );
}
