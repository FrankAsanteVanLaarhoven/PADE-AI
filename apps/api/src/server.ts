import { serve } from "@hono/node-server";
import { MemoryRegistry, RegistryError } from "@pade/registry";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ZodError, z } from "zod";

const registry = new MemoryRegistry();
const app = new Hono();

app.use("*", cors());

function environment(header: string | undefined): string {
  return header ?? "lab-uk";
}

function respond(header: string | undefined, produce: (env: string) => unknown) {
  try {
    return Response.json(produce(environment(header)));
  } catch (error) {
    if (error instanceof RegistryError) return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof ZodError) return Response.json({ error: "Request did not match the contract." }, { status: 400 });
    console.error(error);
    return Response.json({ error: "Control plane API failed." }, { status: 500 });
  }
}

const actorBody = z.object({ actor: z.string().min(1).default("local-operator") });

app.get("/api/v1/health", (c) => c.json({ ok: true, service: "pade-api", mode: "fixture-registry" }));
app.get("/api/v1/meta", (c) => respond(c.req.header("x-pade-env"), (env) => registry.meta(env)));
app.get("/api/v1/overview", (c) => respond(c.req.header("x-pade-env"), (env) => registry.overview(env)));
app.get("/api/v1/registry", (c) => respond(c.req.header("x-pade-env"), (env) => registry.registry(env)));
app.get("/api/v1/demonstrations", (c) => respond(c.req.header("x-pade-env"), (env) => registry.demonstrations(env)));
app.get("/api/v1/embodiments", (c) => respond(c.req.header("x-pade-env"), (env) => registry.embodimentList(env)));
app.get("/api/v1/datasets", (c) => respond(c.req.header("x-pade-env"), (env) => registry.datasetFactory(env)));
app.get("/api/v1/experiments", (c) => respond(c.req.header("x-pade-env"), (env) => registry.experiments(env)));
app.get("/api/v1/simulation", (c) => respond(c.req.header("x-pade-env"), (env) => registry.simulation(env)));
app.get("/api/v1/fleetsafe", (c) => respond(c.req.header("x-pade-env"), (env) => registry.fleetsafe(env)));
app.get("/api/v1/verdicts", (c) => respond(c.req.header("x-pade-env"), (env) => registry.verdictList(env)));
app.get("/api/v1/sentinel", (c) => respond(c.req.header("x-pade-env"), (env) => registry.sentinel(env)));
app.get("/api/v1/failures", (c) => respond(c.req.header("x-pade-env"), (env) => registry.failureList(env)));
app.get("/api/v1/acquisitions", (c) => respond(c.req.header("x-pade-env"), (env) => registry.acquisitionList(env)));
app.get("/api/v1/deployments", (c) => respond(c.req.header("x-pade-env"), (env) => registry.deployments(env)));
app.get("/api/v1/evidence", (c) => respond(c.req.header("x-pade-env"), (env) => registry.evidence(env)));
app.get("/api/v1/search", (c) => respond(c.req.header("x-pade-env"), (env) => registry.search(env, c.req.query("q") ?? "")));
app.get("/api/v1/objects/:kind/:id", (c) =>
  respond(c.req.header("x-pade-env"), (env) => registry.object(env, c.req.param("kind"), c.req.param("id"))),
);

app.post("/api/v1/demonstrations/:id/review", (c) =>
  mutate(c, actorBody.extend({ action: z.enum(["admit", "quarantine", "reject"]) }), (env, body) =>
    registry.reviewDemonstration(env, c.req.param("id"), body.action, body.actor),
  ),
);

app.post("/api/v1/verdicts/:id/decision", (c) =>
  mutate(c, actorBody.extend({ action: z.enum(["allow", "conditional", "deny"]) }), (env, body) =>
    registry.decideVerdict(env, c.req.param("id"), body.action, body.actor),
  ),
);

app.post("/api/v1/acquisitions/:id/state", (c) =>
  mutate(c, actorBody.extend({ action: z.enum(["scheduled", "dismissed"]) }), (env, body) =>
    registry.setAcquisition(env, c.req.param("id"), body.action, body.actor),
  ),
);

async function mutate<T extends z.ZodTypeAny>(
  c: { req: { header: (name: string) => string | undefined; json: () => Promise<unknown> } },
  schema: T,
  run: (env: string, body: z.infer<T>) => unknown,
) {
  try {
    const body = schema.parse(await c.req.json());
    return respond(c.req.header("x-pade-env"), (env) => run(env, body));
  } catch (error) {
    if (error instanceof ZodError) return Response.json({ error: "Request did not match the contract." }, { status: 400 });
    throw error;
  }
}

app.get("/api/v1/voice", (c) => c.json({ engine: process.env.XAI_API_KEY ? "grok" : "device" }));

const TTS_LANGUAGE: Record<string, string> = {
  en: "en",
  zh: "zh",
  hi: "hi",
  es: "es-ES",
  fr: "fr",
  ar: "ar-SA",
  bn: "bn",
  pt: "pt-PT",
  ja: "ja",
  de: "de",
  ko: "ko",
  tr: "tr",
  vi: "vi",
  id: "id",
  it: "it",
  ru: "ru",
};

app.post("/api/v1/voice/speak", async (c) => {
  const key = process.env.XAI_API_KEY;
  if (!key) return c.json({ engine: "device", reason: "XAI_API_KEY is not set" }, 503);
  try {
    const body = z.object({ text: z.string().min(1).max(4000), language: z.string().min(2).max(16) }).parse(await c.req.json());
    const language = TTS_LANGUAGE[body.language.slice(0, 2).toLowerCase()] ?? "auto";
    const response = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        text: body.text,
        voice_id: "eve",
        language,
        output_format: { codec: "mp3", sample_rate: 24000, bit_rate: 128000 },
      }),
    });
    if (!response.ok) return c.json({ error: "Grok speech failed" }, 502);
    return new Response(await response.arrayBuffer(), { headers: { "content-type": "audio/mpeg" } });
  } catch (error) {
    if (error instanceof ZodError) return c.json({ error: "Request did not match the contract." }, 400);
    console.error(error);
    return c.json({ error: "Grok speech failed" }, 502);
  }
});

const port = Number(process.env.PADE_API_PORT ?? 8787);
serve({ fetch: app.fetch, port, hostname: "127.0.0.1" }, () => {
  console.log(`pade-api listening on ${port}`);
});
