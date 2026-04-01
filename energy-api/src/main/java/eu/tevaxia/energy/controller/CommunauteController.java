package eu.tevaxia.energy.controller;

import eu.tevaxia.energy.model.dto.CommunauteRequest;
import eu.tevaxia.energy.model.dto.CommunauteResponse;
import eu.tevaxia.energy.service.CommunauteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/communaute")
@Tag(name = "Communauté d'énergie", description = "Simulation d'une communauté d'énergie renouvelable")
public class CommunauteController {

    private final CommunauteService communauteService;

    public CommunauteController(CommunauteService communauteService) {
        this.communauteService = communauteService;
    }

    @PostMapping
    @Operation(
            summary = "Simuler une communauté d'énergie",
            description = """
                    Simule la production PV partagée, les économies collectives, le surplus revendu \
                    au réseau et le CO₂ évité pour une communauté d'énergie renouvelable. \
                    Modélise l'effet de foisonnement entre participants."""
    )
    public ResponseEntity<CommunauteResponse> calculer(@Valid @RequestBody CommunauteRequest request) {
        return ResponseEntity.ok(communauteService.calculer(request));
    }
}
