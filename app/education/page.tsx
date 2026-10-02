import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Landmark,
  School,
  Shapes,
  Sparkles,
} from "lucide-react";
import { BookCard } from "@/components/books/book-card";
import { getPublishedBooks } from "@/lib/books";
import {
  findEducationNode,
  getEducationCatalog,
  type EducationNode,
} from "@/lib/education";

export const metadata: Metadata = {
  title: "Élèves & Étudiants",
  description:
    "Livres scolaires, humanités et ressources universitaires organisés selon le parcours éducatif de la RDC.",
  alternates: { canonical: "/education" },
};

type EducationPageProps = {
  searchParams: Promise<{
    audience?: string;
    education?: string;
  }>;
};

function directChild(node: EducationNode | undefined, code: string) {
  return node?.children.find((child) => child.code === code);
}

function educationHref(audience: "school" | "university", slug?: string) {
  const params = new URLSearchParams({ audience });
  if (slug) params.set("education", slug);
  return "/education?" + params.toString();
}

function NodeLink({
  node,
  audience,
  active,
}: {
  node: EducationNode;
  audience: "school" | "university";
  active: boolean;
}) {
  return (
    <Link
      href={educationHref(audience, node.slug)}
      className={
        active
          ? "group flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-[#173d2c] bg-[#173d2c] px-4 py-3 text-sm font-bold text-white shadow-md"
          : "group flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-[#dfd4c8] bg-white px-4 py-3 text-sm font-bold text-[#403830] transition hover:-translate-y-0.5 hover:border-[#bca997] hover:shadow-sm"
      }
    >
      <span className="min-w-0">
        <span className="line-clamp-2">{node.name}</span>
        {node.books_count > 0 ? (
          <span className={active ? "mt-1 block text-[0.68rem] text-white/65" : "mt-1 block text-[0.68rem] text-[#8b7f73]"}>
            {node.books_count} livre{node.books_count > 1 ? "s" : ""}
          </span>
        ) : null}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function TaxonomyGroup({
  title,
  description,
  nodes,
  audience,
  selectedSlug,
}: {
  title: string;
  description?: string;
  nodes: EducationNode[];
  audience: "school" | "university";
  selectedSlug?: string;
}) {
  if (nodes.length === 0) return null;

  return (
    <section className="rounded-[1.75rem] border border-[#e2d7cb] bg-[#fffdf9] p-5 sm:p-6">
      <h2 className="font-display text-xl font-extrabold tracking-[-0.03em] text-[#1d1a17] sm:text-2xl">
        {title}
      </h2>
      {description ? <p className="mt-2 text-sm leading-6 text-[#786d62]">{description}</p> : null}
      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {nodes.map((node) => (
          <NodeLink
            key={node.id}
            node={node}
            audience={audience}
            active={selectedSlug === node.slug}
          />
        ))}
      </div>
    </section>
  );
}

export default async function EducationPage({ searchParams }: EducationPageProps) {
  const params = await searchParams;
  const audience: "school" | "university" =
    params.audience === "university" ? "university" : "school";

  const catalog = await getEducationCatalog();
  const selectedNode = findEducationNode(catalog.data, params.education);

  const schoolRoot = catalog.data.find((node) => node.code === "RDC_SCHOOL");
  const universityRoot = catalog.data.find((node) => node.code === "RDC_ESU");
  const primary = directChild(schoolRoot, "RDC_PRIMARY");
  const cteb = directChild(schoolRoot, "RDC_CTEB");
  const humanities = directChild(schoolRoot, "RDC_HUMANITIES");
  const universityCycles = directChild(universityRoot, "RDC_ESU_CYCLES");
  const universityDomains = directChild(universityRoot, "RDC_ESU_DOMAINS");

  const books = await getPublishedBooks({
    education: selectedNode?.slug,
    educationAudience: selectedNode ? selectedNode.audience : audience,
  });

  return (
    <div className="min-h-screen bg-[#f7f2e9] text-[#1d1a17]">
      <section className="relative overflow-hidden bg-[#173d2c] text-white">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#e8ac42]/25 blur-2xl" />
        <div className="absolute -bottom-24 left-[18%] h-56 w-56 rounded-full border-[44px] border-white/5" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#f1c86d]">
                <GraduationCap className="h-4 w-4" />
                Éducation RDC
              </div>
              <h1 className="mt-5 font-display text-4xl font-extrabold leading-none tracking-[-0.05em] sm:text-6xl">
                L’espace des élèves et étudiants.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                Manuels scolaires, ouvrages de référence et ressources universitaires organisés par niveau,
                classe, section, option, cycle LMD, domaine et filière.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-2xl font-extrabold text-[#f1c86d]">{catalog.meta.school_nodes}</p>
                <p className="mt-1 text-xs text-white/65">niveaux scolaires</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-2xl font-extrabold text-[#f1c86d]">{catalog.meta.university_nodes}</p>
                <p className="mt-1 text-xs text-white/65">repères universitaires</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-9 px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-3 md:grid-cols-4">
          <Link href={educationHref("school", "rdc-primary")} className="rounded-3xl border border-[#dfd4c8] bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
            <School className="h-7 w-7 text-[#c85439]" />
            <h2 className="mt-5 text-lg font-extrabold">Primaire</h2>
            <p className="mt-2 text-sm leading-6 text-[#786d62]">1re à 6e année, matières fondamentales et manuels scolaires.</p>
          </Link>
          <Link href={educationHref("school", "rdc-cteb")} className="rounded-3xl border border-[#dfd4c8] bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
            <Shapes className="h-7 w-7 text-[#2d6f62]" />
            <h2 className="mt-5 text-lg font-extrabold">CTEB</h2>
            <p className="mt-2 text-sm leading-6 text-[#786d62]">7e et 8e années de l’Éducation de Base.</p>
          </Link>
          <Link href={educationHref("school", "rdc-humanities")} className="rounded-3xl border border-[#dfd4c8] bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
            <BookOpen className="h-7 w-7 text-[#77548d]" />
            <h2 className="mt-5 text-lg font-extrabold">Humanités</h2>
            <p className="mt-2 text-sm leading-6 text-[#786d62]">Générales, scientifiques, pédagogiques, techniques et professionnelles.</p>
          </Link>
          <Link href={educationHref("university")} className="rounded-3xl border border-[#dfd4c8] bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
            <Landmark className="h-7 w-7 text-[#aa7130]" />
            <h2 className="mt-5 text-lg font-extrabold">Université</h2>
            <p className="mt-2 text-sm leading-6 text-[#786d62]">Licence, Master, Doctorat et domaines officiels LMD.</p>
          </Link>
        </section>

        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-[#dfd4c8] bg-white p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link href={educationHref("school")} className={audience === "school" ? "min-h-11 shrink-0 rounded-xl bg-[#173d2c] px-5 py-3 text-sm font-extrabold text-white" : "min-h-11 shrink-0 rounded-xl px-5 py-3 text-sm font-extrabold text-[#61574e] hover:bg-[#f3ede5]"}>
            Élèves
          </Link>
          <Link href={educationHref("university")} className={audience === "university" ? "min-h-11 shrink-0 rounded-xl bg-[#173d2c] px-5 py-3 text-sm font-extrabold text-white" : "min-h-11 shrink-0 rounded-xl px-5 py-3 text-sm font-extrabold text-[#61574e] hover:bg-[#f3ede5]"}>
            Étudiants
          </Link>
        </div>

        {audience === "school" ? (
          <div className="space-y-6">
            <TaxonomyGroup title="Primaire" description="Les six années du cycle primaire." nodes={primary?.children ?? []} audience="school" selectedSlug={selectedNode?.slug} />
            <TaxonomyGroup title="Cycle Terminal de l’Éducation de Base" description="7e et 8e années, avant l’entrée aux Humanités." nodes={cteb?.children ?? []} audience="school" selectedSlug={selectedNode?.slug} />
            <TaxonomyGroup title="Années des Humanités" nodes={(humanities?.children ?? []).filter((node) => node.kind === "class")} audience="school" selectedSlug={selectedNode?.slug} />
            <TaxonomyGroup title="Sections et filières des Humanités" description="Humanités générales, techniques et professionnelles avec leurs options." nodes={(humanities?.children ?? []).filter((node) => node.kind !== "class")} audience="school" selectedSlug={selectedNode?.slug} />
            {(humanities?.children ?? [])
              .filter((node) => ["stream", "section"].includes(node.kind))
              .map((group) => (
                <TaxonomyGroup key={group.id} title={group.name} nodes={group.children} audience="school" selectedSlug={selectedNode?.slug} />
              ))}
          </div>
        ) : (
          <div className="space-y-6">
            <TaxonomyGroup title="Cycles Licence-Master-Doctorat" description="Choisissez le niveau académique ciblé par l’ouvrage." nodes={universityCycles?.children ?? []} audience="university" selectedSlug={selectedNode?.slug} />
            <TaxonomyGroup title="Les 8 domaines officiels LMD" description="Le catalogue descend ensuite vers les filières et mentions synchronisées depuis RegESU." nodes={universityDomains?.children ?? []} audience="university" selectedSlug={selectedNode?.slug} />
            {selectedNode?.kind === "domain" && selectedNode.children.length > 0 ? (
              <TaxonomyGroup title={"Filières · " + selectedNode.name} nodes={selectedNode.children} audience="university" selectedSlug={selectedNode.slug} />
            ) : null}
          </div>
        )}

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#e2d7cb] sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#c85439]">
                <Sparkles className="h-4 w-4" />
                Bibliothèque pédagogique
              </div>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">
                {selectedNode ? selectedNode.name : audience === "school" ? "Livres pour élèves" : "Livres pour étudiants"}
              </h2>
              <p className="mt-2 text-sm text-[#786d62]">
                {books.length} ouvrage{books.length > 1 ? "s" : ""} actuellement classé{books.length > 1 ? "s" : ""} dans cette sélection.
              </p>
            </div>
            {selectedNode ? (
              <Link href={educationHref(audience)} className="text-sm font-extrabold text-[#b54b34]">
                Réinitialiser le filtre
              </Link>
            ) : null}
          </div>

          {books.length > 0 ? (
            <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-dashed border-[#d8cbbb] bg-[#faf7f2] px-5 py-10 text-center">
              <GraduationCap className="mx-auto h-9 w-9 text-[#9c8e80]" />
              <p className="mt-3 font-bold text-[#403830]">Aucun livre classé ici pour le moment.</p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#807469]">
                L’administrateur peut associer chaque livre à plusieurs classes, options, cycles ou domaines depuis Filament.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
