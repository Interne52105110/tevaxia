package eu.tevaxia.energy.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@Schema(description = "Paramètres pour le simulateur de ROI rénovation énergétique")
public record RenovationRequest(

        @NotNull
        @Pattern(regexp = "^[A-I]$", message = "Classe énergie invalide (A à I)")
        @Schema(description = "Classe énergie actuelle", example = "F")
        String classeActuelle,

        @NotNull
        @Pattern(regexp = "^[A-I]$", message = "Classe énergie invalide (A à I)")
        @Schema(description = "Classe énergie cible (doit être meilleure que l'actuelle)", example = "B")
        String classeCible,

        @NotNull
        @Min(10)
        @Schema(description = "Surface habitable en m²", example = "120")
        Double surface,

        @Schema(description = "Année de construction du bâtiment", example = "1975")
        Integer anneeConstruction,

        @NotNull
        @Min(10_000)
        @Schema(description = "Valeur actuelle du bien en euros", example = "650000")
        Double valeurBien
) {
    public RenovationRequest {
        if (anneeConstruction == null) {
            anneeConstruction = 1980;
        }
    }
}
