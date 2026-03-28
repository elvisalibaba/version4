import { createClient } from "@/lib/supabase/server";
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  buildPagination,
  getPaginationRange,
  normalizeSearchTerm,
  safeLikeTerm,
} from "@/lib/supabase/admin/shared";
import type { AdminNotice, AdminPagedResult } from "@/types/admin";
import type {
  EditorialTrainingPreferredFormat,
  EditorialTrainingRequestRow,
} from "@/lib/editorial-training";

export type AdminEditorialTrainingRequestListItem =
  EditorialTrainingRequestRow & {
    fullName: string;
  };

export type AdminEditorialTrainingRequestsPageData =
  AdminPagedResult<AdminEditorialTrainingRequestListItem> & {
    notices: AdminNotice[];
    stats: {
      totalRequests: number;
      last7Days: number;
      remoteFriendly: number;
      matureProjects: number;
    };
  };

function mapEditorialTrainingRequest(
  row: EditorialTrainingRequestRow,
): AdminEditorialTrainingRequestListItem {
  return {
    ...row,
    fullName: `${row.first_name} ${row.last_name}`.trim() || row.email,
  };
}

export async function listAdminEditorialTrainingRequests(params: {
  page?: number;
  search?: string;
  preferredFormat?: EditorialTrainingPreferredFormat | "";
}): Promise<AdminEditorialTrainingRequestsPageData> {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const search = normalizeSearchTerm(params.search);
  const { from, to } = getPaginationRange(page, ADMIN_DEFAULT_PAGE_SIZE);

  let query = supabase
    .from("editorial_training_requests")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.preferredFormat) {
    query = query.eq("preferred_format", params.preferredFormat);
  }

  if (search) {
    const term = safeLikeTerm(search);
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,organization_name.ilike.%${term}%,objectives.ilike.%${term}%`,
    );
  }

  const { data, count, error } = await query.range(from, to);

  const now = Date.now();
  const last7DaysThreshold = new Date(
    now - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [
    totalStats,
    last7DaysStats,
    remoteFriendlyStats,
    matureProjectsStats,
  ] = await Promise.all([
    supabase
      .from("editorial_training_requests")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("editorial_training_requests")
      .select("*", { count: "exact", head: true })
      .gte("created_at", last7DaysThreshold),
    supabase
      .from("editorial_training_requests")
      .select("*", { count: "exact", head: true })
      .in("preferred_format", ["online", "hybrid"]),
    supabase
      .from("editorial_training_requests")
      .select("*", { count: "exact", head: true })
      .in("project_stage", ["manuscript_ready", "existing_catalog"]),
  ]);

  const notices: AdminNotice[] = [];

  if (error) {
    return {
      items: [],
      pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
      notices: [
        {
          id: "editorial-training-load-error",
          tone: "danger",
          title: "Chargement impossible",
          description: error.message,
        },
      ],
      stats: {
        totalRequests: totalStats.count ?? 0,
        last7Days: last7DaysStats.count ?? 0,
        remoteFriendly: remoteFriendlyStats.count ?? 0,
        matureProjects: matureProjectsStats.count ?? 0,
      },
    };
  }

  if ((count ?? 0) === 0) {
    notices.push({
      id: "editorial-training-empty",
      tone: "info",
      title: "Aucune demande pour le moment",
      description:
        search || params.preferredFormat
          ? "Aucune demande ne correspond aux filtres actuels."
          : "Les nouvelles inscriptions a la formation editoriale apparaitront ici.",
    });
  } else if ((last7DaysStats.count ?? 0) > 0) {
    notices.push({
      id: "editorial-training-live",
      tone: "success",
      title: "Demandes recentes en base",
      description: `${last7DaysStats.count} inscription(s) recue(s) sur les 7 derniers jours.`,
    });
  }

  return {
    items: (data ?? []).map(mapEditorialTrainingRequest),
    pagination: buildPagination(count, page, ADMIN_DEFAULT_PAGE_SIZE),
    notices,
    stats: {
      totalRequests: totalStats.count ?? 0,
      last7Days: last7DaysStats.count ?? 0,
      remoteFriendly: remoteFriendlyStats.count ?? 0,
      matureProjects: matureProjectsStats.count ?? 0,
    },
  };
}

export async function listAllAdminEditorialTrainingRequests(params: {
  search?: string;
  preferredFormat?: EditorialTrainingPreferredFormat | "";
}) {
  const supabase = await createClient();
  const search = normalizeSearchTerm(params.search);

  let query = supabase
    .from("editorial_training_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (params.preferredFormat) {
    query = query.eq("preferred_format", params.preferredFormat);
  }

  if (search) {
    const term = safeLikeTerm(search);
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,organization_name.ilike.%${term}%,objectives.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EditorialTrainingRequestRow[];
}
