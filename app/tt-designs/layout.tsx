import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "T&T Designs | Professional Websites for Small Businesses",
  description:
    "Beautiful, simple, and effective websites for small businesses. Choose from Basic or Premium plans starting at $999.",
};

export default function TTDesignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
