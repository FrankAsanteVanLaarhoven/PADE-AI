import { useEnv } from "./shell";
import { useI18n } from "./i18n/context";
import { SourceLine, useTitle } from "./ui";

export function StandardsPage() {
  const { t } = useI18n();
  const { meta } = useEnv();
  useTitle(t("navStandards"));
  const source = meta?.source ?? "adapter:environment";
  const origin = source.startsWith("fixture:") ? "fixture" : source.startsWith("adapter:") ? "unavailable" : "fixture";
  const rows = meta
    ? [
        [meta.policyVersion, meta.mdvVersion],
        [meta.release ?? "—", meta.mode],
        [source, meta.environment],
      ]
    : [];
  return (
    <div className="page">
      <h1>{t("navStandards")}</h1>
      <SourceLine origin={origin} source={source} />
      <div className="table-wrap boxed">
        <table className="data">
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("-")}>
                <td className="mono">{row[0]}</td>
                <td className="mono">{row[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
