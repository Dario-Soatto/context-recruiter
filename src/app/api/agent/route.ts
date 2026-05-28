import { streamText, tool, stepCountIs, convertToModelMessages, createGateway } from "ai";
import { systemPrompt } from "@/lib/agent/system-prompt";
import { aviatoPersonSearch } from "@/lib/tools/aviato-person-search";
import { aviatoCompanySearch } from "@/lib/tools/aviato-company-search";
import { aviatoPersonEnrich } from "@/lib/tools/aviato-person-enrich";
import { aviatoCompanyEnrich } from "@/lib/tools/aviato-company-enrich";
import { aviatoCompanyEmployees } from "@/lib/tools/aviato-company-employees";
import { aviatoCompanyAcquisitions } from "@/lib/tools/aviato-company-acquisitions";
import { webSearch } from "@/lib/tools/web-search";
import { z } from "zod";

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? "",
});

const AVIATO_BASE_URL = process.env.AVIATO_API_BASE_URL || "https://data.api.aviato.co";

export const maxDuration = 120;

async function enrichPerson(id: string) {
  const response = await fetch(`${AVIATO_BASE_URL}/person/enrich?id=${id}`, {
    headers: {
      Authorization: `Bearer ${process.env.AVIATO_API_KEY}`,
    },
  });
  if (!response.ok) return null;
  return response.json();
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: gateway("anthropic/claude-sonnet-4.5"),
    system: systemPrompt,
    messages: modelMessages,
    tools: {
      person_search: aviatoPersonSearch,
      company_search: aviatoCompanySearch,
      person_enrich: aviatoPersonEnrich,
      company_enrich: aviatoCompanyEnrich,
      company_employees: aviatoCompanyEmployees,
      company_acquisitions: aviatoCompanyAcquisitions,
      web_search: webSearch,
      ask_user: tool({
        description:
          "Ask the user a clarifying question when the query is ambiguous or you need their input to proceed.",
        inputSchema: z.object({
          question: z.string().describe("The question to ask the user"),
        }),
      }),
      add_candidates: tool({
        description:
          "Surface candidate matches to the user in a sidebar panel with full enriched profiles. COSTS 1 CREDIT PER CANDIDATE. You MUST use ask_user BEFORE calling this to get the user's permission on how many candidates to surface and any preferences. Never call this without explicit user approval.",
        inputSchema: z.object({
          candidates: z
            .array(
              z.object({
                id: z.string().describe("Person ID"),
                fullName: z.string(),
                location: z.string(),
                linkedinUrl: z.string().nullable().describe("LinkedIn URL from search results"),
                twitterUrl: z.string().nullable().describe("Twitter/X URL if available"),
              })
            )
            .describe("Array of candidate matches to surface — only include the number the user approved"),
        }),
        execute: async ({ candidates }) => {
          // Enrich each candidate via Aviato in parallel (batches of 5)
          const enrichedCandidates = [];
          const batchSize = 5;

          for (let i = 0; i < candidates.length; i += batchSize) {
            const batch = candidates.slice(i, i + batchSize);
            const results = await Promise.all(
              batch.map(async (candidate) => {
                const enriched = await enrichPerson(candidate.id);
                if (!enriched) {
                  return {
                    ...candidate,
                    enrichment: null,
                  };
                }

                return {
                  ...candidate,
                  enrichment: {
                    headline: enriched.headline ?? null,
                    about: enriched.about ?? null,
                    skills: enriched.skills ?? [],
                    experience: (enriched.experienceList ?? []).slice(0, 5).map(
                      (exp: {
                        companyName?: string;
                        positionList?: Array<{
                          title?: string;
                          department?: string;
                          seniorityScore?: number;
                          description?: string;
                          startDate?: string;
                          location?: string;
                        }>;
                        startDate?: string;
                        endDate?: string;
                      }) => ({
                        company: exp.companyName,
                        positions: (exp.positionList ?? []).map((p) => ({
                          title: p.title,
                          department: p.department,
                          seniorityScore: p.seniorityScore,
                          description: p.description?.slice(0, 300),
                        })),
                        startDate: exp.startDate,
                        endDate: exp.endDate,
                      })
                    ),
                    education: (enriched.educationList ?? []).map(
                      (edu: {
                        name?: string;
                        subject?: string;
                        startDate?: string;
                        endDate?: string;
                      }) => ({
                        school: edu.name,
                        field: edu.subject,
                        startDate: edu.startDate,
                        endDate: edu.endDate,
                      })
                    ),
                  },
                };
              })
            );
            enrichedCandidates.push(...results);
          }

          return {
            count: enrichedCandidates.length,
            candidates: enrichedCandidates,
          };
        },
      }),
    },
    stopWhen: stepCountIs(15),
  });

  return result.toUIMessageStreamResponse();
}
