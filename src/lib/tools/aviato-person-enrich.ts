import { tool } from "ai";
import { z } from "zod";

export const aviatoPersonEnrich = tool({
  description:
    "Get full profile details for a specific person from Aviato. Returns work history, education, skills, headline, about, LinkedIn metrics, and more. COSTS 1 CREDIT PER CALL — only use this after narrowing down candidates via search. You can look up by Aviato ID, LinkedIn URL, or email.",
  inputSchema: z.object({
    id: z.string().optional().describe("Aviato person ID from search results"),
    linkedinURL: z.string().optional().describe("LinkedIn profile URL"),
    email: z.string().optional().describe("Email address"),
    preview: z
      .boolean()
      .optional()
      .default(false)
      .describe("If true, returns only name/URLs/email availability (FREE, no credit charge). Use this to check email availability before spending a contact credit."),
  }),
  execute: async ({ id, linkedinURL, email, preview }) => {
    const baseUrl = process.env.AVIATO_API_BASE_URL || "https://data.api.aviato.co";

    const params = new URLSearchParams();
    if (id) params.set("id", id);
    if (linkedinURL) params.set("linkedinURL", linkedinURL);
    if (email) params.set("email", email);
    if (preview) params.set("preview", "true");

    const response = await fetch(`${baseUrl}/person/enrich?${params}`, {
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
