import { useI18n } from "./i18n/context";
import { useTitle } from "./ui";

const SWATCHES = [
  ["Paper", "var(--paper)"],
  ["Canvas", "var(--bg)"],
  ["Rail", "var(--rail)"],
  ["Ink", "var(--ink)"],
  ["Line", "var(--line)"],
  ["Graphite", "var(--graphite)"],
];

export function StandardsPage() {
  const { t } = useI18n();
  useTitle(t("navStandards"));
  return (
    <div className="page standards">
      <h1>{t("navStandards")}</h1>
      <p className="lede">{t("standardsLede")}</p>
      <h2>{t("theme")}</h2>
      <p>{t("standardsType")}</p>
      <div className="swatches">
        {SWATCHES.map(([name, color]) => (
          <div key={name} className="swatch">
            <i style={{ background: color }} />
            <span>{name}</span>
          </div>
        ))}
      </div>
      <h2>{t("language")}</h2>
      <p>{t("standardsOrigin")}</p>
      <h2>{t("navOverview")}</h2>
      <p>{t("standardsObjects")}</p>
      <p>{t("standardsAvoid")}</p>
    </div>
  );
}
