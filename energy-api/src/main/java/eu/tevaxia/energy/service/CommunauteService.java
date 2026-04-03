package eu.tevaxia.energy.service;

import eu.tevaxia.energy.model.dto.CommunauteRequest;
import eu.tevaxia.energy.model.dto.CommunauteResponse;
import eu.tevaxia.energy.model.dto.CommunauteResponse.Parametres;
import eu.tevaxia.energy.model.dto.CommunauteResponse.Conformite;
import eu.tevaxia.energy.model.dto.CommunauteResponse.ProductionMensuelle;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service de simulation d'une communauté d'énergie renouvelable.
 * <p>
 * Conforme SPEC-FONCTIONNELLE §5.5–5.7 et cadre réglementaire :
 * - Loi du 21 mai 2021 (transposition RED II)
 * - Règlement ILR E23/14
 */
@Service
public class CommunauteService {

    /** Production annuelle en kWh par kWc installé (Luxembourg, sud, 35°). Conforme §5.5. */
    private static final int PRODUCTION_PAR_KWC = 950;

    /** Taux d'autoconsommation de base (1 participant). */
    private static final double TAUX_AUTOCONSO_BASE = 0.40;

    /** Amélioration du taux d'autoconsommation par participant supplémentaire. */
    private static final double FACTEUR_FOISONNEMENT = 0.025;

    /** Tarif de rachat du surplus injecté au réseau (€/kWh). */
    private static final double TARIF_RACHAT_SURPLUS = 0.07;

    /** Facteur d'émission CO₂ du mix électrique luxembourgeois (g/kWh). */
    private static final int CO2_FACTEUR = 300;

    /** Plafond réaliste du taux d'autoconsommation. */
    private static final double TAUX_AUTOCONSO_MAX = 0.85;

    /** Coût moyen d'une installation PV au Luxembourg (€/kWc HTVA). */
    private static final double COUT_PV_PAR_KWC = 1_200;

    /** TVA sur installation PV résidentielle (17%). */
    private static final double TVA_PV = 0.17;

    /** Répartition mensuelle de la production PV au Luxembourg (% de la production annuelle). */
    private static final double[] REPARTITION_MENSUELLE = {
            0.04, 0.06, 0.09, 0.11, 0.12, 0.12,
            0.12, 0.11, 0.09, 0.07, 0.04, 0.03
    };

    private static final String[] MOIS = {
            "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
            "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    };

    public CommunauteResponse calculer(CommunauteRequest request) {
        int nbParticipants = request.nbParticipants();
        double puissancePV = request.puissancePV();
        double consoMoyenne = request.consoMoyenneParParticipant();
        double tarifReseau = request.tarifReseau();
        double tarifPartage = request.tarifPartage();

        long productionAnnuelle = Math.round(puissancePV * PRODUCTION_PAR_KWC);
        long consoTotale = Math.round(nbParticipants * consoMoyenne);

        // Taux d'autoconsommation avec effet de foisonnement
        double tauxAutoConso = Math.min(
                TAUX_AUTOCONSO_MAX,
                TAUX_AUTOCONSO_BASE + (nbParticipants - 1) * FACTEUR_FOISONNEMENT
        );

        long energieDisponible = Math.min(productionAnnuelle, consoTotale);
        long energieAutoconsommee = Math.round(energieDisponible * tauxAutoConso);
        long surplus = productionAnnuelle - energieAutoconsommee;

        // Économie = autoconsommation × delta tarif + surplus × tarif rachat
        double economieSurAutoConso = energieAutoconsommee * (tarifReseau - tarifPartage);
        double revenuSurplus = surplus * TARIF_RACHAT_SURPLUS;
        long economieTotale = Math.round(economieSurAutoConso + revenuSurplus);
        long economieParParticipant = Math.round((double) economieTotale / nbParticipants);

        // CO₂ évité
        long co2EviteKg = Math.round(energieAutoconsommee * CO2_FACTEUR / 1000.0);

        double tauxCouverture = consoTotale > 0
                ? Math.round(productionAnnuelle * 1000.0 / consoTotale) / 10.0
                : 0.0;
        double tauxAutoConsoPct = Math.round(tauxAutoConso * 1000.0) / 10.0;

        // Coût installation
        long coutHTVA = Math.round(puissancePV * COUT_PV_PAR_KWC);
        long tva = Math.round(coutHTVA * TVA_PV);
        long coutTTC = coutHTVA + tva;
        long coutParParticipant = Math.round((double) coutTTC / nbParticipants);

        // Payback global
        double paybackGlobal = economieTotale > 0 ? (double) coutTTC / economieTotale : 99.0;

        // Production mensuelle
        List<ProductionMensuelle> productionMensuelleList = new java.util.ArrayList<>();
        for (int i = 0; i < 12; i++) {
            long kwh = Math.round(productionAnnuelle * REPARTITION_MENSUELLE[i]);
            productionMensuelleList.add(new ProductionMensuelle(MOIS[i], kwh));
        }

        var parametres = new Parametres(
                PRODUCTION_PAR_KWC,
                TAUX_AUTOCONSO_BASE,
                FACTEUR_FOISONNEMENT,
                TARIF_RACHAT_SURPLUS,
                CO2_FACTEUR
        );

        var conformite = new Conformite(
                "Copropriété, ASBL ou coopérative",
                "Même poste de transformation ou < 1 km",
                "Contrat de répartition entre participants requis",
                "Déclaration auprès de l'ILR obligatoire",
                "Loi du 21 mai 2021 (transposition RED II)",
                "Règlement ILR E23/14"
        );

        return new CommunauteResponse(
                productionAnnuelle, consoTotale,
                tauxCouverture, tauxAutoConsoPct,
                energieAutoconsommee, surplus,
                economieTotale, economieParParticipant,
                Math.round(revenuSurplus),
                co2EviteKg,
                coutHTVA, tva, coutTTC, coutParParticipant,
                Math.round(paybackGlobal * 10.0) / 10.0,
                productionMensuelleList,
                parametres,
                conformite
        );
    }
}
