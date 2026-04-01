package eu.tevaxia.energy.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Paramètres pour le simulateur de communauté d'énergie renouvelable")
public record CommunauteRequest(

        @NotNull
        @Min(2)
        @Schema(description = "Nombre de participants à la communauté", example = "6")
        Integer nbParticipants,

        @NotNull
        @Min(1)
        @Schema(description = "Puissance PV totale installée en kWc", example = "30")
        Double puissancePV,

        @NotNull
        @Min(500)
        @Schema(description = "Consommation électrique moyenne par participant en kWh/an", example = "4500")
        Double consoMoyenneParParticipant,

        @NotNull
        @Schema(description = "Tarif réseau électrique en €/kWh", example = "0.28")
        Double tarifReseau,

        @NotNull
        @Schema(description = "Tarif de partage au sein de la communauté en €/kWh", example = "0.15")
        Double tarifPartage
) {}
