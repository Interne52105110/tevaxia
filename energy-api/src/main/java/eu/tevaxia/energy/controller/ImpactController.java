package eu.tevaxia.energy.controller;

import eu.tevaxia.energy.model.dto.ImpactRequest;
import eu.tevaxia.energy.model.dto.ImpactResponse;
import eu.tevaxia.energy.service.ImpactService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/impact")
@Tag(name = "Impact CPE", description = "Impact de la classe énergie sur la valeur immobilière")
public class ImpactController {

    private final ImpactService impactService;

    public ImpactController(ImpactService impactService) {
        this.impactService = impactService;
    }

    @PostMapping
    @Operation(
            summary = "Calculer l'impact CPE sur la valeur",
            description = """
                    Calcule l'impact de chaque classe énergie (A à G) sur la valeur d'un bien \
                    immobilier au Luxembourg. Retourne un tableau comparatif avec la valeur ajustée \
                    et l'écart en euros par rapport à la classe actuelle du bien."""
    )
    public ResponseEntity<ImpactResponse> calculer(@Valid @RequestBody ImpactRequest request) {
        return ResponseEntity.ok(impactService.calculer(request));
    }
}
