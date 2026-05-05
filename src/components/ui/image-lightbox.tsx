import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ExternalLink, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface ImageSource {
  url: string;
  filename: string;
}

interface ImageLightboxProps {
  images: ImageSource[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  const currentImage = images[currentIndex];

  if (!currentImage) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col items-center justify-center outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent z-10">
            <div className="text-white flex flex-col">
              <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-md">
                {currentImage.filename}
              </span>
              {images.length > 1 && (
                <span className="text-[10px] opacity-70">
                  {currentIndex + 1} of {images.length}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-9 w-9 text-white hover:bg-white/20 rounded-full"
              >
                <a href={currentImage.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-9 w-9 text-white hover:bg-white/20 rounded-full"
              >
                <a href={currentImage.url} download={currentImage.filename}>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              <DialogPrimitive.Close className="h-9 w-9 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Image Container */}
          <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-12">
            <img
              src={currentImage.url}
              alt={currentImage.filename}
              className="max-w-full max-h-full object-contain select-none shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prev}
                  className="absolute left-4 h-12 w-12 text-white hover:bg-white/10 rounded-full hidden sm:flex"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={next}
                  className="absolute right-4 h-12 w-12 text-white hover:bg-white/10 rounded-full hidden sm:flex"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
                
                {/* Mobile Navigation Area */}
                <div className="absolute inset-y-0 left-0 w-1/4 sm:hidden" onClick={prev} />
                <div className="absolute inset-y-0 right-0 w-1/4 sm:hidden" onClick={next} />
              </>
            )}
          </div>

          {/* Footer Thumbnails (Optional, could add later) */}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
