"use client"
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Enter Your Name</h1>
        <form action="/chat" method="get">
          <input
            type="text"
            name="name"
            className="border p-2 w-full mb-4"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded"
          >
            Enter Chat
          </button>
        </form>
      </div>
    </div>
  );
}
