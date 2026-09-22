import { assertOrigin, type Origin } from "@pade/domain";

const LIVE: Origin = "live";
const WAITING: Origin = "unavailable";

export const MODEL_CLASSES = ["world-model", "policy", "value", "perception", "dynamics", "foundation", "other"] as const;
export type ModelClass = (typeof MODEL_CLASSES)[number];

export interface FeedSample {
  id: string;
  source: string;
  origin: Origin;
  what: string;
  use: string;
  modelClass: ModelClass;
  observedAt: string;
  body: string;
}

export interface FeedRecord {
  id: string;
  name: string;
  endpoint: string | null;
  what: string;
  use: string;
  modelClass: ModelClass;
  origin: Origin;
  source: string;
  seenAt: string | null;
  lastError: string | null;
  samples: FeedSample[];
}

const MAX_SAMPLES = 40;
const MAX_BODY = 2000;

export class FeedStore {
  private feeds: FeedRecord[] = [];
  private seq = 1;
  private sampleSeq = 1;

  list(): FeedRecord[] {
    return this.feeds.map((feed) => ({ ...feed, samples: [...feed.samples] }));
  }

  add(input: { name: string; what: string; use: string; modelClass: ModelClass; endpoint: string | null }): FeedRecord {
    const id = `fd-${this.seq++}`;
    const feed: FeedRecord = {
      id,
      name: input.name.trim(),
      endpoint: input.endpoint,
      what: input.what.trim(),
      use: input.use.trim(),
      modelClass: input.modelClass,
      origin: WAITING,
      source: `adapter:feed:${id}`,
      seenAt: null,
      lastError: null,
      samples: [],
    };
    assertOrigin(feed.origin, feed.source);
    this.feeds.unshift(feed);
    return { ...feed, samples: [] };
  }

  endpoints(): { id: string; endpoint: string }[] {
    return this.feeds.flatMap((feed) => (feed.endpoint ? [{ id: feed.id, endpoint: feed.endpoint }] : []));
  }

  markUnreachable(id: string, reason: string): FeedRecord {
    const feed = this.require(id);
    feed.lastError = reason;
    if (feed.samples.length === 0) {
      feed.origin = WAITING;
      feed.source = `adapter:feed:${id}`;
      assertOrigin(feed.origin, feed.source);
    }
    return { ...feed, samples: [...feed.samples] };
  }

  pushSample(id: string, body: unknown, observedAt?: string): FeedSample {
    const feed = this.require(id);
    const at = observedAt && !Number.isNaN(Date.parse(observedAt)) ? new Date(observedAt).toISOString() : new Date().toISOString();
    const source = `feed:${id}`;
    assertOrigin(LIVE, source);
    const sample: FeedSample = {
      id: `smp-${this.sampleSeq++}`,
      source,
      origin: LIVE,
      what: feed.what,
      use: feed.use,
      modelClass: feed.modelClass,
      observedAt: at,
      body: clip(body),
    };
    feed.samples.unshift(sample);
    feed.samples = feed.samples.slice(0, MAX_SAMPLES);
    feed.origin = LIVE;
    feed.source = source;
    feed.seenAt = at;
    feed.lastError = null;
    assertOrigin(feed.origin, feed.source);
    return sample;
  }

  private require(id: string): FeedRecord {
    const feed = this.feeds.find((item) => item.id === id);
    if (!feed) throw new Error(`No feed ${id}`);
    return feed;
  }
}

function clip(body: unknown): string {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  if (text.length <= MAX_BODY) return text;
  return text.slice(0, MAX_BODY);
}
