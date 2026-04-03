package eu.tevaxia.energy.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Résultat du simulateur d'impact CPE : comparatif de valeur par classe énergie")
public record ImpactResponse(

        @Schema(description = "Valeur de base normalisée (référence classe D)")
        double valeurBase,

        @Schema(description = "Classe énergie actuelle fournie en entrée")
        String classeActuelle,

        @Schema(description = "Détail par classe énergie")
        List<ClasseImpact> classes,

        @Schema(description = "Méthodologie de calcul")
        String methodologie,

        @Schema(description = "Sources des données")
        List<String> sources
) {
    @Schema(description = "Impact d'une classe énergie sur la valeur")
    public record ClasseImpact(
            @Schema(description = "Classe énergie (A à I)", example = "B")
            String classe,

            @Schema(description = "Pourcentage d'ajustement vs classe D", example = "5.0")
            double ajustementPct,

            @Schema(description = "Valeur ajustée en euros", example = "787500")
            long valeurAjustee,

            @Schema(description = "Écart en euros par rapport à la classe actuelle", example = "+37500")
            long delta
    ) {}
}
