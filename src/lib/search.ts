import type { SearchSource } from './db';

export async function searchWeb(query: string, apiKey: string): Promise<{ results: SearchSource[]; answer?: string }> {
    const resp = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            api_key: apiKey,
            query,
            search_depth: 'basic',
            include_answer: true,
            max_results: 8,
        }),
    });

    if (!resp.ok) {
        const errorText = await resp.text().catch(() => resp.statusText);
        throw new Error(`Tavily search error (${resp.status}): ${errorText}`);
    }

    const data = await resp.json();
    const results: SearchSource[] = (data.results || []).map((r: { title: string; url: string; content: string; score?: number }) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
    }));

    return { results, answer: data.answer };
}

export function formatSearchResultsForPrompt(results: SearchSource[]): string {
    if (!results.length) return '';

    let formatted = '\n\n---\n\n**🔍 LIVE WEB SEARCH RESULTS** (use these as your PRIMARY source — they are more current than your training data)\n\n';
    formatted += `Search returned ${results.length} results. Cite them using [1], [2], etc.\n\n`;

    results.forEach((r, i) => {
        formatted += `**[${i + 1}] ${r.title}**\n`;
        formatted += `${r.content}\n`;
        formatted += `Source: ${r.url}\n\n`;
    });

    formatted += '---\n\n**REMINDER:** Base your answer primarily on the above search results. Cite sources inline.\n';

    return formatted;
}
