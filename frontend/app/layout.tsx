import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WEBUU — Deep Research Agent",
  description:
    "Multi-agent deep web research powered by CrewAI, Groq Llama 3.3 70B, and DuckDuckGo. Completely free.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
