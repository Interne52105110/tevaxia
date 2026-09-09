"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import PropertySidebar from "@/components/pms/PropertySidebar";

export default function PmsPropertyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = use(params);
  const { user, loading } = useAuth();
  const t = useTranslations("pms.common");
  const identity = `${user?.id ?? ""}:${propertyId}`;
  const [property, setProperty] = useState<{ identity: string; name: string } | null>(null);
  const name = property?.identity === identity ? property.name : "PMS";

  useEffect(() => {
    if (!user || !propertyId) return;
    let active = true;
    getProperty(propertyId).then((p) => { if (active && p?.name) setProperty({ identity, name: p.name }); }).catch(() => null);
    return () => { active = false; };
  }, [user, propertyId, identity]);

  if (loading) return <p className="p-6">{t("loading")}</p>;
  if (!user) return <>{children}</>;

  return (
    <div className="mx-auto max-w-[1600px] px-2 sm:px-4 py-4 lg:py-6">
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <PropertySidebar key={identity} propertyId={propertyId} propertyName={name} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
