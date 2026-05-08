import type { Metadata } from "next";
import LegalPage from "../legal-page";

export const metadata: Metadata = {
  title: "Terms of Service | Weave",
  description: "Weave terms of service",
};

export default function TermsRoute() {
  return <LegalPage title="Terms of Service" fileName="TERMS_OF_SERVICE.md" />;
}
