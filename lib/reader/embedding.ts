export async function embedQuestion(
  query: string,
): Promise<number[] | undefined> {
  if (!process.env.READER_EMBEDDING_URL) return undefined;
  try {
    const response = await fetch(process.env.READER_EMBEDDING_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.READER_EMBEDDING_KEY
          ? { Authorization: `Bearer ${process.env.READER_EMBEDDING_KEY}` }
          : {}),
      },
      body: JSON.stringify({ texts: [`query: ${query}`] }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return undefined;
    const value = await response.json();
    const vector = value.embeddings?.[0];
    return Array.isArray(vector) &&
      vector.length === 384 &&
      vector.every(Number.isFinite)
      ? vector
      : undefined;
  } catch {
    return undefined;
  }
}
