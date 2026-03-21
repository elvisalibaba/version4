import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { getMarketingPage } from "@/lib/marketing-pages";

type MarketingRoutePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: MarketingRoutePageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getMarketingPage(slug);

  if (!page) {
    return {};
  }

  return {
    title: page.kicker,
    description: page.description,
  };
}

export default async function MarketingRoutePage({ params }: MarketingRoutePageProps) {
  const { slug } = await params;
  const page = getMarketingPage(slug);

  if (!page) {
    notFound();
  }

  return <MarketingPageShell page={page} />;
}
