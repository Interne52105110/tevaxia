package eu.tevaxia.energy.controller;

import eu.tevaxia.energy.model.dto.RenovationRequest;
import eu.tevaxia.energy.model.dto.RenovationResponse;
import eu.tevaxia.energy.service.RenovationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/renovation")
@Tag(name = "ROI Rénovation", description = "Retour sur investissement d'une rénovation énergétique")
public class RenovationController {

    private final RenovationService renovationService;

    public RenovationController(RenovationService renovationService) {
        this.renovationService = renovationService;
    }

    @GetMapping
    @Operation(summary = "Usage du endpoint rénovation", hidden = true)
    public ResponseEntity<Map<String, Object>> usage() {
        return ResponseEntity.ok(Map.of(
                "endpoint", "POST /api/v1/renovation",
                "description", "Simulation ROI rénovation énergétique avec Klimabonus, VAN, TRI",
                "exemple", Map.of("classeActuelle", "F", "classeCible", "B", "surface", 120, "anneeConstruction", 1975, "valeurBien", 650000),
                "documentation", "/swagger-ui.html"
        ));
    }

    @PostMapping
    @Operation(
            summary = "Simuler le ROI d'une rénovation énergétique",
            description = """
                    Estime les coûts poste par poste, le gain de valeur et le retour sur investissement \
                    d'un saut de classe énergie. Prend en compte la surface, l'ancienneté du bâtiment \
                    et la valeur actuelle du bien."""
    )
    public ResponseEntity<RenovationResponse> calculer(@Valid @RequestBody RenovationRequest request) {
        return ResponseEntity.ok(renovationService.calculer(request));
    }
}
