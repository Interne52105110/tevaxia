package eu.tevaxia.energy.controller;

import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@Hidden
public class ApiInfoController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        return ResponseEntity.ok(info());
    }

    @GetMapping("/api/v1")
    public ResponseEntity<Map<String, Object>> apiRoot() {
        return ResponseEntity.ok(info());
    }

    private Map<String, Object> info() {
        return Map.of(
                "api", "energy.tevaxia.lu",
                "version", "1.0.0",
                "description", "API REST pour les simulateurs de performance énergétique immobilière au Luxembourg",
                "documentation", "/swagger-ui.html",
                "endpoints", List.of(
                        Map.of("method", "POST", "path", "/api/v1/impact", "description", "Impact CPE sur la valeur (classes A-I)"),
                        Map.of("method", "POST", "path", "/api/v1/renovation", "description", "ROI rénovation + Klimabonus + VAN/TRI"),
                        Map.of("method", "POST", "path", "/api/v1/communaute", "description", "Communauté d'énergie renouvelable")
                )
        );
    }
}
