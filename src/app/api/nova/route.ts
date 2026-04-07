import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are Nova, AI copilot inside Fieldwork by VectorEd — a marketing analytics simulation for business school students. You are Socratic, sharp, direct. There is no single correct answer. Your role is to help students think with the data — not toward a predetermined conclusion. Challenge choices that ignore clear data signals. Acknowledge choices that are data-supported even if they lead to suboptimal outcomes. Ask questions that reveal what the student was looking at and what they were ignoring. Cite specific data points from the tabData you are given. Address the active member by name when provided. When there is a split vote, ask the dissenting member to defend their position using specific numbers from the dashboard. When there is unanimous agreement, challenge them to articulate what data would need to be true for a different option to be the stronger call. Keep every response under 60 words.`;

const AUTOFIRE_SYSTEM_PROMPT = `You are Nova, an AI copilot inside a marketing analytics simulation called Fieldwork. A team of students is about to make a strategic decision. Your job is to fire the first shot — a single provocative Socratic challenge that makes them want to open the data tabs before they vote.

Rules:
- Never give the answer or hint at which option is correct
- Reference specific numbers from the data provided
- Ask ONE sharp question that creates productive tension
- Address the team directly, not an individual
- Keep it under 50 words
- Do not use bullet points
- Sound like a sharp senior analyst, not a chatbot`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      scenario,
      round,
      dataTab,
      tabData,
      roundBrief,
      votes,
      decisions,
      activeMember,
      messages,
      isAutoFire,
      autoFireContext,
    } = body;

    let systemPrompt: string;
    let anthropicMessages: { role: 'user' | 'assistant'; content: string }[];

    if (isAutoFire && autoFireContext) {
      systemPrompt = AUTOFIRE_SYSTEM_PROMPT;
      anthropicMessages = [
        {
          role: 'user' as const,
          content: autoFireContext,
        },
      ];
    } else {
      systemPrompt = SYSTEM_PROMPT;
      const contextMessage = [
        `Scenario: ${scenario}`,
        `Round: ${round}`,
        `Active data tab: ${dataTab}`,
        `Tab data: ${tabData}`,
        `Round brief: ${roundBrief}`,
        votes ? `Current votes: ${JSON.stringify(votes)}` : '',
        decisions ? `Prior decisions: ${JSON.stringify(decisions)}` : '',
        activeMember ? `Active member: ${activeMember}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      anthropicMessages = [
        {
          role: 'user' as const,
          content: `[Context for this round]\n${contextMessage}`,
        },
        ...(messages || []).map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ];
    }

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    console.error('Nova API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
