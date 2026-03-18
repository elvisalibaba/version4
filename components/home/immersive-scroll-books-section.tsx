"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { PublishedBook } from "@/lib/books";

type ImmersiveScrollBooksSectionProps = {
  books: PublishedBook[];
};

function pickShowcaseBooks(books: PublishedBook[]) {
  const paid = books.filter((book) => !book.is_free);
  const source = paid.length >= 3 ? paid : books;
  return source.slice(0, 3);
}

export function ImmersiveScrollBooksSection({ books }: ImmersiveScrollBooksSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const showcase = pickShowcaseBooks(books);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const leftY = useTransform(scrollYProgress, [0, 0.5, 1], [95, 0, -120]);
  const centerY = useTransform(scrollYProgress, [0, 0.5, 1], [70, 0, -80]);
  const rightY = useTransform(scrollYProgress, [0, 0.5, 1], [110, 0, -135]);
  const leftRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-13, -8, -16]);
  const centerRotate = useTransform(scrollYProgress, [0, 0.5, 1], [4, 0, -5]);
  const rightRotate = useTransform(scrollYProgress, [0, 0.5, 1], [11, 8, 14]);
  const centerScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1.04, 0.98]);
  const leftX = useTransform(scrollYProgress, [0, 1], [26, -22]);
  const rightX = useTransform(scrollYProgress, [0, 1], [-28, 24]);

  if (showcase.length === 0) return null;

  const animatedStyles = reducedMotion
    ? [{}, {}, {}]
    : [
        { y: leftY, rotate: leftRotate, x: leftX },
        { y: centerY, rotate: centerRotate, scale: centerScale },
        { y: rightY, rotate: rightRotate, x: rightX },
      ];

  return (
    <section ref={sectionRef} className="hb-section hb-immersive-section" aria-label="Experience immersive des livres">
      <div className="hb-section-shell">
        <div className="hb-immersive-stage">
          <div className="hb-immersive-copy">
            <p className="hb-kicker">Scene de lecture HolistiqueBooks</p>
            <h2 className="hb-title hb-immersive-title">Chaque scroll met un livre en scene comme une vraie vitrine editoriale.</h2>
            <p className="hb-muted hb-immersive-text">
              Ici, le mouvement guide le regard vers les titres qui meritent d etre decouverts, lus, puis achetes. Une experience plus vivante, plus premium, plus memorisable.
            </p>
            <div className="hb-immersive-actions">
              <Link href="/books" className="cta-primary px-5 py-3 text-sm">
                Explorer la librairie
              </Link>
              <Link href="/home#popular-books" className="cta-secondary px-5 py-3 text-sm">
                Voir les titres qui montent
              </Link>
            </div>
          </div>

          <div className="hb-immersive-stack" aria-hidden="true">
            {showcase.map((book, index) => {
              const slotClass = index === 0 ? "is-left" : index === 1 ? "is-center" : "is-right";
              const priceLabel = book.display_price_label ?? (book.price <= 0 ? "Gratuit" : `$${book.price.toFixed(2)}`);

              return (
                <div key={book.id} className={`hb-immersive-slot ${slotClass}`.trim()}>
                  <motion.article
                    style={animatedStyles[index]}
                    className="hb-immersive-book"
                    whileHover={reducedMotion ? undefined : { y: -8, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 160, damping: 18, mass: 0.85 }}
                  >
                    <div className="hb-immersive-cover">
                      {book.cover_signed_url ? (
                        <Image src={book.cover_signed_url} alt={book.title} fill sizes="(max-width: 768px) 42vw, 220px" className="object-cover" />
                      ) : (
                        <div className="hb-immersive-fallback">{book.title}</div>
                      )}
                    </div>
                    <div className="hb-immersive-book-meta">
                      <p className="hb-immersive-book-title line-clamp-2">{book.title}</p>
                      <p className="hb-immersive-book-foot">
                        <span>{book.author_name ?? "Auteur inconnu"}</span>
                        <span>{priceLabel}</span>
                      </p>
                    </div>
                  </motion.article>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
