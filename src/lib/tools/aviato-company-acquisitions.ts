import { tool } from "ai";
import { z } from "zod";

export const aviatoCompanyAcquisitions = tool({
  description:
    "Get acquisitions made by a company. Useful for finding acquihired companies and their teams. Returns acquiree name, date, price (if available), and company details. Does NOT cost enrich credits.",
  inputSchema: z.object({
    id: z.string().optional().describe("Aviato company ID"),
    linkedinURL: z.string().optional().describe("Company LinkedIn URL"),
    website: z.string().optional().describe("Company website URL"),
    page: z.number().optional().default(1).describe("Page number"),
    perPage: z.number().optional().default(20).describe("Results per page"),
  }),
  execute: async ({ id, linkedinURL, website, page, perPage }) => {
    const baseUrl = process.env.AVIATO_API_BASE_URL || "https://data.api.aviato.co";

    const params = new URLSearchParams();
    if (id) params.set("id", id);
    if (linkedinURL) params.set("linkedinURL", linkedinURL);
    if (website) params.set("website", website);
    params.set("page", String(page ?? 1));
    params.set("perPage", String(Math.min(perPage ?? 20, 100)));

    const response = await fetch(`${baseUrl}/company/acquisitions?${params}`, {
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
      acquisitions: data.acquisitions,
    };
  },
});
