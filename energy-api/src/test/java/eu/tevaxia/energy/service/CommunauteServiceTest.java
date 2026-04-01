package eu.tevaxia.energy.service;

import eu.tevaxia.energy.model.dto.CommunauteRequest;
import eu.tevaxia.energy.model.dto.CommunauteResponse;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CommunauteServiceTest {

    private final CommunauteService service = new CommunauteService();

    @Test
    void productionProportionnelleALaPuissance() {
        var request = new CommunauteRequest(6, 30.0, 4500.0, 0.28, 0.15);
        CommunauteResponse response = service.calculer(request);

        // 30 kWc × 920 kWh/kWc = 27 600 kWh
        assertEquals(27_600, response.productionAnnuelle());
    }

    @Test
    void consommationTotaleCorrecte() {
        var request = new CommunauteRequest(4, 20.0, 5000.0, 0.28, 0.15);
        CommunauteResponse response = service.calculer(request);

        assertEquals(20_000, response.consoTotale());
    }

    @Test
    void plusDeParticipantsAugmenteAutoconsommation() {
        var petit = new CommunauteRequest(2, 30.0, 4500.0, 0.28, 0.15);
        var grand = new CommunauteRequest(10, 30.0, 4500.0, 0.28, 0.15);

        CommunauteResponse rPetit = service.calculer(petit);
        CommunauteResponse rGrand = service.calculer(grand);

        assertTrue(rGrand.tauxAutoConsoPct() > rPetit.tauxAutoConsoPct(),
                "Plus de participants = meilleur foisonnement = autoconsommation plus élevée");
    }

    @Test
    void economiesPositives() {
        var request = new CommunauteRequest(6, 30.0, 4500.0, 0.28, 0.15);
        CommunauteResponse response = service.calculer(request);

        assertTrue(response.economieTotale() > 0);
        assertTrue(response.economieParParticipant() > 0);
    }

    @Test
    void co2EvitePositif() {
        var request = new CommunauteRequest(6, 30.0, 4500.0, 0.28, 0.15);
        CommunauteResponse response = service.calculer(request);

        assertTrue(response.co2EviteKg() > 0, "Le CO₂ évité devrait être positif");
    }

    @Test
    void parametresModeleExposes() {
        var request = new CommunauteRequest(3, 10.0, 3000.0, 0.25, 0.12);
        CommunauteResponse response = service.calculer(request);

        assertNotNull(response.parametres());
        assertEquals(920, response.parametres().productionParKwc());
        assertEquals(0.40, response.parametres().tauxAutoConsoBase());
        assertEquals(300, response.parametres().co2Facteur());
    }

    @Test
    void tauxAutoConsoPlafonne() {
        // 50 participants → le taux ne devrait pas dépasser 85%
        var request = new CommunauteRequest(50, 100.0, 4500.0, 0.28, 0.15);
        CommunauteResponse response = service.calculer(request);

        assertTrue(response.tauxAutoConsoPct() <= 85.0,
                "Le taux d'autoconsommation ne devrait pas dépasser 85%");
    }
}
