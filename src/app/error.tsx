"use client";

import { Button } from "@/components/ui/Button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-5">⚠️</div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">Something went wrong</h1>
      <p className="text-neutral-500 mb-6 max-w-sm">{error.message ?? "An unexpected error occurred. Our team has been notified."}</p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" onClick={() => window.location.href = "/"}>Go Home</Button>
      </div>
    </div>
  );
}
