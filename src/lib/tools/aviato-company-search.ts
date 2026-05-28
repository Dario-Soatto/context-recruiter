import { tool } from "ai";
import { z } from "zod";

export const aviatoCompanySearch = tool({
  description:
    "Search for companies using the Aviato DSL. Use this to find companies matching criteria like industry, headcount, funding, location, description keywords, etc. Supports filters with AND/OR logic and operators like eq, in, fts, gte, lte, noteq, textcontains. The filters parameter must be a JSON array (not a string).",
  inputSchema: z.object({
    filters: z
      .any()
      .describe(
        'Array of filter objects for the Aviato DSL. MUST be a JSON array, not a string. Example: [{"AND": [{"country": {"operation": "eq", "value": "United States"}}, {"headcount": {"operation": "gte", "value": 50}}]}]'
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
      .describe("Optional full-text search on company name"),
  }),
  execute: async ({ filters, limit, offset, nameQuery }) => {
    const baseUrl = process.env.AVIATO_API_BASE_URL || "https://data.api.aviato.co";

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

    const response = await fetch(`${baseUrl}/company/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AVIATO_API_KEY}`,
      },
      body: JSON.stringify({ dsl }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Aviato API error ${response.status}: ${errorText}` };
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
