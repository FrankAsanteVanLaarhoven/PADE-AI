import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const root = new URL("..", import.meta.url).pathname;
const shots = `${root}/test-results`;
mkdirSync(shots, { recursive: true });

const api = spawn("pnpm", ["--filter", "@pade/api", "exec", "tsx", "src/server.ts"], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});
const web = spawn("pnpm", ["--filter", "@pade/control-plane", "exec", "vite", "--host", "127.0.0.1", "--port", "4173"], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});

function dump(child, file) {
  let text = "";
  child.stdout.on("data", (chunk) => {
    text += chunk;
  });
  child.stderr.on("data", (chunk) => {
    text += chunk;
  });
  child.once("exit", () => {
    /* log stays in memory until failure */
  });
  return () => text.slice(-4000);
}

const apiLog = dump(api);
const webLog = dump(web);

async function waitFor(url) {
  const started = Date.now();
  while (Date.now() - started < 30000) {
    if (api.exitCode !== null || web.exitCode !== null) {
      throw new Error(`process exited\nAPI ${apiLog()}\nWEB ${webLog()}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`timed out waiting for ${url}\nAPI ${apiLog()}\nWEB ${webLog()}`);
}

const routes = [
  ["/", "overview"],
  ["/registry", "registry"],
  ["/demonstrations", "demonstrations"],
  ["/embodiments", "embodiments"],
  ["/datasets", "datasets"],
  ["/experiments", "experiments"],
  ["/simulation", "simulation"],
  ["/fleetsafe", "fleetsafe"],
  ["/verdictplane", "verdicts"],
  ["/sentinel", "sentinel"],
  ["/failures", "failures"],
  ["/acquisition", "acquisition"],
  ["/deployments", "deployments"],
  ["/evidence", "evidence"],
  ["/standards", "standards"],
];

let failed = false;
function check(cond, message) {
  if (!cond) {
    failed = true;
    console.error(`qa: ${message}`);
  }
}

try {
  await waitFor("http://127.0.0.1:8787/api/v1/health");
  await waitFor("http://127.0.0.1:4173/");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error" && !/fonts\.google|fonts\.gstatic|Failed to load resource/.test(message.text())) errors.push(message.text());
  });

  for (const [route, name] of routes) {
    await page.goto(`http://127.0.0.1:4173${route}`, { waitUntil: "domcontentloaded" });
    await page.locator("h1").first().waitFor();
    await page.waitForFunction(() => !document.body.innerText.includes("Loading the registry"));
    const text = await page.locator("body").innerText();
    check(!/AI-powered|linear-gradient/.test(text), `${name} contains banned copy`);
    check(/fixture|unavailable|Standards|Palette/i.test(text), `${name} does not state where the data came from`);
    await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
  }

  await page.goto("http://127.0.0.1:4173/demonstrations", { waitUntil: "domcontentloaded" });
  await page.getByText("DAR-014402").click();
  await page.getByRole("button", { name: "Open workspace" }).click();
  await page.getByRole("tab", { name: "evidence" }).click();
  await page.getByRole("tab", { name: "lineage" }).click();
  await page.getByRole("tab", { name: "overview" }).click();
  await page.screenshot({ path: `${shots}/object-demo.png`, fullPage: true });
  await page.getByRole("button", { name: "Quarantine" }).click();
  await page.getByText("this session").waitFor();
  await page.screenshot({ path: `${shots}/object-activity.png`, fullPage: true });
  check((await page.locator("body").innerText()).includes("diverges") || (await page.locator("body").innerText()).includes("confirms"), "review did not record an audit line");

  await page.keyboard.press("Meta+k");
  const dialog = page.getByRole("dialog", { name: "Search records" });
  await dialog.waitFor();
  await dialog.getByLabel("Search records").fill("FAIL-02183");
  await dialog.getByRole("button", { name: /FAIL-02183/ }).click();
  await page.locator("h1").filter({ hasText: "FAIL-02183" }).waitFor();

  await page.keyboard.press("g");
  await page.keyboard.press("d");
  await page.waitForURL("**/datasets");
  await page.keyboard.press("g");
  await page.keyboard.press("o");
  await page.waitForURL("http://127.0.0.1:4173/");

  await page.locator("select[aria-label='Environment']").selectOption("field-sim");
  await page.getByText("not copied").waitFor();
  const fieldText = await page.locator("body").innerText();
  check(!fieldText.includes("DAR-008928"), "field-sim copied a lab demonstration");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("select[aria-label='Environment']").selectOption("lab-uk");
  await page.getByText("lab-uk is the fixture corpus").waitFor();
  await page.screenshot({ path: `${shots}/overview-mobile.png`, fullPage: true });
  await page.getByRole("button", { name: "Sections" }).click();
  await page.getByRole("link", { name: /Demonstrations/ }).click();
  await page.locator("h1", { hasText: "Demonstrations" }).waitFor();
  await page.screenshot({ path: `${shots}/demonstrations-mobile.png`, fullPage: true });

  check(errors.length === 0, `console errors: ${errors.join(" | ")}`);
  await browser.close();
} catch (error) {
  failed = true;
  console.error(error);
  console.error(apiLog());
  console.error(webLog());
} finally {
  api.kill("SIGTERM");
  web.kill("SIGTERM");
}

if (failed) process.exit(1);
console.log("qa: screens and workflows passed");
