import Image from "next/image";
import type { BlogPost } from "@/lib/blog";

type BlogCoverProps = {
  imageUrl: BlogPost["coverImageUrl"];
  imageAlt: BlogPost["coverImageAlt"];
  label: string;
  className: string;
};

export function BlogCover({ imageUrl, imageAlt, label, className }: BlogCoverProps) {
  return (
    <div className={`relative overflow-hidden bg-night-900 ${className}`}>
      {imageUrl ? (
        <Image src={imageUrl} alt={imageAlt || label} width={1200} height={675} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
      ) : (
        <div className="absolute inset-0 bg-night-900" />
      )}
      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-night-900">{label}</span>
    </div>
  );
}
