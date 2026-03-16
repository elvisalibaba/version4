import type { Metadata } from "next";
import { FaqPage } from "@/components/faq/faq-page";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Questions frequentes Holistique Books pour les lecteurs et les auteurs: creation de compte, achats, bibliotheque, publication et gestion du catalogue.",
};

export default function FaqRoutePage() {
  return <FaqPage />;
}
