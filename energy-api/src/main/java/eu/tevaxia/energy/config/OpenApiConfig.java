package eu.tevaxia.energy.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI energyOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("energy.tevaxia.eu API")
                        .description("""
                                API REST pour les simulateurs de performance énergétique \
                                immobilière au Luxembourg.

                                Trois simulateurs :
                                - **Impact CPE** : influence de la classe énergie sur la valeur d'un bien
                                - **ROI Rénovation** : coûts, gain de valeur et retour sur investissement
                                - **Communauté d'énergie** : production PV partagée, économies, CO₂ évité
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Erwan Bargain")
                                .email("contact@tevaxia.lu")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Développement"),
                        new Server().url("https://api.energy.tevaxia.eu").description("Production")));
    }
}
