import type { Metadata } from "next";
import LegalPage from "../legal-page";

export const metadata: Metadata = {
  title: "Acceptable Use Policy | Weave",
  description: "Weave acceptable use policy",
};

export default function AcceptableUseRoute() {
  return <LegalPage title="Acceptable Use Policy" fileName="ACCEPTABLE_USE_POLICY.md" />;
}
