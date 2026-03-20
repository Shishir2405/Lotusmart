import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col items-center justify-center p-8 text-center">
      <div className="text-8xl mb-6">🌿</div>
      <h1 className="text-6xl font-bold text-neutral-900 mb-2">404</h1>
      <h2 className="text-2xl font-semibold text-neutral-700 mb-3">Page Not Found</h2>
      <p className="text-neutral-500 max-w-sm mb-8 leading-relaxed">
        This page seems to have wandered off. Let's get you back to our premium collection.
      </p>
      <div className="flex gap-3">
        <Link href="/"><Button size="lg">Back to Home</Button></Link>
        <Link href="/products"><Button variant="outline" size="lg">Browse Products</Button></Link>
      </div>
    </div>
  );
}
