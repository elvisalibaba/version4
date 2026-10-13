import { notFound } from "next/navigation";
import ReaderSmokeClient from "./reader-smoke-client";
export const dynamic = "force-dynamic";
export default function ReaderSmokePage() {
 // Hard-disabled in public deployments; used only by local CI.
 if (process.env.ALLOW_BROWSER_SMOKE !== "1") notFound();
 return <ReaderSmokeClient />;
}
