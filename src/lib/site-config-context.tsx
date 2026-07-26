"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface SiteConfig {
  contact_email?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  company_name?: string;
  company_slogan?: string;
  about_body?: string;
  about_advantages?: string; // JSON string of advantage items
  [key: string]: any;
}

const FALLBACK: SiteConfig = {
  contact_email: "info@quickeaseliftparts.com",
  contact_phone: "+86 13335386941",
  contact_whatsapp: "+86 13335386941",
  company_name: "XI'AN QUICKEASE LIFT PARTS CO., Ltd",
  company_slogan: "Quick Delivery. Easy Service. Zero Downtime.",
};

const SiteConfigContext = createContext<SiteConfig>(FALLBACK);

export function SiteConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<SiteConfig>(FALLBACK);

  useEffect(() => {
    fetch("/api/admin/site-config")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.config) {
          setConfig({ ...FALLBACK, ...data.config });
        }
      })
      .catch(() => {
        /* 网络错误时用 fallback */
      });
  }, []);

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
