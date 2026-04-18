import CrmTopNav from "@/components/crm/CrmTopNav";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CrmTopNav />
      {children}
    </>
  );
}
