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
class CommunauteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void simulerCommunaute_retourne200() throws Exception {
        mockMvc.perform(post("/api/v1/communaute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "nbParticipants": 6,
                                    "puissancePV": 30,
                                    "consoMoyenneParParticipant": 4500,
                                    "tarifReseau": 0.28,
                                    "tarifPartage": 0.15
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productionAnnuelle").value(28500))
                .andExpect(jsonPath("$.consoTotale").value(27000))
                .andExpect(jsonPath("$.economieTotale").isNumber())
                .andExpect(jsonPath("$.co2EviteKg").isNumber())
                .andExpect(jsonPath("$.parametres").isNotEmpty())
                .andExpect(jsonPath("$.coutInstallationHTVA").isNumber())
                .andExpect(jsonPath("$.coutInstallationTTC").isNumber())
                .andExpect(jsonPath("$.paybackGlobalAnnees").isNumber())
                .andExpect(jsonPath("$.productionMensuelle").isArray())
                .andExpect(jsonPath("$.productionMensuelle.length()").value(12))
                .andExpect(jsonPath("$.conformite").isNotEmpty());
    }

    @Test
    void moinsDeDeuxParticipants_retourne400() throws Exception {
        mockMvc.perform(post("/api/v1/communaute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "nbParticipants": 1,
                                    "puissancePV": 10,
                                    "consoMoyenneParParticipant": 4000,
                                    "tarifReseau": 0.28,
                                    "tarifPartage": 0.15
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void champManquant_retourne400() throws Exception {
        mockMvc.perform(post("/api/v1/communaute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "nbParticipants": 6,
                                    "puissancePV": 30
                                }
                                """))
                .andExpect(status().isBadRequest());
    }
}
