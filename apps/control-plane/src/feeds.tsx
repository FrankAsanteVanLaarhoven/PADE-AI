import { useEffect, useState, type FormEvent } from "react";
import { post } from "./api";
import { useI18n } from "./i18n/context";
import { useEnv } from "./shell";
import { SourceLine, useTitle } from "./ui";

const MODELS = ["world-model", "policy", "value", "perception", "dynamics", "foundation", "other"] as const;

interface Sample {
  id: string;
  source: string;
  origin: string;
  what: string;
  use: string;
  modelClass: string;
  observedAt: string;
  body: string;
}

interface Feed {
  id: string;
  name: string;
  endpoint: string | null;
  what: string;
  use: string;
  modelClass: string;
  origin: string;
  source: string;
  seenAt: string | null;
  lastError: string | null;
  samples: Sample[];
}

export function FeedsPage() {
  const { env } = useEnv();
  const { t } = useI18n();
  useTitle(t("navFeeds"));
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [what, setWhat] = useState("");
  const [use, setUse] = useState("");
  const [modelClass, setModelClass] = useState<(typeof MODELS)[number]>("world-model");
  const [endpoint, setEndpoint] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [reading, setReading] = useState("");

  useEffect(() => {
    let live = true;
    async function load() {
      try {
        const response = await fetch("/api/v1/feeds", { headers: { accept: "application/json", "x-pade-env": env } });
        if (!response.ok) throw new Error(String(response.status));
        const body = (await response.json()) as { feeds: Feed[] };
        if (live) {
          setFeeds(body.feeds);
          setError(null);
        }
      } catch (cause) {
        if (live) setError(cause instanceof Error ? cause.message : "unavailable");
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 1000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, [env]);

  async function addFeed(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const created = await post<Feed>("/api/v1/feeds", env, {
        name,
        what,
        use,
        modelClass,
        endpoint: endpoint || undefined,
      });
      setFeeds((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setOpen(created.id);
      setName("");
      setWhat("");
      setUse("");
      setEndpoint("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "unavailable");
    }
  }

  async function addReading(id: string) {
    setError(null);
    let body: unknown = reading;
    try {
      body = JSON.parse(reading);
    } catch {
      /* a reading may be text */
    }
    try {
      await post(`/api/v1/feeds/${id}/samples`, env, { body });
      setReading("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "unavailable");
    }
  }

  const selected = feeds.find((feed) => feed.id === open) ?? null;

  return (
    <div className="page">
      <h1>{t("navFeeds")}</h1>
      {error ? <p className="statusline tone-bad">{error}</p> : null}
      {feeds.length === 0 ? <SourceLine origin="unavailable" source="adapter:collection" /> : null}
      <form className="feed-form" onSubmit={addFeed}>
        <input aria-label="Name" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} required />
        <input aria-label="What" placeholder="What" value={what} onChange={(event) => setWhat(event.target.value)} required />
        <input aria-label="Use" placeholder="Use" value={use} onChange={(event) => setUse(event.target.value)} required />
        <select aria-label="Model" value={modelClass} onChange={(event) => setModelClass(event.target.value as (typeof MODELS)[number])}>
          {MODELS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <input aria-label="Endpoint" placeholder="Endpoint" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} />
        <button type="submit" className="btn">Add</button>
      </form>
      <div className="table-wrap boxed">
        <table className="data">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Source</th>
              <th scope="col">What</th>
              <th scope="col">Use</th>
              <th scope="col">Model</th>
              <th scope="col">Origin</th>
              <th scope="col">Seen</th>
            </tr>
          </thead>
          <tbody>
            {feeds.map((feed) => (
              <tr key={feed.id} aria-selected={feed.id === open} onClick={() => setOpen(feed.id)}>
                <td>{feed.name}</td>
                <td className="mono">{feed.source}</td>
                <td>{feed.what}</td>
                <td>{feed.use}</td>
                <td className="mono">{feed.modelClass}</td>
                <td>{feed.origin}</td>
                <td className="mono">{feed.seenAt ?? feed.lastError ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <h2 className="set-title">{selected.name}</h2>
          <SourceLine origin={selected.origin} source={selected.source} />
          <form
            className="feed-form feed-reading"
            onSubmit={(event) => {
              event.preventDefault();
              void addReading(selected.id);
            }}
          >
            <input aria-label="Reading" placeholder="Reading" value={reading} onChange={(event) => setReading(event.target.value)} required />
            <button type="submit" className="btn">Add</button>
          </form>
          <div className="table-wrap boxed">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Seen</th>
                  <th scope="col">Source</th>
                  <th scope="col">What</th>
                  <th scope="col">Use</th>
                  <th scope="col">Model</th>
                  <th scope="col">Reading</th>
                </tr>
              </thead>
              <tbody>
                {selected.samples.map((sample) => (
                  <tr key={sample.id}>
                    <td className="mono">{sample.observedAt}</td>
                    <td className="mono">{sample.source}</td>
                    <td>{sample.what}</td>
                    <td>{sample.use}</td>
                    <td className="mono">{sample.modelClass}</td>
                    <td className="mono">{sample.body}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
