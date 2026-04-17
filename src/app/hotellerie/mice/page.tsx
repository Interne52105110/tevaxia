"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { formatEUR, formatPct } from "@/lib/calculations";

interface MiceInputs {
  nbRooms: number;
  nbMeetingRooms: number;
  avgRfqPerMonth: number; // nb de demandes entrantes
  conversionRate: number; // 0-1
  avgGroupSize: number; // pax / group
  avgGroupNights: number;
  adrGroup: number; // ADR spécifique groupe (négocié)
  fbCaptureRate: number; // 0-1 — % groupes qui prennent F&B
  avgFbPerPax: number; // €/pax/jour
  meetingRoomHireFee: number; // €/jour
  meetingRoomDaysPerGroup: number;
  seasonalityFactor: number; // 0.7-1.3 selon saison
}

function computeMice(i: MiceInputs) {
  const groupsPerYear = Math.round(i.avgRfqPerMonth * 12 * i.conversionRate);
  const roomNightsPerYear = groupsPerYear * i.avgGroupSize * i.avgGroupNights / 2; // 2 pax per room average
  const roomRevenuePerYear = Math.round(roomNightsPerYear * i.adrGroup * i.seasonalityFactor);

  const totalPax = groupsPerYear * i.avgGroupSize;
  const fbRevenuePerYear = Math.round(
    totalPax * i.fbCaptureRate * i.avgFbPerPax * i.avgGroupNights,
  );

  const meetingRoomRevenue = Math.round(
    groupsPerYear * i.meetingRoomHireFee * i.meetingRoomDaysPerGroup,
  );

  const totalRevenue = roomRevenuePerYear + fbRevenuePerYear + meetingRoomRevenue;

  // Marge brute (GOP) estimée : 45% rooms, 25% F&B, 75% meeting rooms
  const gopRooms = Math.round(roomRevenuePerYear * 0.45);
  const gopFb = Math.round(fbRevenuePerYear * 0.25);
  const gopMeeting = Math.round(meetingRoomRevenue * 0.75);
  const totalGop = gopRooms + gopFb + gopMeeting;

  const revPerGroup = groupsPerYear > 0 ? totalRevenue / groupsPerYear : 0;
  const avgGroupSpend = groupsPerYear > 0 ? totalRevenue / groupsPerYear : 0;

  // Capacité théorique (room nights MICE / room nights total dispo)
  const roomNightsCapacity = i.nbRooms * 365;
  const miceShareOfRoomNights = roomNightsCapacity > 0 ? roomNightsPerYear / roomNightsCapacity : 0;

  return {
    groupsPerYear, roomNightsPerYear, roomRevenuePerYear,
    totalPax, fbRevenuePerYear, meetingRoomRevenue, totalRevenue,
    gopRooms, gopFb, gopMeeting, totalGop, gopMargin: totalRevenue > 0 ? totalGop / totalRevenue : 0,
    revPerGroup, avgGroupSpend, miceShareOfRoomNights,
  };
}

