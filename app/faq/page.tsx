import type { Metadata } from "next";
import { FaqPage } from "@/components/faq/faq-page";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Questions fréquentes Holistique Books pour les lecteurs et les auteurs: création de compte, achats, bibliothèque, publication et gestion du catalogue.",
};

export default function FaqRoutePage() {
  return <FaqPage />;
}
