package eu.tevaxia.energy.service;

import eu.tevaxia.energy.model.dto.RenovationRequest;
import eu.tevaxia.energy.model.dto.RenovationResponse;
import eu.tevaxia.energy.model.dto.RenovationResponse.PosteTravaux;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Service de calcul du ROI d'une rénovation énergétique.
 * <p>
 * Coûts unitaires : fourchettes indicatives €/m² habitable, marché luxembourgeois 2025.
 * Sources : guides Klimabonus, barèmes professionnels.
 */
@Service
public class RenovationService {

    private static final List<String> CLASSES = List.of("A", "B", "C", "D", "E", "F", "G");

    /** Ajustement en % par rapport à la classe D. */
    private static final Map<String, Double> IMPACT_ENERGIE = Map.of(
            "A", 5.0, "B", 3.0, "C", 1.0, "D", 0.0,
            "E", -3.0, "F", -6.0, "G", -10.0
    );

    /** Coûts unitaires par poste en €/m² (min, max). */
    private record CoutUnitaire(String label, double min, double max) {}

    private static final Map<String, CoutUnitaire> POSTES = new LinkedHashMap<>();
    static {
        POSTES.put("isolation_facade",    new CoutUnitaire("Isolation façade (ITE)", 120, 220));
        POSTES.put("isolation_toiture",   new CoutUnitaire("Isolation toiture / combles", 80, 160));
        POSTES.put("isolation_sol",       new CoutUnitaire("Isolation sol / cave", 40, 90));
        POSTES.put("fenetres",            new CoutUnitaire("Remplacement fenêtres (triple vitrage)", 80, 150));
        POSTES.put("chauffage",           new CoutUnitaire("Système de chauffage (PAC)", 100, 200));
        POSTES.put("ventilation",         new CoutUnitaire("VMC double flux", 40, 80));
        POSTES.put("solaire_thermique",   new CoutUnitaire("Panneaux solaires thermiques", 30, 60));
        POSTES.put("solaire_pv",          new CoutUnitaire("Panneaux photovoltaïques", 50, 100));
        POSTES.put("electricite",         new CoutUnitaire("Mise aux normes électrique", 30, 60));
    }

    /** Postes nécessaires selon le saut de classe. */
    private static final Map<String, List<String>> POSTES_PAR_SAUT = Map.ofEntries(
            Map.entry("G_F", List.of("isolation_facade", "fenetres")),
            Map.entry("G_E", List.of("isolation_facade", "fenetres", "chauffage")),
            Map.entry("G_D", List.of("isolation_facade", "isolation_toiture", "fenetres", "chauffage", "ventilation")),
            Map.entry("G_C", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation")),
            Map.entry("G_B", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "solaire_thermique")),
            Map.entry("G_A", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "solaire_thermique", "solaire_pv")),
            Map.entry("F_E", List.of("isolation_facade", "fenetres")),
            Map.entry("F_D", List.of("isolation_facade", "fenetres", "chauffage")),
            Map.entry("F_C", List.of("isolation_facade", "isolation_toiture", "fenetres", "chauffage", "ventilation")),
            Map.entry("F_B", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation")),
            Map.entry("F_A", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "solaire_pv")),
            Map.entry("E_D", List.of("isolation_facade", "fenetres")),
            Map.entry("E_C", List.of("isolation_facade", "fenetres", "chauffage")),
            Map.entry("E_B", List.of("isolation_facade", "isolation_toiture", "fenetres", "chauffage", "ventilation")),
            Map.entry("E_A", List.of("isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "solaire_pv")),
            Map.entry("D_C", List.of("isolation_facade", "fenetres")),
            Map.entry("D_B", List.of("isolation_facade", "isolation_toiture", "fenetres", "chauffage")),
            Map.entry("D_A", List.of("isolation_facade", "isolation_toiture", "fenetres", "chauffage", "ventilation", "solaire_pv")),
            Map.entry("C_B", List.of("isolation_toiture", "chauffage")),
            Map.entry("C_A", List.of("isolation_toiture", "chauffage", "ventilation", "solaire_pv")),
            Map.entry("B_A", List.of("solaire_pv", "ventilation"))
    );

    public RenovationResponse calculer(RenovationRequest request) {
        String classeActuelle = request.classeActuelle();
        String classeCible = request.classeCible();
        int idxActuelle = CLASSES.indexOf(classeActuelle);
        int idxCible = CLASSES.indexOf(classeCible);

        if (idxCible >= idxActuelle) {
            throw new IllegalArgumentException(
                    "La classe cible (%s) doit être meilleure que la classe actuelle (%s)"
                            .formatted(classeCible, classeActuelle));
        }

        String key = classeActuelle + "_" + classeCible;
        List<String> postesNecessaires = POSTES_PAR_SAUT.getOrDefault(key, List.of());

        double facteur = facteurAge(request.anneeConstruction());
        double surface = request.surface();

        List<PosteTravaux> postes = new ArrayList<>();
        long totalMin = 0, totalMax = 0, totalMoyen = 0;

        for (String posteId : postesNecessaires) {
            CoutUnitaire cu = POSTES.get(posteId);
            if (cu == null) continue;

            long min = Math.round(cu.min() * surface * facteur);
            long max = Math.round(cu.max() * surface * facteur);
            long moy = Math.round((min + max) / 2.0);

            postes.add(new PosteTravaux(cu.label(), min, max, moy));
            totalMin += min;
            totalMax += max;
            totalMoyen += moy;
        }

        long honoraires = Math.round(totalMoyen * 0.10);
        long totalProjet = totalMoyen + honoraires;
        int dureeMois = Math.max(3, Math.round(postesNecessaires.size() * 1.5f));

        // Gain de valeur
        double pctActuelle = IMPACT_ENERGIE.getOrDefault(classeActuelle, 0.0);
        double pctCible = IMPACT_ENERGIE.getOrDefault(classeCible, 0.0);
        double gainPct = pctCible - pctActuelle;
        long gainValeur = Math.round(request.valeurBien() * (gainPct / 100.0));

        double roi = totalProjet > 0 ? (gainValeur * 100.0 / totalProjet) : 0.0;

        return new RenovationResponse(
                classeActuelle + " → " + classeCible,
                postes,
                totalMin, totalMax, totalMoyen,
                honoraires, totalProjet, dureeMois,
                gainValeur, Math.round(gainPct * 10.0) / 10.0,
                Math.round(roi * 10.0) / 10.0
        );
    }

    /** Facteur multiplicateur selon l'ancienneté du bâtiment. */
    private double facteurAge(int anneeConstruction) {
        int age = Year.now().getValue() - anneeConstruction;
        if (age > 80) return 1.30;
        if (age > 50) return 1.15;
        if (age > 30) return 1.05;
        return 1.00;
    }
}