export default function MicePage() {
  const [nbRooms, setNbRooms] = useState(80);
  const [nbMeetingRooms, setNbMeetingRooms] = useState(3);
  const [avgRfqPerMonth, setAvgRfqPerMonth] = useState(25);
  const [conversionRate, setConversionRate] = useState(0.25);
  const [avgGroupSize, setAvgGroupSize] = useState(20);
  const [avgGroupNights, setAvgGroupNights] = useState(2);
  const [adrGroup, setAdrGroup] = useState(135);
  const [fbCaptureRate, setFbCaptureRate] = useState(0.70);
  const [avgFbPerPax, setAvgFbPerPax] = useState(55);
  const [meetingRoomHireFee, setMeetingRoomHireFee] = useState(350);
  const [meetingRoomDaysPerGroup, setMeetingRoomDaysPerGroup] = useState(1.5);
  const [seasonalityFactor, setSeasonalityFactor] = useState(1.0);

  const result = useMemo(() => computeMice({
    nbRooms, nbMeetingRooms, avgRfqPerMonth, conversionRate, avgGroupSize,
    avgGroupNights, adrGroup, fbCaptureRate, avgFbPerPax,
    meetingRoomHireFee, meetingRoomDaysPerGroup, seasonalityFactor,
  }), [nbRooms, nbMeetingRooms, avgRfqPerMonth, conversionRate, avgGroupSize, avgGroupNights, adrGroup, fbCaptureRate, avgFbPerPax, meetingRoomHireFee, meetingRoomDaysPerGroup, seasonalityFactor]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">&larr; Hôtellerie</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Segmentation MICE (groupes corporate)</h1>
          <p className="mt-2 text-muted">
            Modèle de revenu groupes/séminaires pour hôtel avec salles de réunion. Intègre chambres + F&B + location salle.
            Taux de conversion RFP (Request For Proposal), panier moyen, saisonnalité.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Hôtel & infra</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Nombre de chambres" value={nbRooms} onChange={(v) => setNbRooms(Number(v))} />
                <InputField label="Salles de réunion" value={nbMeetingRooms} onChange={(v) => setNbMeetingRooms(Number(v))} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Pipeline commercial</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="RFP reçues / mois" value={avgRfqPerMonth} onChange={(v) => setAvgRfqPerMonth(Number(v))} hint="Demandes entrantes groupes" />
                <InputField label="Taux de conversion" value={Math.round(conversionRate * 100)} onChange={(v) => setConversionRate(Number(v) / 100)} suffix="%" hint="LU typique 20-30%" />
                <InputField label="Taille moyenne groupe" value={avgGroupSize} onChange={(v) => setAvgGroupSize(Number(v))} suffix="pax" />
                <InputField label="Nuits moyennes / groupe" value={avgGroupNights} onChange={(v) => setAvgGroupNights(Number(v))} />
                <InputField label="Saisonnalité" value={seasonalityFactor} onChange={(v) => setSeasonalityFactor(Number(v))} hint="1.0 = normale, 1.2 = sept-juin, 0.7 = juillet-août" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Tarification groupe</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="ADR groupe (négocié)" value={adrGroup} onChange={(v) => setAdrGroup(Number(v))} suffix="€/nuit" hint="-15 à -25% vs transient" />
                <InputField label="F&B capture rate" value={Math.round(fbCaptureRate * 100)} onChange={(v) => setFbCaptureRate(Number(v) / 100)} suffix="%" hint="% groupes consommant F&B sur place" />
                <InputField label="F&B moyen / pax / jour" value={avgFbPerPax} onChange={(v) => setAvgFbPerPax(Number(v))} suffix="€" hint="Déjeuner + coffee breaks ~55€" />
                <InputField label="Hire salle / jour" value={meetingRoomHireFee} onChange={(v) => setMeetingRoomHireFee(Number(v))} suffix="€" />
                <InputField label="Jours salle / groupe" value={meetingRoomDaysPerGroup} onChange={(v) => setMeetingRoomDaysPerGroup(Number(v))} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-700 p-8 text-white shadow-lg">
              <div className="text-xs uppercase tracking-wider text-white/70">Revenu MICE annuel total</div>
              <div className="mt-2 text-4xl font-bold">{formatEUR(result.totalRevenue)}</div>
              <div className="mt-1 text-sm text-white/70">
                {result.groupsPerYear} groupes · {result.totalPax} pax · GOP {formatEUR(result.totalGop)} ({formatPct(result.gopMargin)})
              </div>
            </div>

            <ResultPanel
              title="Décomposition revenu"
              lines={[
                { label: "Chambres (groupe ADR négocié)", value: formatEUR(result.roomRevenuePerYear), highlight: true },
                { label: "F&B (petits-déj + déj + dîners + coffee breaks)", value: formatEUR(result.fbRevenuePerYear), highlight: true },
                { label: "Location salle(s) de réunion", value: formatEUR(result.meetingRoomRevenue), highlight: true },
                { label: "Total", value: formatEUR(result.totalRevenue), highlight: true, large: true },
              ]}
            />

            <ResultPanel
              title="GOP par centre de profit"
              lines={[
                { label: "GOP Rooms (45%)", value: formatEUR(result.gopRooms) },
                { label: "GOP F&B (25%)", value: formatEUR(result.gopFb) },
                { label: "GOP Meeting Rooms (75%)", value: formatEUR(result.gopMeeting) },
                { label: "GOP total", value: `${formatEUR(result.totalGop)} (${formatPct(result.gopMargin)})`, highlight: true },
              ]}
            />

            <ResultPanel
              title="Métriques opérationnelles"
              lines={[
                { label: "Groupes/an", value: String(result.groupsPerYear) },
                { label: "Room nights groupes/an", value: result.roomNightsPerYear.toLocaleString("fr-LU") },
                { label: "% room nights MICE / capacité", value: formatPct(result.miceShareOfRoomNights) },
                { label: "Pax total/an", value: result.totalPax.toLocaleString("fr-LU") },
                { label: "Revenu moyen/groupe", value: formatEUR(Math.round(result.revPerGroup)) },
              ]}
            />

            {/* Saisonnalité MICE sur 12 mois */}
            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <h3 className="text-base font-semibold text-navy">Saisonnalité MICE LU</h3>
              <p className="mt-0.5 text-xs text-muted mb-3">
                Répartition typique des groupes corporate au Luxembourg : pics sept-nov + mars-mai, creux été + fêtes.
              </p>
              {(() => {
                // Courbe saisonnalité MICE typique LU : indice 100 = moyenne annuelle
                const MICE_SEASONALITY = [
                  { month: "Jan", idx: 80, label: "Bas — rentrée + budgets non validés" },
                  { month: "Fév", idx: 95, label: "Reprise" },
                  { month: "Mar", idx: 115, label: "Pic Q1 — kick-offs annuels" },
                  { month: "Avr", idx: 120, label: "Pic — salons, conférences" },
                  { month: "Mai", idx: 125, label: "Pic max — offsites printemps" },
                  { month: "Juin", idx: 110, label: "Fin printemps" },
                  { month: "Juil", idx: 55, label: "Creux été — vacances" },
                  { month: "Aoû", idx: 40, label: "Creux max — fermetures corporate" },
                  { month: "Sep", idx: 115, label: "Rentrée pro — pic" },
                  { month: "Oct", idx: 130, label: "Pic max — conférences annuelles" },
                  { month: "Nov", idx: 115, label: "Fin d'année fiscale" },
                  { month: "Déc", idx: 65, label: "Creux fêtes — seulement dîners fin d'année" },
                ];
                // Appliquer au revenu annuel
                const revenueByMonth = MICE_SEASONALITY.map((m) => ({
                  ...m,
                  revenue: Math.round(result.totalRevenue / 12 * (m.idx / 100)),
                }));
                return (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={revenueByMonth} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e2db" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                      <RechartsTooltip
                        formatter={(v: unknown, name: unknown) => typeof v === "number" && name === "revenue" ? formatEUR(v) : "—"}
                        contentStyle={{ fontSize: 11, borderRadius: 8 }}
                        labelFormatter={(label: unknown, payload: unknown) => {
                          const arr = payload as Array<{ payload?: { label?: string } }> | undefined;
                          return `${label} · ${arr?.[0]?.payload?.label ?? ""}`;
                        }}
                      />
                      <ReferenceLine y={result.totalRevenue / 12} stroke="#b8860b" strokeDasharray="4 4" strokeWidth={1.5} />
                      <Bar dataKey="revenue" fill="#7c3aed" name="Revenu" />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
              <p className="mt-2 text-[10px] text-muted">
                Source : patterns observés Luxembourg City (HOTREC Luxembourg, Hotrec EU MICE trends 2024-2025).
                Ligne dorée = moyenne annuelle. Le creux de juillet-août peut être comblé par leisure group
                (mariages, famille) ou MICE international (incentive travel).
              </p>
            </div>

            <AiAnalysisCard
              context={[
                `Modèle MICE — hôtel ${nbRooms} ch · ${nbMeetingRooms} salles`,
                `${avgRfqPerMonth} RFP/mois × ${(conversionRate * 100).toFixed(0)}% conversion = ${result.groupsPerYear} groupes/an`,
                `Groupe moyen: ${avgGroupSize} pax × ${avgGroupNights} nuits, ADR ${adrGroup}€`,
                `F&B capture ${(fbCaptureRate * 100).toFixed(0)}% × ${avgFbPerPax}€/pax/j`,
                `Saisonnalité: ${seasonalityFactor.toFixed(2)}×`,
                "",
                `Revenu total: ${formatEUR(result.totalRevenue)} (Rooms ${formatEUR(result.roomRevenuePerYear)}, F&B ${formatEUR(result.fbRevenuePerYear)}, Meeting ${formatEUR(result.meetingRoomRevenue)})`,
                `GOP: ${formatEUR(result.totalGop)} (${formatPct(result.gopMargin)})`,
                `MICE share room nights: ${formatPct(result.miceShareOfRoomNights)}`,
              ].join("\n")}
              prompt="Analyse ce modèle MICE hôtelier au Luxembourg. Livre : (1) réalisme taux conversion RFP vs benchmark LU (20-30% standard, 35%+ si compétitif, <15% si mal positionné), (2) optimisations revenu : améliorer F&B capture rate (plans forfaits demi-pension 70%→85%), upseller banqueting, packages équipement AV inclus, (3) positionnement compétitif vs hôtels Kirchberg/aéroport (corporate européen 10-40 pax), Luxembourg-Ville (smaller executive), Mondorf (events wellness), (4) saisonnalité à exploiter : sept-nov + mai-juin pics corporate, combler juillet-août via leisure group/mariage/famille, (5) calcul marge nette vs transient : les groupes à -20% ADR mais F&B capture 70% vs 30% transient peuvent être plus profitables sur le total revenue per guest. Référence HOTREC Luxembourg + HVS MICE reports."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
