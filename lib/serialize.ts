/**
 * Serializes Mongoose documents or nested objects into plain JavaScript objects
 * safe for passing from Server Components to Client Components in Next.js.
 * Converts MongoDB ObjectIds to string and Dates to ISO strings.
 */

export function serializeDoc<T = unknown>(doc: unknown): T {
  if (doc === null || doc === undefined) {
    return doc as T;
  }

  return JSON.parse(
    JSON.stringify(doc, (_key: string, value: unknown) => {
      if (value !== null && typeof value === "object") {
        // Handle Mongoose / BSON ObjectId
        const candidate = value as { toHexString?: () => string; _bsontype?: string };
        if (typeof candidate.toHexString === "function") {
          return candidate.toHexString();
        }
        // Handle Date objects
        if (value instanceof Date) {
          return value.toISOString();
        }
      }
      return value;
    })
  ) as T;
}

export function serializeDocs<T = unknown>(docs: unknown[]): T[] {
  if (!Array.isArray(docs)) {
    return [];
  }
  return docs.map((doc) => serializeDoc<T>(doc));
}
