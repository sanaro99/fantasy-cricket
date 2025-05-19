import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

// Initialize Supabase with service role for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const fixtureId = parseInt(req.query.fixture_id, 10);
  if (isNaN(fixtureId)) {
    return res.status(400).json({ error: 'Invalid fixture_id' });
  }

  try {
    // Check cache
    const { data: cacheRows, error: cacheErr } = await supabase
      .from('cache_ai_summary')
      .select('summary, fetched_at')
      .eq('fixture_id', fixtureId);
    if (cacheErr) throw cacheErr;

    if (cacheRows.length > 0) {
      const cached = cacheRows[0];
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age < 1000 * 60 * 60) {
        return res.status(200).json({ fixture_id: fixtureId, summary: cached.summary, source: 'cache' });
      }
    }

    // Fetch fixture details from cache
    const { data: fixtureCacheRows, error: fcErr } = await supabase
      .from('fixture_cache')
      .select('fixtures')
      .order('fetched_at', { ascending: false })
      .limit(1);
    if (fcErr || fixtureCacheRows.length === 0) {
      throw fcErr || new Error('No fixture cache available');
    }
    const fixturesArr = fixtureCacheRows[0].fixtures.data || fixtureCacheRows[0].fixtures;
    const fixture = fixturesArr.find(f => f.id === fixtureId);
    if (!fixture) {
      return res.status(404).json({ error: 'Fixture not found in cache' });
    }

    // Build prompt
    const prompt = `Generate a brief summary for the upcoming cricket match between ${fixture.localteam.name} and ${fixture.visitorteam.name} scheduled at ${fixture.starting_at}. Highlight players to watch, any injury news, key match-ups, probable playing XI, probable impact players, pitch report, and any other relevant information. Output only raw HTML (no markdown or code fences). Use up to <h4> tags. For styling, apply Tailwind CSS classes: headings use 'text-white font-semibold text-base mb-2', subheadings use 'text-white font-medium text-base mt-4', paragraphs use 'text-white/90 text-sm mt-2', and lists use <ul class="list-disc list-inside ml-4 text-white/90"> with <li class="mb-1"> elements.`;

    // Call Gemini API
    // const resp = await ai.generateContent(
    //   `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    //   {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       contents: [
    //         { parts: [{ text: prompt }] }
    //       ],
    //       tools: [
    //         { google_search: {} }
    //       ]
    //     })
    //   }
    // );

    try {
      const resp = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.5
        }
      });
    
      // extract text from the first candidate
      let summary =
        resp.candidates?.[0]?.content?.parts?.[0]?.text
        ?? resp.candidates?.[0]?.output?.content
        ?? "";
      // Remove leading/trailing markdown code fences if present
      summary = summary.replace(/^```html\s*/i, '').replace(/```\s*$/i, '');

      // upsert cache as before
      await supabase
        .from("cache_ai_summary")
        .upsert(
          { fixture_id: fixtureId, summary, fetched_at: new Date().toISOString() },
          { onConflict: ["fixture_id"] }
        );

      return res.status(200).json({ fixture_id: fixtureId, summary, source: "generated" });
    } catch (err) {
      console.error("Gemini API error:", err);
      return res.status(500).json({ error: err.message });
    }
  } catch (err) {
    console.error("Error in ai-summary:", err);
    return res.status(500).json({ error: err.message });
  }
}
