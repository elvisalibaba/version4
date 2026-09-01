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
    <div className={`relative overflow-hidden bg-[#16271f] ${className}`}>
      {imageUrl ? (
        <Image src={imageUrl} alt={imageAlt || label} width={1200} height={675} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(239,177,73,.75),transparent_0,transparent_22%),linear-gradient(135deg,#173d2c_0%,#1f6b50_52%,#d26342_52%,#efb149_100%)]" />
      )}
      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#163a2a] backdrop-blur">{label}</span>
    </div>
  );
}
