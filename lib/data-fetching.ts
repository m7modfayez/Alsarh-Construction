import { Project } from "@/types";
import { supabaseServer } from "./supabaseserver";

function transformProject(raw: any): Project {
  const coverImage =
    raw.project_images?.find((img: any) => img.is_cover)?.image_url ||
    raw.cover_image ||
    "";
  const gallery: string[] =
    raw.project_images?.map((img: any) => img.image_url).filter(Boolean) || [];

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? "",
    location: raw.location ?? "",
    year: raw.year,
    category: "residential", // DB doesn't store category yet; default to residential
    image: coverImage,
    gallery,
    scope_of_work: raw.scope_of_work ?? undefined,
  };
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const { data, error } = await supabaseServer
    .from("projects")
    .select(
      `id, title, description, location, year, cover_image,
       project_images(image_url, is_cover)`,
    )
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("[getFeaturedProjects]", error.message);
    return [];
  }

  return (data ?? []).map(transformProject);
}

export interface PaginatedProjectsResult {
  projects: Project[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 6;

export async function getPaginatedProjects(
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<PaginatedProjectsResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const [{ data, error }, { count }] = await Promise.all([
    supabaseServer
      .from("projects")
      .select(
        `id, title, description, location, year, cover_image,
         project_images(image_url, is_cover)`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to),
    supabaseServer.from("projects").select("*", { count: "exact", head: true }),
  ]);

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
}

export async function getAllProjects(): Promise<Project[]> {
  const { data, error } = await supabaseServer
    .from("projects")
    .select(
      `id, title, description, location, year, cover_image,
       project_images(image_url, is_cover)`,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getAllProjects]", error.message);
    return [];
  }

  return (data ?? []).map(transformProject);
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabaseServer
    .from("projects")
    .select(
      `id, title, description, location, year, cover_image, scope_of_work,
       project_images(image_url, is_cover)`,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("[getProject]", error.message);
    return null;
  }

  return data ? transformProject(data) : null;
}

export async function getRelatedProjects(
  excludeId: string,
): Promise<Project[]> {
  const { data, error } = await supabaseServer
    .from("projects")
    .select(
      `id, title, description, location, year, cover_image,
       project_images(image_url, is_cover)`,
    )
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("[getRelatedProjects]", error.message);
    return [];
  }

  return (data ?? []).map(transformProject);
}
