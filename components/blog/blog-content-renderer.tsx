import type { BlogContentBlock } from "@/lib/blog";

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
              <img src={block.url} alt={block.alt || "Illustration de l article"} className="hb-post-inline-image" loading="lazy" decoding="async" />
              {block.caption ? <figcaption>{block.caption}</figcaption> : null}
            </figure>
          );
        }

        return <p key={`paragraph-${index}`}>{block.text}</p>;
      })}
    </>
  );
}
