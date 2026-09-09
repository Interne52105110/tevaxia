/** Selected published observations; never applied automatically to an individual asset. */
export const PUBLISHED_MARKET_REPORTS={
 bureaux:{title:'Cushman & Wakefield — Office MarketBeat Q2 2026',url:'https://content.cushmanwakefield.com/api/public/content/85790d9d1da645ec8a369dfc2d0885c1?v=0ebfb4e7',period:'2026-04-01 — 2026-06-30',scope:'officeScope',rows:[
 {key:'officeTakeup',value:24700,unit:'m²',page:1},
 {key:'officeInvestment',value:23500000,unit:'€',page:1},
 {key:'stationPrime',value:44,unit:'€/m²/month',page:2},
 {key:'kirchbergPrime',value:43,unit:'€/m²/month',page:2},
 {key:'decentralisedPrime',value:35,unit:'€/m²/month',page:2},
 {key:'longPrimeYield',value:4.6,unit:'%',page:1},
 ]},
 commerces:{title:'Cushman & Wakefield — Retail MarketBeat H1 2026',url:'https://content.cushmanwakefield.com/api/public/content/7bff92eb9e6f411abc223f57882307ca?v=0e941721',period:'2026-01-01 — 2026-06-30',scope:'retailScope',rows:[
 {key:'retailTakeup',value:8968,unit:'m²',page:1},
 {key:'highStreetPrime',value:145,unit:'€/m²/month',page:1},
 {key:'outOfTownPrime',value:25,unit:'€/m²/month',page:2},
 {key:'shoppingPrime',value:87,unit:'€/m²/month',page:2},
 ]},
 terrains:{title:'Observatoire de l’Habitat — Rapport d’analyse 19 (10.10.2025)',url:'https://logement.public.lu/dam-assets/documents/publications/observatoire/rapport-analyse-19.pdf',period:'2022 — 2024',scope:'landScope',rows:[
 {key:'landSales2023',value:326,unit:'count',page:5},
 {key:'landSales2024',value:565,unit:'count',page:5},
 {key:'landChange',value:-14.9,unit:'%',page:5},
 ]},
} as const;
