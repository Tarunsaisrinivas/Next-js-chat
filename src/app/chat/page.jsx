
"use client";
import React, { Suspense } from 'react';
import Chat from './chat';


export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <Chat />
    </Suspense>
  );
}