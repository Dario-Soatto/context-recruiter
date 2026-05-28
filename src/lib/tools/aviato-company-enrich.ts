import { tool } from "ai";
import { z } from "zod";

export const aviatoCompanyEnrich = tool({
  description:
    "Get full details for a specific company from Aviato. Returns description, funding, headcount, founders, tech stack, industries, web traffic, and more. COSTS 1 CREDIT PER CALL — only use when you need detailed company info. You can look up by Aviato ID, LinkedIn URL, or website.",
  inputSchema: z.object({
    id: z.string().optional().describe("Aviato company ID from search results"),
    linkedinURL: z.string().optional().describe("Company LinkedIn URL"),
    website: z.string().optional().describe("Company website URL"),
    preview: z
      .boolean()
      .optional()
      .default(false)
      .describe("If true, returns only name/URLs (FREE, no credit charge)."),
    full: z
      .boolean()
      .optional()
      .default(false)
      .describe("If true, includes funding rounds, investments, acquisitions lists."),
  }),
  execute: async ({ id, linkedinURL, website, preview, full }) => {
    const baseUrl = process.env.AVIATO_API_BASE_URL || "https://data.api.aviato.co";

    const params = new URLSearchParams();
    if (id) params.set("id", id);
    if (linkedinURL) params.set("linkedinURL", linkedinURL);
    if (website) params.set("website", website);
    if (preview) params.set("preview", "true");
    if (full) params.set("full", "true");

    const response = await fetch(`${baseUrl}/company/enrich?${params}`, {
      headers: {
        Authorization: `Bearer ${process.env.AVIATO_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Aviato API error ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return data;
  },
});
