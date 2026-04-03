package eu.tevaxia.energy.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class RenovationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void simulerRenovation_retourne200() throws Exception {
        mockMvc.perform(post("/api/v1/renovation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "classeActuelle": "F",
                                    "classeCible": "B",
                                    "surface": 120,
                                    "anneeConstruction": 1975,
                                    "valeurBien": 650000
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sautClasse").value("F → B"))
                .andExpect(jsonPath("$.postes").isArray())
                .andExpect(jsonPath("$.totalProjet").isNumber())
                .andExpect(jsonPath("$.roiPct").isNumber())
                .andExpect(jsonPath("$.klimabonus").isNotEmpty())
                .andExpect(jsonPath("$.klimapret").isNotEmpty())
                .andExpect(jsonPath("$.economieAnnuelleKwh").isNumber())
                .andExpect(jsonPath("$.paybackAnnees").isNumber())
                .andExpect(jsonPath("$.van20ans").isNumber())
                .andExpect(jsonPath("$.triPct").isNumber());
    }

    @Test
    void classeCiblePireQueActuelle_retourne400() throws Exception {
        mockMvc.perform(post("/api/v1/renovation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "classeActuelle": "B",
                                    "classeCible": "F",
                                    "surface": 100,
                                    "valeurBien": 500000
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void surfaceManquante_retourne400() throws Exception {
        mockMvc.perform(post("/api/v1/renovation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "classeActuelle": "G",
                                    "classeCible": "A",
                                    "valeurBien": 500000
                                }
                                """))
                .andExpect(status().isBadRequest());
    }
}
