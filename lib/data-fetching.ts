import { unstable_cache } from "next/cache";
import { Project } from "@/types";
import { supabaseServer } from "./supabaseserver";

// ✅ FIX: Revalidate every 60 seconds (ISR-style). Without this, every request
// hits Supabase directly — even for the same data. Now cached at the framework level.
const REVALIDATE_SECONDS = 60;

function transformProject(raw: any): Project {
  const coverImage =
    raw.project_images?.find((img: any) => img.is_cover)?.image_url ||
    raw.cover_image ||
    "";

  // ✅ FIX: Exclude the cover image from the gallery to avoid duplicating it
  // (it appears in the hero section, so showing it again in the gallery is redundant)
  const gallery: string[] =
    raw.project_images
      ?.filter((img: any) => img.image_url !== coverImage)
      .map((img: any) => img.image_url)
      .filter(Boolean) || [];

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? "",
    location: raw.location ?? "",
    year: raw.year,
    category: raw.category ?? "residential",
    image: coverImage,
    gallery,
    scope_of_work: raw.scope_of_work ?? undefined,
    is_featured: Boolean(raw.is_featured),
  };
}

// ✅ FIX: Wrapped with unstable_cache — results are cached for 60s instead of
// hitting Supabase on every single request.
export const getFeaturedProjects = unstable_cache(
  async (): Promise<Project[]> => {
    const { data, error } = await supabaseServer
      .from("projects")
      .select(
        `id, title, description, location, year, cover_image, is_featured,
       project_images(image_url, is_cover)`,
      )
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) {
      console.error("[getFeaturedProjects]", error.message);
      return [];
    }

    return (data ?? []).map(transformProject);
  },
  ["featured-projects"],
  { revalidate: REVALIDATE_SECONDS },
);

export interface PaginatedProjectsResult {
  projects: Project[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 6;

// ✅ FIX: Removed the redundant second `SELECT *` count query.
// The first query already returns an accurate count via { count: "exact" }.
// The old code made TWO Supabase round-trips on every page load — now it's ONE.
export const getPaginatedProjects = unstable_cache(
  async (
    page: number = 1,
    pageSize: number = DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedProjectsResult> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabaseServer
      .from("projects")
      .select(
        `id, title, description, location, year, cover_image, is_featured,
         project_images(image_url, is_cover)`,
        { count: "exact" },
      )
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[getPaginatedProjects]", error.message);
      return { projects: [], totalCount: 0, page: 1, pageSize, totalPages: 0 };
    }

    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      projects: (data ?? []).map(transformProject),
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },
  ["paginated-projects"],
  { revalidate: REVALIDATE_SECONDS },
);

export const getAllProjects = unstable_cache(
  async (): Promise<Project[]> => {
    const { data, error } = await supabaseServer
      .from("projects")
      .select(
        `id, title, description, location, year, cover_image, is_featured,
       project_images(image_url, is_cover)`,
      )
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getAllProjects]", error.message);
      return [];
    }

    return (data ?? []).map(transformProject);
  },
  ["all-projects"],
  { revalidate: REVALIDATE_SECONDS },
);

export const getProject = unstable_cache(
  async (id: string): Promise<Project | null> => {
    const { data, error } = await supabaseServer
      .from("projects")
      .select(
        `id, title, description, location, year, cover_image, scope_of_work, is_featured,
       project_images(image_url, is_cover)`,
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("[getProject]", error.message);
      return null;
    }

    return data ? transformProject(data) : null;
  },
  ["project"],
  { revalidate: REVALIDATE_SECONDS },
);

export const getRelatedProjects = unstable_cache(
  async (excludeId: string): Promise<Project[]> => {
    const { data, error } = await supabaseServer
      .from("projects")
      .select(
        `id, title, description, location, year, cover_image, is_featured,
       project_images(image_url, is_cover)`,
      )
      .neq("id", excludeId)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) {
      console.error("[getRelatedProjects]", error.message);
      return [];
    }

    return (data ?? []).map(transformProject);
  },
  ["related-projects"],
  { revalidate: REVALIDATE_SECONDS },
);
