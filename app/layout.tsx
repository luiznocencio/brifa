import type { Metadata } from "next";
import "./globals.css";
import "./disrupy/styles.css";

export const metadata: Metadata = {
  title: "Pauta de Demandas",
  description: "Formulário inteligente de pauta de demandas para atendimento.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
