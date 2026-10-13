import { requireAdmin } from "@/lib/auth/require-admin";
import { SupabaseBookEditor } from "@/components/supabase/book-editor";
export default async function NewSupabaseBook(){
 await requireAdmin();
 return <section className="space-y-5"><h2 className="text-3xl font-bold">Ajouter un livre</h2>
  <SupabaseBookEditor area="admin" /></section>;
}
