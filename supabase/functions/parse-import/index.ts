import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileContent, existingCollections } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a data import assistant for a tracking app called TrendFlow. Users track numeric data in collections (like Weight in kg, Steps, etc).

You receive raw file content (CSV, text, or tabular data) and must parse it into structured data.

Your job:
1. Identify what collections exist in the data (by column headers, patterns, or context)
2. Extract entries with dates and numeric values
3. Map data to existing collections if they match, or suggest new collection names

Return a JSON object using the tool provided. Rules:
- Each collection needs: title, unit (guess from context like kg, steps, €, etc.), entries (array of {date: "YYYY-MM-DD", value: number, note?: string})
- If dates are ambiguous, use YYYY-MM-DD format, prefer DD.MM.YYYY or MM/DD/YYYY interpretation based on context
- If data is completely unreadable, not numeric, or doesn't contain any trackable data, set success to false and provide an error message
- Match to existing collections by similar title/unit when possible
- Be generous in interpretation but honest when data truly can't be parsed`;

    const existingInfo = existingCollections?.length
      ? `\nExisting collections: ${existingCollections.map((c: any) => `"${c.title}" (${c.unit})`).join(", ")}`
      : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this imported data:${existingInfo}\n\n---\n${fileContent}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "import_result",
              description: "Return the parsed import data",
              parameters: {
                type: "object",
                properties: {
                  success: { type: "boolean", description: "Whether data was successfully parsed" },
                  error: { type: "string", description: "Error message if parsing failed" },
                  collections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        unit: { type: "string" },
                        matchExistingId: { type: "string", description: "ID of existing collection to merge into, or empty" },
                        entries: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              date: { type: "string" },
                              value: { type: "number" },
                              note: { type: "string" },
                            },
                            required: ["date", "value"],
                          },
                        },
                      },
                      required: ["title", "unit", "entries"],
                    },
                  },
                },
                required: ["success"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "import_result" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ success: false, error: "AI could not parse the data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-import error:", e);
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
