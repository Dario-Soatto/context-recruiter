import { tool } from "ai";
import { z } from "zod";

export const aviatoPersonSearch = tool({
  description:
    "Search for people using the search DSL. Use this to find candidates matching specific criteria like job titles, companies, education, skills, location, etc. The DSL supports filters with AND/OR logic, dot-notation for relational fields (e.g. experienceList.companyName, educationList.schoolName), and operators like eq, in, fts, gte, lte, noteq, textcontains. Use quantifier 'some' (default) or 'none' for one-to-many fields. Returns basic info (name, location, URLs). The filters parameter must be a JSON array (not a string).",
  inputSchema: z.object({
    filters: z
      .any()
      .describe(
        'Array of filter objects for the search DSL. MUST be a JSON array, not a string. Example: [{"AND": [{"country": {"operation": "eq", "value": "United States"}}, {"headline": {"operation": "fts", "value": "engineer"}}]}]'
      ),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe("Max results to return (1-250)"),
    offset: z.number().optional().default(0).describe("Pagination offset"),
    nameQuery: z
      .string()
      .optional()
      .describe("Optional full-text search on person name"),
  }),
  execute: async ({ filters, limit, offset, nameQuery }) => {
    const baseUrl = process.env.AVIATO_API_BASE_URL || "https://data.api.aviato.co";

    // Handle filters being passed as a JSON string instead of an array
    let parsedFilters = filters;
    if (typeof filters === "string") {
      try {
        parsedFilters = JSON.parse(filters);
      } catch {
        return { error: `Invalid filters: could not parse JSON string` };
      }
    }

    const dsl: Record<string, unknown> = {
      filters: parsedFilters,
      limit: Math.min(limit ?? 20, 50),
      offset: offset ?? 0,
    };
    if (nameQuery) {
      dsl.nameQuery = nameQuery;
    }

    const response = await fetch(`${baseUrl}/person/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AVIATO_API_KEY}`,
      },
      body: JSON.stringify({ dsl }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Search API error ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    const count = data.count?.value ?? data.count?.total ?? data.count;
    const items = (data.items || []).slice(0, 20);

    return {
      totalCount: count,
      returnedCount: items.length,
      items,
    };
  },
});
