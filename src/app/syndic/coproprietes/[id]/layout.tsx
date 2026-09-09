"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getCoownership } from "@/lib/coownerships";
import CoproSidebar from "@/components/syndic/CoproSidebar";

export default function CoproLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const t = useTranslations("syndicNavigation");
  const identity = `${user?.id ?? ""}:${id}`;
  const [property, setProperty] = useState<{ identity: string; name: string } | null>(null);
  const name = property?.identity === identity ? property.name : t("property");

  useEffect(() => {
    if (!user || !id) return;
    let active = true;
    getCoownership(id).then((c) => { if (active && c?.name) setProperty({ identity, name: c.name }); }).catch(() => null);
    return () => { active = false; };
  }, [user, id, identity]);

  if (loading) return <p className="p-6">{t("loading")}</p>;
  if (!user) return <>{children}</>;

  return (
    <div className="mx-auto max-w-[1600px] px-2 sm:px-4 py-4 lg:py-6">
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <CoproSidebar key={identity} coownershipId={id} coownershipName={name} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
