package eu.tevaxia.energy.service;

import eu.tevaxia.energy.model.dto.CommunauteRequest;
import eu.tevaxia.energy.model.dto.CommunauteResponse;
import eu.tevaxia.energy.model.dto.CommunauteResponse.Parametres;
import org.springframework.stereotype.Service;

/**
 * Service de simulation d'une communauté d'énergie renouvelable.
 * <p>
 * Modèle simplifié basé sur :
 * - Production PV au Luxembourg (~920 kWh/kWc/an, orientation sud, 35°)
 * - Effet de foisonnement augmentant l'autoconsommation par participant
 * - Tarifs réseau et partage communautaire
 * - Facteur d'émission CO₂ du mix électrique luxembourgeois
 */
@Service
public class CommunauteService {

    /** Production annuelle en kWh par kWc installé (Luxembourg, sud, 35°). */
    private static final int PRODUCTION_PAR_KWC = 920;

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

        var parametres = new Parametres(
                PRODUCTION_PAR_KWC,
                TAUX_AUTOCONSO_BASE,
                FACTEUR_FOISONNEMENT,
                TARIF_RACHAT_SURPLUS,
                CO2_FACTEUR
        );

        return new CommunauteResponse(
                productionAnnuelle, consoTotale,
                tauxCouverture, tauxAutoConsoPct,
                energieAutoconsommee, surplus,
                economieTotale, economieParParticipant,
                Math.round(revenuSurplus),
                co2EviteKg,
                parametres
        );
    }
}
