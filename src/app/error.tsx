"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="bg-destructive/10 p-6 rounded-full mb-6">
        <WarningCircle weight="duotone" className="w-12 h-12 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Terjadi kesalahan!</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Mohon maaf, sepertinya ada masalah teknis. Kami telah mencatat kejadian ini.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default">
          Coba Lagi
        </Button>
        <Button onClick={() => (window.location.href = "/")} variant="outline">
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  );
}
