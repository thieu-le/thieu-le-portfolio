import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Practice Phrases",
  description: "A calm, autism-friendly app for practicing everyday communication phrases",
};

export default function PhrasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
