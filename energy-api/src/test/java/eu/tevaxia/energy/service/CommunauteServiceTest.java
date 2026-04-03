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

        // 30 kWc × 950 kWh/kWc = 28 500 kWh
        assertEquals(28_500, response.productionAnnuelle());
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
        assertEquals(950, response.parametres().productionParKwc());
        assertEquals(0.40, response.parametres().tauxAutoConsoBase());
        assertEquals(300, response.parametres().co2Facteur());
    }

    @Test
    void tauxAutoConsoPlafonne() {
        var request = new CommunauteRequest(50, 100.0, 4500.0, 0.28, 0.15);
        CommunauteResponse response = service.calculer(request);

        assertTrue(response.tauxAutoConsoPct() <= 85.0,
                "Le taux d'autoconsommation ne devrait pas dépasser 85%");
    }

    // --- Nouveaux tests conformité spec ---

    @Test
    void coutInstallationCalculeCorrectement() {
        var request = new CommunauteRequest(6, 30.0, 4500.0, 0.28, 0.15);
        CommunauteResponse response = service.calculer(request);

        // 30 kWc × 1 200 €/kWc = 36 000 € HTVA
        assertEquals(36_000, response.coutInstallationHTVA());
        assertTrue(response.coutInstallationTVA() > 0);
        assertEquals(response.coutInstallationHTVA() + response.coutInstallationTVA(),
                response.coutInstallationTTC());
    }

    @Test
    void coutParParticipantCalcule() {
        var request = new CommunauteRequest(6, 30.0, 4500.0, 0.28, 0.15);
        CommunauteResponse response = service.calculer(request);

        assertTrue(response.coutParParticipant() > 0);
        assertEquals(response.coutInstallationTTC() / 6, response.coutParParticipant(), 1);
    }

    @Test
    void paybackGlobalPositif() {
        var request = new CommunauteRequest(6, 30.0, 4500.0, 0.28, 0.15);
        CommunauteResponse response = service.calculer(request);

        assertTrue(response.paybackGlobalAnnees() > 0);
    }

    @Test
    void productionMensuellePresente() {
        var request = new CommunauteRequest(6, 30.0, 4500.0, 0.28, 0.15);
        CommunauteResponse response = service.calculer(request);

        assertEquals(12, response.productionMensuelle().size());
        long somme = response.productionMensuelle().stream()
                .mapToLong(CommunauteResponse.ProductionMensuelle::kwh).sum();
        // La somme mensuelle doit approcher la production annuelle (arrondis)
        assertEquals(response.productionAnnuelle(), somme, 50);
    }

    @Test
    void conformiteReglementairePresente() {
        var request = new CommunauteRequest(6, 30.0, 4500.0, 0.28, 0.15);
        CommunauteResponse response = service.calculer(request);

        assertNotNull(response.conformite());
        assertNotNull(response.conformite().statutJuridique());
        assertNotNull(response.conformite().loiReference());
        assertTrue(response.conformite().loiReference().contains("2021"));
    }
}
