# energy.tevaxia.lu — Simulateurs Énergie & Immobilier Luxembourg

## Concept

Le certificat de performance énergétique (CPE) influence directement la valeur d'un bien immobilier au Luxembourg. L'écart entre un bien classé A et un bien classé G peut dépasser 15 %. Ce module permet de quantifier cet impact avec 3 simulateurs interactifs.

## Les 3 simulateurs

### 1. Impact CPE → Valeur (`/api/v1/impact`)
Quel est l'impact réel de chaque classe énergétique (A à G) sur la valeur d'un bien ? Tableau comparatif avec ajustement en %, valeur ajustée et delta en euros, basé sur les données du marché luxembourgeois.

### 2. ROI Rénovation énergétique (`/api/v1/renovation`)
Passer de F à B : combien ça coûte, combien ça rapporte ? Détail des postes de travaux (ITE, toiture, fenêtres triple vitrage, PAC, VMC double flux), coûts min/moy/max, honoraires, durée estimée, gain de valeur et retour sur investissement.

### 3. Communauté d'énergie renouvelable (`/api/v1/communaute`)
Simulation d'une installation PV partagée entre copropriétaires ou voisins : production annuelle, taux de couverture, autoconsommation, surplus revendu, économies par participant, CO₂ évité. Aligné avec le cadre réglementaire luxembourgeois (loi du 7 août 2023).

## Architecture

```
Utilisateur → energy.tevaxia.lu (Vercel / Next.js 16)
               │
               ├─ Frontend : App Router, SSR, i18n FR/EN
               │   Routage sous-domaine via proxy.ts
               │   Fallback calcul local si API indisponible
               │
               └─ fetch → tevaxia-energy-api.onrender.com
                    API REST : Java 17 / Spring Boot 3.4
                    3 endpoints POST, validation Jakarta
                    OpenAPI / Swagger UI
                    Docker multi-stage (Alpine)
```

### Backend — `energy-api/`

| Technologie | Version |
|---|---|
| Java | 17 |
| Spring Boot | 3.4.4 |
| Validation | Jakarta Bean Validation |
| Documentation | SpringDoc OpenAPI 2.8 / Swagger UI |
| Tests | JUnit 5 + MockMvc (34 tests) |
| Erreurs | ProblemDetail RFC 7807 |
| Conteneurisation | Docker multi-stage (Alpine) |

**Endpoints :**

| Méthode | URL | Description |
|---|---|---|
| POST | `/api/v1/impact` | Impact classe énergétique sur valeur |
| POST | `/api/v1/renovation` | ROI rénovation énergétique |
| POST | `/api/v1/communaute` | Simulation communauté d'énergie |
| GET | `/swagger-ui.html` | Documentation interactive |
| GET | `/api-docs` | Spécification OpenAPI JSON |

### Frontend — `src/app/energy/`

| Technologie | Version |
|---|---|
| Next.js | 16.2 (App Router) |
| React | 19 |
| i18n | next-intl (FR + EN) |
| Styling | Tailwind CSS |
| Hébergement | Vercel |

**Résilience :** chaque simulateur intègre un fallback de calcul local. Si l'API Spring Boot est indisponible (cold start Render free tier), l'utilisateur obtient toujours un résultat avec un badge "Calcul local".

## Lancer en local

```bash
# Backend
cd energy-api
mvn spring-boot:run
# → http://localhost:8081/swagger-ui.html

# Frontend
cd ..
npm run dev
# → http://energy.localhost:3000
```

## Tests

```bash
cd energy-api
mvn clean test
# 34 tests — contrôleurs + services
```

## Liens

- **Frontend :** https://energy.tevaxia.lu
- **API Swagger UI :** https://tevaxia-energy-api.onrender.com/swagger-ui.html
- **API docs JSON :** https://tevaxia-energy-api.onrender.com/api-docs
