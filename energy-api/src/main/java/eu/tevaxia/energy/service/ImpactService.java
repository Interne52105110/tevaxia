package eu.tevaxia.energy.service;

import eu.tevaxia.energy.model.dto.ImpactRequest;
import eu.tevaxia.energy.model.dto.ImpactResponse;
import eu.tevaxia.energy.model.dto.ImpactResponse.ClasseImpact;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Service de calcul de l'impact de la classe énergie (CPE) sur la valeur immobilière.
 * <p>
 * Green premium / brown discount basé sur les études de marché luxembourgeoises.
 * La classe D sert de référence (0 %).
 * <p>
 * Sources : Observatoire de l'Habitat 2025, ECB Climate Risk Assessment,
 * analyses Spuerkeess/BIL, tendances marché luxembourgeois.
 */
@Service
public class ImpactService {

    static final List<String> CLASSES = List.of("A", "B", "C", "D", "E", "F", "G", "H", "I");

    /** Ajustement en % par rapport à la classe D (référence). Conforme SPEC-FONCTIONNELLE §5.1. */
    static final Map<String, Double> IMPACT_ENERGIE = Map.of(
            "A",  8.0,
            "B",  5.0,
            "C",  2.0,
            "D",  0.0,
            "E", -3.0,
            "F", -7.0,
            "G", -12.0,
            "H", -18.0,
            "I", -25.0
    );

    private static final String METHODOLOGIE =
            "Green premium / brown discount basé sur les écarts de prix observés par classe " +
            "énergétique au Luxembourg. La classe D (modale du parc) sert de référence (0 %). " +
            "Fourchette indicative : ±1,5 point de pourcentage selon commune et type de bien.";

    private static final List<String> SOURCES = List.of(
            "Observatoire de l'Habitat 2025",
            "ECB Climate Risk Assessment",
            "Analyses marché Spuerkeess / BIL"
    );

    public ImpactResponse calculer(ImpactRequest request) {
        double pctActuelle = IMPACT_ENERGIE.getOrDefault(request.classeActuelle(), 0.0);
        // Normaliser la valeur fournie vers la base D (0 %)
        double valeurBase = request.valeurBien() / (1.0 + pctActuelle / 100.0);

        List<ClasseImpact> impacts = new ArrayList<>();
        for (String classe : CLASSES) {
            double pct = IMPACT_ENERGIE.getOrDefault(classe, 0.0);
            long valeurAjustee = Math.round(valeurBase * (1.0 + pct / 100.0));
            long delta = valeurAjustee - request.valeurBien().longValue();

            impacts.add(new ClasseImpact(classe, pct, valeurAjustee, delta));
        }

        return new ImpactResponse(Math.round(valeurBase), request.classeActuelle(), impacts,
                METHODOLOGIE, SOURCES);
    }
}
