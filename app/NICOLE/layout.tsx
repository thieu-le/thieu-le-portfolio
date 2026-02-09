import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn the Alphabet",
  description: "A calm, autism-friendly alphabet and vocabulary learning app",
};

export default function NicoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
