import { AttachmentBuilder, TextChannel } from 'discord.js';
import { escapeHtml } from '../utils/discord';

export async function buildTranscriptAttachment(channel: TextChannel, title: string) {
  const fetched: any[] = [];
  let lastId: string | undefined;

  while (true) {
    const batch = await channel.messages.fetch({ limit: 100, before: lastId });
    if (!batch.size) break;
    fetched.push(...Array.from(batch.values()));
    lastId = batch.last()?.id;
    if (batch.size < 100) break;
  }

  fetched.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const rows = fetched.map((message) => {
    const author = escapeHtml(message.author?.tag || 'Unknown');
    const time = new Date(message.createdTimestamp).toISOString();
    const content = escapeHtml(message.content || '[no text content]');
    return `<div class="msg"><div class="meta"><strong>${author}</strong> <span>${time}</span></div><pre>${content}</pre></div>`;
  }).join('\n');

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
body{font-family:Arial,sans-serif;background:#111827;color:#f9fafb;padding:20px}
.msg{border:1px solid #374151;border-radius:10px;padding:12px;margin-bottom:12px;background:#1f2937}
.meta{margin-bottom:8px;color:#d1d5db}
pre{white-space:pre-wrap;word-break:break-word;margin:0;font-family:inherit}
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
${rows || '<p>No messages found.</p>'}
</body>
</html>`;

  return new AttachmentBuilder(Buffer.from(html, 'utf8'), { name: `${channel.name}-transcript.html` });
}
