import type { Metadata } from "next";
import { VT323, DotGothic16, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const vt323 = VT323({ weight: '400', subsets: ['latin'], display: 'block', variable: '--font-vt' });
const dotGothic = DotGothic16({ weight: '400', subsets: ['latin'], display: 'block', variable: '--font-dot' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], display: 'block', variable: '--font-jb' });

export const metadata: Metadata = {
  title: "Synapse Society — Join Us",
  description: "A community driven by peer-to-peer learning, knowledge sharing, and building the future.",
};

import CustomCursor from "@/components/CustomCursor";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${vt323.variable} ${dotGothic.variable} ${jetbrains.variable}`}>
      <body suppressHydrationWarning className={`${vt323.variable} ${dotGothic.variable} ${jetbrains.variable}`}>
        <CustomCursor />
        <div className="terminal-decoration">
          SYSTEM_INIT: OK<br />
          MEM_ALLOC: 4096KB<br />
          PROTOCOL: SECURE<br />
          AWAITING_INPUT...
        </div>
        <div className="terminal-decoration-right">
          LATENCY: 12ms<br />
          ROOT_ACCESS: DENIED<br />
          USER_ID: ANONYMOUS
        </div>
        <div className="scanlines"></div>
        <div className="vignette"></div>
        {children}
      </body>
    </html>
  );
}
