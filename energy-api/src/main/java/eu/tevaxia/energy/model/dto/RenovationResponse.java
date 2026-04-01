package eu.tevaxia.energy.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Résultat du simulateur ROI rénovation énergétique")
public record RenovationResponse(

        @Schema(description = "Saut de classe simulé (ex: F → B)")
        String sautClasse,

        @Schema(description = "Détail des postes de travaux")
        List<PosteTravaux> postes,

        @Schema(description = "Coût total minimum (travaux seuls) en euros")
        long totalMin,

        @Schema(description = "Coût total maximum (travaux seuls) en euros")
        long totalMax,

        @Schema(description = "Coût total moyen (travaux seuls) en euros")
        long totalMoyen,

        @Schema(description = "Honoraires architecte + bureau d'études (~10%)")
        long honoraires,

        @Schema(description = "Coût total du projet (travaux + honoraires)")
        long totalProjet,

        @Schema(description = "Durée estimée du chantier en mois")
        int dureeEstimeeMois,

        @Schema(description = "Gain de valeur estimé en euros suite au saut de classe")
        long gainValeur,

        @Schema(description = "Gain de valeur en pourcentage")
        double gainValeurPct,

        @Schema(description = "Retour sur investissement en pourcentage (gain / coût projet)")
        double roiPct
) {
    @Schema(description = "Détail d'un poste de travaux de rénovation")
    public record PosteTravaux(
            @Schema(description = "Libellé du poste", example = "Isolation façade (ITE)")
            String label,

            @Schema(description = "Coût minimum en euros")
            long coutMin,

            @Schema(description = "Coût maximum en euros")
            long coutMax,

            @Schema(description = "Coût moyen en euros")
            long coutMoyen
    ) {}
}
