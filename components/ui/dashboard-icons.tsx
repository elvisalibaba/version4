import {
  BarChart3,
  BookOpen,
  CircleDollarSign,
  Gem,
  Globe2,
  Heart,
  Headphones,
  LibraryBig,
  Clapperboard,
  PlusCircle,
  Receipt,
  ShieldAlert,
  UserRound,
  WalletCards,
} from "lucide-react";

export type DashboardIconName =
  | "bar-chart-3"
  | "book-open"
  | "circle-dollar-sign"
  | "gem"
  | "globe-2"
  | "heart"
  | "headphones"
  | "clapperboard"
  | "library-big"
  | "plus-circle"
  | "receipt"
  | "shield-alert"
  | "user-round"
  | "wallet-cards";

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
    case "globe-2":
      return <Globe2 className={className} />;
    case "heart":
      return <Heart className={className} />;
    case "headphones":
      return <Headphones className={className} />;
    case "clapperboard":
      return <Clapperboard className={className} />;
    case "library-big":
      return <LibraryBig className={className} />;
    case "plus-circle":
      return <PlusCircle className={className} />;
    case "receipt":
      return <Receipt className={className} />;
    case "shield-alert":
      return <ShieldAlert className={className} />;
    case "user-round":
      return <UserRound className={className} />;
    case "wallet-cards":
      return <WalletCards className={className} />;
    default:
      return <BookOpen className={className} />;
  }
}
