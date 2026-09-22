import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { api } from "./api";
import { ObjectPage } from "./object";
import {
  AcquisitionPage,
  DatasetsPage,
  DemonstrationsPage,
  DeploymentsPage,
  EmbodimentsPage,
  EvidencePage,
  ExperimentsPage,
  FailuresPage,
  FleetPage,
  OverviewPage,
  RegistryPage,
  SentinelPage,
  SimulationPage,
  VerdictsPage,
} from "./pages";
import { FeedsPage } from "./feeds";
import { StandardsPage } from "./standards";
import type { Meta } from "./types";
import { LOCALES, useI18n } from "./i18n/context";
import { CHORDS, NAV } from "./nav";
import { Clock } from "./clock";
import { VoiceDock } from "./voice";
import { isTyping } from "./ui";

interface EnvValue {
  env: string;
  setEnv: (env: string) => void;
  meta: Meta | null;
}

const EnvContext = createContext<EnvValue | null>(null);

export function useEnv(): EnvValue {
  const value = useContext(EnvContext);
  if (!value) throw new Error("environment context missing");
  return value;
}

export function App() {
  const [env, setEnv] = useState("lab-uk");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [rail, setRail] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("pade-rail") === "collapsed";
    } catch {
      return false;
    }
  });
  const [palette, setPalette] = useState(false);
  const [help, setHelp] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let live = true;
    setMetaError(null);
    api<Meta>("/api/v1/meta", env)
      .then((next) => {
        if (live) setMeta(next);
      })
      .catch((error: Error) => {
        if (live) setMetaError(error.message);
      });
    return () => {
      live = false;
    };
  }, [env]);

  useEffect(() => {
    setRail(false);
  }, [location.pathname]);

  useEffect(() => {
    let chord = false;
    let timer = 0;
    function onKey(event: KeyboardEvent) {
      if (isTyping(event)) return;
      const metaKey = event.metaKey || event.ctrlKey;
      if (metaKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setHelp(false);
        setPalette((open) => !open);
        return;
      }
      if (palette || help) {
        if (event.key === "Escape") {
          setPalette(false);
          setHelp(false);
        }
        return;
      }
      if (event.key === "?") {
        setHelp(true);
        return;
      }
      if (!chord && event.key === "g" && !metaKey && !event.altKey) {
        chord = true;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          chord = false;
        }, 800);
        return;
      }
      if (chord) {
        chord = false;
        window.clearTimeout(timer);
        const href = CHORDS[event.key.toLowerCase()];
        if (href) {
          event.preventDefault();
          navigate(href);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [help, navigate, palette]);

  useEffect(() => {
    document.body.dataset.modal = palette || help ? "open" : "";
    return () => {
      delete document.body.dataset.modal;
    };
  }, [help, palette]);

  const value = useMemo(() => ({ env, setEnv, meta }), [env, meta]);
  const { t } = useI18n();

  useEffect(() => {
    try {
      localStorage.setItem("pade-rail", collapsed ? "collapsed" : "open");
    } catch {
      /* private mode */
    }
  }, [collapsed]);

  return (
    <EnvContext.Provider value={value}>
      <div className="shell" data-collapsed={collapsed ? "true" : "false"}>
        <a className="skip" href="#content">
          Skip to content
        </a>
        <nav className={rail ? "rail open" : "rail"} aria-label="Sections">
          <div className="brand">
            <strong className="hide-collapsed">PADE</strong>
            <strong className="show-collapsed">P</strong>
            <span className="hide-collapsed">{t("brandSub")}</span>
            <button
              type="button"
              className="btn rail-toggle"
              aria-label={collapsed ? t("expand") : t("collapse")}
              onClick={() => setCollapsed((value) => !value)}
            >
              <i />
            </button>
          </div>
          {NAV.map((group) => (
            <div key={group.group} className="group">
              <p className="hide-collapsed">{t(group.group)}</p>
              {group.items.map((item) => (
                <NavLink key={item.href} to={item.href} end={item.href === "/"} className="nav">
                  <span className="hide-collapsed">{t(item.label)}</span>
                  <kbd>{item.key.toUpperCase()}</kbd>
                </NavLink>
              ))}
            </div>
          ))}
          <div className="rail-foot hide-collapsed">
            <b>{env}</b>
            <b>{meta?.release ?? "—"}</b>
            <b>{meta?.mode ?? "…"}</b>
          </div>
        </nav>
        <div className="main">
          <header className="topbar">
            <button type="button" className="btn menu-btn" onClick={() => setRail((open) => !open)} aria-expanded={rail}>
              {t("sections")}
            </button>
            <button type="button" className="search-btn" onClick={() => setPalette(true)}>
              <span>{t("search")}</span>
              <kbd>⌘K</kbd>
            </button>
            <ThemeLanguage />
            <Clock />
            {meta?.auth === "required" ? (
              <input
                className="operator"
                type="password"
                aria-label="Operator"
                placeholder="Operator"
                defaultValue=""
                onChange={(event) => {
                  try {
                    sessionStorage.setItem("pade-operator", event.target.value);
                  } catch {
                    /* private mode */
                  }
                }}
              />
            ) : null}
            <label className="scope">
              <select aria-label={t("environment")} value={env} onChange={(event) => setEnv(event.target.value)}>
                {(meta?.environments ?? [
                  { id: "lab-uk", label: "lab-uk", detail: "fixture corpus" },
                  { id: "field-sim", label: "field-sim", detail: "no data plane" },
                ]).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label} · {item.detail}
                  </option>
                ))}
              </select>
            </label>
            <label className="scope">
              <select aria-label={t("release")} value={meta?.release ?? ""} disabled>
                <option value={meta?.release ?? ""}>{meta?.release ?? t("releaseNone")}</option>
              </select>
            </label>
          </header>
          <ScrollTube />
          {metaError ? <p className="banner">{t("apiDown")} {metaError}</p> : null}
          <div id="content">
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/collection" element={<FeedsPage />} />
              <Route path="/registry" element={<RegistryPage />} />
              <Route path="/demonstrations" element={<DemonstrationsPage />} />
              <Route path="/embodiments" element={<EmbodimentsPage />} />
              <Route path="/datasets" element={<DatasetsPage />} />
              <Route path="/experiments" element={<ExperimentsPage />} />
              <Route path="/simulation" element={<SimulationPage />} />
              <Route path="/fleetsafe" element={<FleetPage />} />
              <Route path="/verdictplane" element={<VerdictsPage />} />
              <Route path="/sentinel" element={<SentinelPage />} />
              <Route path="/failures" element={<FailuresPage />} />
              <Route path="/acquisition" element={<AcquisitionPage />} />
              <Route path="/deployments" element={<DeploymentsPage />} />
              <Route path="/evidence" element={<EvidencePage />} />
              <Route path="/standards" element={<StandardsPage />} />
              <Route path="/o/:kind/:id" element={<ObjectPage />} />
              <Route path="*" element={<Missing />} />
            </Routes>
          </div>
        </div>
        {palette ? <Palette env={env} onClose={() => setPalette(false)} /> : null}
        {help ? <Help onClose={() => setHelp(false)} /> : null}
        <VoiceDock />
      </div>
    </EnvContext.Provider>
  );
}

