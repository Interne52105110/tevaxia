package eu.tevaxia.energy.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@Schema(description = "Paramètres pour le simulateur d'impact de la classe énergie sur la valeur")
public record ImpactRequest(

        @NotNull
        @Min(10_000)
        @Schema(description = "Valeur estimée du bien en euros", example = "750000")
        Double valeurBien,

        @NotNull
        @Pattern(regexp = "^[A-G]$", message = "Classe énergie invalide (A à G)")
        @Schema(description = "Classe énergie actuelle du bien (A à G)", example = "D")
        String classeActuelle
) {}
