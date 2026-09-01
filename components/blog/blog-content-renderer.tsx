import type { BlogContentBlock } from "@/lib/blog";
import Image from "next/image";

type BlogContentRendererProps = {
  content: BlogContentBlock[];
};

export function BlogContentRenderer({ content }: BlogContentRendererProps) {
  return (
    <>
      {content.map((block, index) => {
        if (block.type === "image") {
          return (
            <figure key={`image-${index}`} className="hb-post-block-image">
              <Image src={block.url} alt={block.alt || "Illustration de l’article"} width={1200} height={800} className="hb-post-inline-image" />
              {block.caption ? <figcaption>{block.caption}</figcaption> : null}
            </figure>
          );
        }

        return <p key={`paragraph-${index}`}>{block.text}</p>;
      })}
    </>
  );
}
