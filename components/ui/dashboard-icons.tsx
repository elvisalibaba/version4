import {
  BarChart3,
  BookOpen,
  CircleDollarSign,
  Gem,
  LibraryBig,
  PlusCircle,
  Receipt,
} from "lucide-react";

export type DashboardIconName =
  | "bar-chart-3"
  | "book-open"
  | "circle-dollar-sign"
  | "gem"
  | "library-big"
  | "plus-circle"
  | "receipt";

type DashboardIconProps = {
  name: DashboardIconName;
  className?: string;
};

export function DashboardIcon({ name, className }: DashboardIconProps) {
  switch (name) {
    case "bar-chart-3":
      return <BarChart3 className={className} />;
    case "book-open":
      return <BookOpen className={className} />;
    case "circle-dollar-sign":
      return <CircleDollarSign className={className} />;
    case "gem":
      return <Gem className={className} />;
    case "library-big":
      return <LibraryBig className={className} />;
    case "plus-circle":
      return <PlusCircle className={className} />;
    case "receipt":
      return <Receipt className={className} />;
    default:
      return <BookOpen className={className} />;
  }
}
