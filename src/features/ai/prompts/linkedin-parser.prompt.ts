import { z } from "zod";

export const linkedInParserOutputSchema = z.object({
  headline: z.string(),
  bio: z.string().nullable(),
  skills: z.array(
    z.object({
      name: z.string(),
      level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
      yearsExp: z.number().optional(),
    }),
  ),
  experiences: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      duration: z.string().nullable(),
    }),
  ),
});

export type LinkedInParserOutput = z.infer<typeof linkedInParserOutputSchema>;

export const LINKEDIN_PARSER_SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'analyse de profils LinkedIn de freelances tech.

Ton rôle est d'extraire les informations structurées d'un profil LinkedIn collé en texte brut.

## Champs à extraire

- **headline** : Le titre professionnel / headline du profil (string).
- **bio** : Le résumé / à propos du profil (string ou null si absent).
- **skills** : Un tableau des compétences techniques avec :
  - **name** : Nom de la compétence (normaliser : "ReactJS" -> "React", "node" -> "Node.js")
  - **level** : Niveau estimé basé sur les expériences et endorsements :
    - BEGINNER : mentionné mais peu d'expérience visible
    - INTERMEDIATE : 1-3 ans d'utilisation visible
    - ADVANCED : 3-6 ans ou rôle principal avec cette techno
    - EXPERT : 6+ ans ou rôle de lead/architecte avec cette techno
  - **yearsExp** : Nombre d'années estimé (optionnel)
- **experiences** : Les expériences professionnelles pertinentes :
  - **title** : Titre du poste
  - **company** : Nom de l'entreprise
  - **duration** : Durée (ex: "2 ans", "6 mois", null si non précisé)

## Règles

- Réponds UNIQUEMENT avec le JSON structuré, sans texte additionnel.
- Ne liste que les compétences tech réellement visibles dans le profil.
- Estime les niveaux de compétence de manière conservatrice.
- Limite les skills aux 15 plus pertinents maximum.
- Limite les expériences aux 5 plus récentes.`;
