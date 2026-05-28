import { tool } from "ai";
import { z } from "zod";

export const aviatoCompanyEmployees = tool({
  description:
    "List employees at a specific company. Returns names, positions, titles, departments, and seniority scores. Useful for finding people at a target company without using DSL search. Paginated. Does NOT cost enrich credits.",
  inputSchema: z.object({
    id: z.string().optional().describe("Aviato company ID"),
    linkedinURL: z.string().optional().describe("Company LinkedIn URL"),
    website: z.string().optional().describe("Company website URL"),
    page: z.number().optional().default(1).describe("Page number (starts at 1)"),
    perPage: z.number().optional().default(20).describe("Results per page (max 100)"),
  }),
  execute: async ({ id, linkedinURL, website, page, perPage }) => {
    const baseUrl = process.env.AVIATO_API_BASE_URL || "https://data.api.aviato.co";

    const params = new URLSearchParams();
    if (id) params.set("id", id);
    if (linkedinURL) params.set("linkedinURL", linkedinURL);
    if (website) params.set("website", website);
    params.set("page", String(page ?? 1));
    params.set("perPage", String(Math.min(perPage ?? 20, 100)));

    const response = await fetch(`${baseUrl}/company/employees?${params}`, {
      headers: {
        Authorization: `Bearer ${process.env.AVIATO_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Aviato API error ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return {
      totalResults: data.totalResults,
      pages: data.pages,
      currentPage: page ?? 1,
      employees: data.employees,
    };
  },
});
