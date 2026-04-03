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
        var classeD = response.classes().stream()
                .filter(c -> c.classe().equals("D"))
                .findFirst().orElseThrow();
        assertEquals(0, classeD.delta());
        assertEquals(750_000, classeD.valeurAjustee());
    }

    @Test
    void classeA_vautPlusQueClasseI() {
        var request = new ImpactRequest(500_000.0, "D");
        ImpactResponse response = service.calculer(request);

        long valeurA = response.classes().stream()
                .filter(c -> c.classe().equals("A")).findFirst().orElseThrow()
                .valeurAjustee();
        long valeurI = response.classes().stream()
                .filter(c -> c.classe().equals("I")).findFirst().orElseThrow()
                .valeurAjustee();

        assertTrue(valeurA > valeurI, "Classe A devrait valoir plus que I");
    }

    @Test
    void retourneNeufClasses() {
        var request = new ImpactRequest(600_000.0, "C");
        ImpactResponse response = service.calculer(request);

        assertEquals(9, response.classes().size());
    }

    @ParameterizedTest
    @CsvSource({"A,8.0", "B,5.0", "C,2.0", "D,0.0", "E,-3.0", "F,-7.0", "G,-12.0", "H,-18.0", "I,-25.0"})
    void ajustementsPourcentagesConformesSpec(String classe, double expectedPct) {
        var request = new ImpactRequest(1_000_000.0, "D");
        ImpactResponse response = service.calculer(request);

        var impact = response.classes().stream()
                .filter(c -> c.classe().equals(classe))
                .findFirst().orElseThrow();

        assertEquals(expectedPct, impact.ajustementPct());
    }

    @Test
    void normalisationDepuisClasseF() {
        var request = new ImpactRequest(500_000.0, "F");
        ImpactResponse response = service.calculer(request);

        assertTrue(response.valeurBase() > 500_000,
                "La valeur base (D) devrait être supérieure à la valeur en classe F");

        var classeF = response.classes().stream()
                .filter(c -> c.classe().equals("F")).findFirst().orElseThrow();
        assertEquals(0, classeF.delta());
    }

    @Test
    void normalisationDepuisClasseI() {
        var request = new ImpactRequest(400_000.0, "I");
        ImpactResponse response = service.calculer(request);

        assertTrue(response.valeurBase() > 400_000,
                "La valeur base (D) devrait être supérieure à la valeur en classe I");

        var classeI = response.classes().stream()
                .filter(c -> c.classe().equals("I")).findFirst().orElseThrow();
        assertEquals(0, classeI.delta());
    }

    @Test
    void responseContientMethodologieEtSources() {
        var request = new ImpactRequest(500_000.0, "D");
        ImpactResponse response = service.calculer(request);

        assertNotNull(response.methodologie());
        assertFalse(response.methodologie().isEmpty());
        assertNotNull(response.sources());
        assertFalse(response.sources().isEmpty());
    }
}
