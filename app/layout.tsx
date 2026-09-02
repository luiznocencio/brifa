import type { Metadata } from "next";
import "./globals.css";
import "./disrupy/styles.css";

export const metadata: Metadata = {
  title: "BRIFA",
  description: "Inteligência de briefing para agências. Transforma a demanda em briefing claro e acionável — antes de criar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
