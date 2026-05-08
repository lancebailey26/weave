import type { Metadata } from "next";
import LegalPage from "../legal-page";

export const metadata: Metadata = {
  title: "Subprocessors | Weave",
  description: "Weave subprocessors and service providers",
};

export default function SubprocessorsRoute() {
  return <LegalPage title="Subprocessors" fileName="SUBPROCESSORS.md" />;
}
