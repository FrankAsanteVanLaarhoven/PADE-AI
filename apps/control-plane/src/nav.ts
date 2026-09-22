import type { MessageKey } from "./i18n/en";

export const NAV: { group: MessageKey; items: { href: string; label: MessageKey; key: string }[] }[] = [
  {
    group: "gOperate",
    items: [
      { href: "/", label: "navOverview", key: "o" },
      { href: "/deployments", label: "navDeployments", key: "p" },
    ],
  },
  {
    group: "gEvidence",
    items: [
      { href: "/registry", label: "navRegistry", key: "r" },
      { href: "/demonstrations", label: "navDemonstrations", key: "h" },
      { href: "/embodiments", label: "navEmbodiments", key: "e" },
      { href: "/evidence", label: "navEvidence", key: "u" },
    ],
  },
  {
    group: "gLearn",
    items: [
      { href: "/datasets", label: "navDatasets", key: "d" },
      { href: "/experiments", label: "navExperiments", key: "x" },
      { href: "/simulation", label: "navSimulation", key: "s" },
    ],
  },
  {
    group: "gAssure",
    items: [
      { href: "/fleetsafe", label: "navFleet", key: "f" },
      { href: "/verdictplane", label: "navVerdict", key: "v" },
      { href: "/sentinel", label: "navSentinel", key: "n" },
    ],
  },
  {
    group: "gLoop",
    items: [
      { href: "/failures", label: "navFailures", key: "a" },
      { href: "/acquisition", label: "navAcquisition", key: "q" },
    ],
  },
  {
    group: "gSystem",
    items: [{ href: "/standards", label: "navStandards", key: "t" }],
  },
];

export const CHORDS = Object.fromEntries(NAV.flatMap((group) => group.items.map((item) => [item.key, item.href])));
