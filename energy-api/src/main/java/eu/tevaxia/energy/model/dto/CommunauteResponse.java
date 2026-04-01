package eu.tevaxia.energy.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Résultat du simulateur de communauté d'énergie")
public record CommunauteResponse(

        @Schema(description = "Production PV annuelle estimée en kWh")
        long productionAnnuelle,

        @Schema(description = "Consommation totale de la communauté en kWh/an")
        long consoTotale,

        @Schema(description = "Taux de couverture production / consommation en %")
        double tauxCouverturePct,

        @Schema(description = "Taux d'autoconsommation en %")
        double tauxAutoConsoPct,

        @Schema(description = "Énergie autoconsommée en kWh/an")
        long energieAutoconsommee,

        @Schema(description = "Surplus injecté au réseau en kWh/an")
        long surplus,

        @Schema(description = "Économie annuelle totale de la communauté en euros")
        long economieTotale,

        @Schema(description = "Économie annuelle par participant en euros")
        long economieParParticipant,

        @Schema(description = "Revenu annuel de la vente du surplus au réseau en euros")
        long revenuSurplus,

        @Schema(description = "CO₂ évité en kg/an")
        long co2EviteKg,

        @Schema(description = "Paramètres du modèle utilisés pour la simulation")
        Parametres parametres
) {
    @Schema(description = "Paramètres de référence du modèle de simulation")
    public record Parametres(
            @Schema(description = "Production annuelle par kWc au Luxembourg", example = "920")
            int productionParKwc,

            @Schema(description = "Taux d'autoconsommation de base", example = "0.40")
            double tauxAutoConsoBase,

            @Schema(description = "Bonus par participant additionnel (foisonnement)", example = "0.025")
            double facteurFoisonnement,

            @Schema(description = "Tarif de rachat du surplus par le réseau en €/kWh", example = "0.07")
            double tarifRachatSurplus,

            @Schema(description = "Facteur d'émission CO₂ du mix électrique luxembourgeois en g/kWh", example = "300")
            int co2Facteur
    ) {}
}
