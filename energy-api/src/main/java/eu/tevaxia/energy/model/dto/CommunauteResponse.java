package eu.tevaxia.energy.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

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

        @Schema(description = "Coût installation HTVA en euros")
        long coutInstallationHTVA,

        @Schema(description = "TVA sur l'installation en euros")
        long coutInstallationTVA,

        @Schema(description = "Coût installation TTC en euros")
        long coutInstallationTTC,

        @Schema(description = "Coût par participant en euros")
        long coutParParticipant,

        @Schema(description = "Temps de retour sur investissement global en années")
        double paybackGlobalAnnees,

        @Schema(description = "Production mensuelle estimée")
        List<ProductionMensuelle> productionMensuelle,

        @Schema(description = "Paramètres du modèle utilisés pour la simulation")
        Parametres parametres,

        @Schema(description = "Checklist de conformité réglementaire")
        Conformite conformite
) {
    @Schema(description = "Production PV estimée pour un mois")
    public record ProductionMensuelle(
            @Schema(description = "Nom du mois", example = "Janvier")
            String mois,

            @Schema(description = "Production estimée en kWh")
            long kwh
    ) {}

    @Schema(description = "Paramètres de référence du modèle de simulation")
    public record Parametres(
            @Schema(description = "Production annuelle par kWc au Luxembourg", example = "950")
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

    @Schema(description = "Checklist de conformité réglementaire luxembourgeoise")
    public record Conformite(
            @Schema(description = "Statut juridique requis")
            String statutJuridique,

            @Schema(description = "Périmètre géographique")
            String perimetre,

            @Schema(description = "Contrat de répartition")
            String contratRepartition,

            @Schema(description = "Déclaration ILR")
            String declarationILR,

            @Schema(description = "Loi de référence")
            String loiReference,

            @Schema(description = "Règlement applicable")
            String reglementILR
    ) {}
}
