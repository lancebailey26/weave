import type { Metadata } from "next";
import LegalPage from "../legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy | Weave",
  description: "Weave cookie policy",
};

export default function CookiesRoute() {
  return <LegalPage title="Cookie Policy" fileName="COOKIE_POLICY.md" />;
}
