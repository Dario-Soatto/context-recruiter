import { tool } from "ai";
import { z } from "zod";

export const webSearch = tool({
  description:
    "Search the web using Parallel. Use this for finding information NOT available in Aviato — such as recent acquisitions, acquihires, lists of top accelerators, company news, industry trends, or expanding a vague concept into concrete company/school names. Do NOT use this to search for individual people — use Aviato for that.",
  inputSchema: z.object({
    objective: z
      .string()
      .describe(
        "Natural language description of what you want to find on the web"
      ),
    search_queries: z
      .array(z.string())
      .optional()
      .describe("Optional specific keyword search queries to run"),
  }),
  execute: async ({ objective, search_queries }) => {
    const response = await fetch("https://api.parallel.ai/v1beta/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.PARALLEL_API_KEY!,
      },
      body: JSON.stringify({
        objective,
        search_queries: search_queries ?? [],
        mode: "fast",
        max_results: 10,
        excerpts: { max_chars_per_result: 3000 },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Parallel API error ${response.status}: ${errorText}` };
    }

    const data = await response.json();

    const results = (data.results || []).map(
      (r: { url: string; title: string; publish_date: string; excerpts: string[] }) => ({
        title: r.title,
        url: r.url,
        publishDate: r.publish_date,
        excerpts: r.excerpts?.slice(0, 2) ?? [],
      })
    );

    return { resultCount: results.length, results };
  },
});
