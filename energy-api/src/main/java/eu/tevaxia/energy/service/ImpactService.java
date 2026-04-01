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
 * Source des coefficients : Observatoire de l'Habitat, analyses Spuerkeess,
 * tendances marché luxembourgeois.
 * La classe D sert de référence (0 %).
 */
@Service
public class ImpactService {

    private static final List<String> CLASSES = List.of("A", "B", "C", "D", "E", "F", "G");

    /** Ajustement en % par rapport à la classe D (référence). */
    private static final Map<String, Double> IMPACT_ENERGIE = Map.of(
            "A", 5.0,
            "B", 3.0,
            "C", 1.0,
            "D", 0.0,
            "E", -3.0,
            "F", -6.0,
            "G", -10.0
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

        return new ImpactResponse(Math.round(valeurBase), request.classeActuelle(), impacts);
    }
}
