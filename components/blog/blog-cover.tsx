import type { BlogPost } from "@/lib/blog";

type BlogCoverProps = {
  imageUrl: BlogPost["coverImageUrl"];
  imageAlt: BlogPost["coverImageAlt"];
  label: string;
  className: string;
};

export function BlogCover({ imageUrl, imageAlt, label, className }: BlogCoverProps) {
  return (
    <div className={className}>
      {imageUrl ? <img src={imageUrl} alt={imageAlt || label} className="h-full w-full object-cover" loading="lazy" decoding="async" /> : null}
      <span className="hb-blog-cover-label">{label}</span>
    </div>
  );
}
