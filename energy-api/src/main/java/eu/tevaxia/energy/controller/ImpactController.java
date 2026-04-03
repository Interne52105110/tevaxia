package eu.tevaxia.energy.controller;

import eu.tevaxia.energy.model.dto.ImpactRequest;
import eu.tevaxia.energy.model.dto.ImpactResponse;
import eu.tevaxia.energy.service.ImpactService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/impact")
@Tag(name = "Impact CPE", description = "Impact de la classe énergie sur la valeur immobilière")
public class ImpactController {

    private final ImpactService impactService;

    public ImpactController(ImpactService impactService) {
        this.impactService = impactService;
    }

    @GetMapping
    @Operation(summary = "Usage du endpoint impact", hidden = true)
    public ResponseEntity<Map<String, Object>> usage() {
        return ResponseEntity.ok(Map.of(
                "endpoint", "POST /api/v1/impact",
                "description", "Calcul de l'impact CPE sur la valeur immobilière",
                "exemple", Map.of("valeurBien", 750000, "classeActuelle", "D"),
                "documentation", "/swagger-ui.html"
        ));
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
