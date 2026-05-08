import type { Metadata } from "next";
import LegalPage from "../legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | Weave",
  description: "Weave privacy policy",
};

export default function PrivacyPolicyRoute() {
  return <LegalPage title="Privacy Policy" fileName="PRIVACY_POLICY.md" />;
}
