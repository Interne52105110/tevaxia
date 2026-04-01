package eu.tevaxia.energy.controller;

import eu.tevaxia.energy.model.dto.RenovationRequest;
import eu.tevaxia.energy.model.dto.RenovationResponse;
import eu.tevaxia.energy.service.RenovationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/renovation")
@Tag(name = "ROI Rénovation", description = "Retour sur investissement d'une rénovation énergétique")
public class RenovationController {

    private final RenovationService renovationService;

    public RenovationController(RenovationService renovationService) {
        this.renovationService = renovationService;
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
