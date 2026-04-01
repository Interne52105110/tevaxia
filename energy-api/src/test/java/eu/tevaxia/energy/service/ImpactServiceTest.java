package eu.tevaxia.energy.service;

import eu.tevaxia.energy.model.dto.ImpactRequest;
import eu.tevaxia.energy.model.dto.ImpactResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

class ImpactServiceTest {

    private final ImpactService service = new ImpactService();

    @Test
    void classeD_retourneValeurInchangee() {
        var request = new ImpactRequest(750_000.0, "D");
        ImpactResponse response = service.calculer(request);

        assertEquals("D", response.classeActuelle());
        // Classe D = référence, delta doit être 0
        var classeD = response.classes().stream()
                .filter(c -> c.classe().equals("D"))
                .findFirst().orElseThrow();
        assertEquals(0, classeD.delta());
        assertEquals(750_000, classeD.valeurAjustee());
    }

    @Test
    void classeA_vautPlusQueClasseG() {
        var request = new ImpactRequest(500_000.0, "D");
        ImpactResponse response = service.calculer(request);

        long valeurA = response.classes().stream()
                .filter(c -> c.classe().equals("A")).findFirst().orElseThrow()
                .valeurAjustee();
        long valeurG = response.classes().stream()
                .filter(c -> c.classe().equals("G")).findFirst().orElseThrow()
                .valeurAjustee();

        assertTrue(valeurA > valeurG, "Classe A devrait valoir plus que G");
    }

    @Test
    void retourneSeptClasses() {
        var request = new ImpactRequest(600_000.0, "C");
        ImpactResponse response = service.calculer(request);

        assertEquals(7, response.classes().size());
    }

    @ParameterizedTest
    @CsvSource({"A,5.0", "B,3.0", "C,1.0", "D,0.0", "E,-3.0", "F,-6.0", "G,-10.0"})
    void ajustementsPourcentagesCorrects(String classe, double expectedPct) {
        var request = new ImpactRequest(1_000_000.0, "D");
        ImpactResponse response = service.calculer(request);

        var impact = response.classes().stream()
                .filter(c -> c.classe().equals(classe))
                .findFirst().orElseThrow();

        assertEquals(expectedPct, impact.ajustementPct());
    }

    @Test
    void normalisationDepuisClasseF() {
        // Un bien à 500 000 € en classe F (−6%), la valeur base D devrait être plus élevée
        var request = new ImpactRequest(500_000.0, "F");
        ImpactResponse response = service.calculer(request);

        assertTrue(response.valeurBase() > 500_000,
                "La valeur base (D) devrait être supérieure à la valeur en classe F");

        // Le delta de la classe F devrait être 0 (c'est la classe actuelle)
        var classeF = response.classes().stream()
                .filter(c -> c.classe().equals("F")).findFirst().orElseThrow();
        assertEquals(0, classeF.delta());
    }
}
