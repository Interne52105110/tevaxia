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
class ImpactControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void calculerImpact_retourne200() throws Exception {
        mockMvc.perform(post("/api/v1/impact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"valeurBien": 750000, "classeActuelle": "D"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.classeActuelle").value("D"))
                .andExpect(jsonPath("$.classes").isArray())
                .andExpect(jsonPath("$.classes.length()").value(9))
                .andExpect(jsonPath("$.methodologie").isNotEmpty())
                .andExpect(jsonPath("$.sources").isArray());
    }

    @Test
    void classeInvalide_retourne400() throws Exception {
        mockMvc.perform(post("/api/v1/impact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"valeurBien": 750000, "classeActuelle": "Z"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void valeurManquante_retourne400() throws Exception {
        mockMvc.perform(post("/api/v1/impact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"classeActuelle": "D"}
                                """))
                .andExpect(status().isBadRequest());
    }
}
