import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChatTeardropSlash } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="bg-muted p-6 rounded-full mb-6">
        <ChatTeardropSlash weight="duotone" className="w-12 h-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Halaman Tidak Ditemukan</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Sepertinya ruangan yang kamu cari tidak ada atau sudah dihapus.
      </p>
      <Button asChild>
        <Link href="/">Kembali ke Beranda</Link>
      </Button>
    </div>
  );
}