function Missing() {
  const { t } = useI18n();
  useEffect(() => {
    document.title = `${t("notFoundTitle")} — PADE`;
  }, [t]);
  return (
    <div className="page">
      <h1>{t("notFoundTitle")}</h1>
      <p className="lede">{t("notFoundLede")}</p>
    </div>
  );
}

function ThemeLanguage() {
  const { t, theme, setTheme, locale, setLocale } = useI18n();
  return (
    <>
      <label className="scope">
        <select aria-label={t("theme")} value={theme} onChange={(event) => setTheme(event.target.value as "light" | "dark" | "system")}>
          <option value="light">{t("themeLight")}</option>
          <option value="dark">{t("themeDark")}</option>
          <option value="system">{t("themeSystem")}</option>
        </select>
      </label>
      <label className="scope">
        <select aria-label={t("language")} value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)}>
          {LOCALES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.native}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

function ScrollTube() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setWidth(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="tube-track" aria-hidden="true">
      <i style={{ width: `${width}%` }} />
    </div>
  );
}

function Palette({ env, onClose }: { env: string; onClose: () => void }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ href: string; title: string; subtitle: string }[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const needle = query.trim().toLowerCase();
    const pages = NAV.flatMap((group) => group.items)
      .filter((item) => t(item.label).toLowerCase().includes(needle))
      .map((item) => ({ href: item.href, title: t(item.label), subtitle: t("sections") }));
    if (!query.trim()) {
      setHits(pages);
      setIndex(0);
      return;
    }
    const handle = window.setTimeout(() => {
      api<{ results: { kind: string; id: string; title: string; subtitle: string; origin: string }[]; note: string | null }>(
        `/api/v1/search?q=${encodeURIComponent(query)}`,
        env,
      )
        .then((result) => {
          const records = result.results.map((item) => ({
            href: `/o/${item.kind}/${item.id}`,
            title: item.id,
            subtitle: `${item.origin} · ${item.title}`,
          }));
          setHits([...records, ...pages]);
          setIndex(0);
        })
        .catch(() => {
          setHits(pages);
          setIndex(0);
        });
    }, 60);
    return () => window.clearTimeout(handle);
  }, [env, query, t]);

  function go(href: string) {
    navigate(href);
    onClose();
  }

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="palette" role="dialog" aria-label={t("search")}>
        <input
          autoFocus
          placeholder={t("search")}
          aria-label={t("search")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIndex((current) => Math.min(hits.length - 1, current + 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setIndex((current) => Math.max(0, current - 1));
            } else if (event.key === "Enter" && hits[index]) {
              event.preventDefault();
              go(hits[index].href);
            } else if (event.key === "Escape") {
              onClose();
            }
          }}
        />
        <div className="hits">
          {hits.length ? (
            hits.map((hit, hitIndex) => (
              <button
                type="button"
                key={hit.href + hit.title}
                className="hit"
                aria-selected={hitIndex === index}
                onMouseEnter={() => setIndex(hitIndex)}
                onClick={() => go(hit.href)}
              >
                <span>{hit.title}</span>
                <small>{hit.subtitle}</small>
              </button>
            ))
          ) : (
            <p className="note" style={{ padding: "8px 14px" }}>
              No matching record.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function Help({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="help" role="dialog" aria-label={t("helpTitle")}>
        <h2>{t("helpTitle")}</h2>
        <ul>
          <li>
            <kbd>⌘K</kbd> {t("helpSearch")}
          </li>
          <li>
            <kbd>G</kbd> {t("helpGo")}
          </li>
          <li>
            <kbd>J</kbd> / <kbd>K</kbd> {t("helpList")}
          </li>
          <li>
            <kbd>?</kbd> {t("helpThis")}
          </li>
        </ul>
        <button type="button" className="btn" onClick={onClose}>
          {t("close")}
        </button>
      </div>
    </>
  );
}
