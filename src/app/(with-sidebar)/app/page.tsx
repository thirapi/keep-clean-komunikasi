"use client";
import { useEffect } from "react";
import { useBreadcrumbs } from "@/components/breadcrumb/breadcrumb-context";


export default function Page() {
  const { setBreadcrumbs } = useBreadcrumbs();


  useEffect(() => {
    setBreadcrumbs([
      { label: "App", href: "/app" },
    ]);
  }, [setBreadcrumbs]);

  return (
    <div className="flex flex-col items-center justify-center min-h-full">
      <h1 className="text-3xl font-bold">200 - Berhasil</h1>
      <p className="text-gray-600 mt-2">
        Selamat! Anda memiliki akses penuh ke halaman ini.
      </p>
    </div>
  );
}
