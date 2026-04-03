import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please set it in your environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function generateBriefing(
  analyticsData: any[],
  adsenseData: any[],
  blogContext: any[]
) {
  const ai = getAI();
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Tu es un assistant éditorial expert pour un portfolio de 4 blogs WordPress (astucieusement.com, quandonestmaman.fr, tutoriel-iphone.fr, en.astucieusement.com).
    
    Voici les données récoltées :
    - Analytics : ${JSON.stringify(analyticsData)}
    - AdSense (Rapport Claude) : ${JSON.stringify(adsenseData)}
    - Contexte Blogs (derniers articles, cadences) : ${JSON.stringify(blogContext)}
    
    Règles d'analyse (STRICTES - NE JAMAIS INVENTER DE DONNÉES) :
    1. AdSense : Analyser les dates dans le CSV pour déterminer la période réelle (7 jours, 28 jours, etc.). NE PAS assumer 28 jours par défaut. Calculer RPM par pays, Score de valeur, identifier niches à fort CPC.
    2. Analytics : Identifier engagement (>45s ok, <20s alerte), trafic vs RPM.
    3. Cadence & Sitemaps : Utiliser UNIQUEMENT les données de "Contexte Blogs" fournies. NE PAS inventer d'articles ou de dates. Si un blog est en retard, le signaler selon sa cadence cible.
    4. Priorités : Proposer des sujets à fort CPC (coiffure 50+, mode, anti-âge, deco premium).
    5. Recyclage : Suggérer des ponts entre les blogs UNIQUEMENT si pertinent.
    
    CONSIGNE ANTI-HALLUCINATION :
    - Si tu ne vois pas un article dans le sitemap d'un blog, il n'existe pas sur ce blog.
    - Ne jamais attribuer le même article à plusieurs blogs sauf si c'est explicitement dans les données.
    - Regarde bien la colonne 'Date' des CSV pour confirmer la période de l'analyse.
    
    IMPORTANT: Pour chaque priorité suggérée, ajouter obligatoirement :
    📎 Pour illustrer → [JSON PinMetrics] + [recherche Pinterest suggérée]
    
    Rappel permanent : 
    - en.astucieusement.com est en phase de démarrage, ne pas alerter sur le faible trafic.
    - tutoriel-iphone.fr home page en top trafic est normal.
    - Toujours privilégier la valeur CPC sur le volume brut.

    Règles de rédaction (si demandé) :
    - Jamais d'hébergement d'images local. Utiliser uniquement les URLs CDN Pinterest (i.pinimg.com/736x/...).
    - Structure image : <figure style="margin: 1.5em auto; text-align: center;"><img src="..." alt="..." width="736" style="display:block; margin: 0 auto; max-width:100%; border-radius:12px;" /></figure>
    - Pinterest CSV : 50% titres FR / 50% titres EN.
    - Prompt image à la une : Format spécifique vertical 2:3 avec texte Montserrat Black.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          blogStatus: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                blog: { type: Type.STRING },
                lastArticle: { type: Type.STRING },
                theme: { type: Type.STRING },
                daysAgo: { type: Type.NUMBER },
                status: { type: Type.STRING, description: "ok or retard" }
              },
              required: ["blog", "lastArticle", "theme", "daysAgo", "status"]
            }
          },
          analyticsAlerts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                blog: { type: Type.STRING },
                article: { type: Type.STRING },
                views: { type: Type.NUMBER },
                engagement: { type: Type.NUMBER },
                signal: { type: Type.STRING, description: "⏱️ / ⚡ / 🚫" }
              },
              required: ["blog", "article", "views", "engagement", "signal"]
            }
          },
          topArticles: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                article: { type: Type.STRING },
                revenue: { type: Type.NUMBER },
                rpmFR: { type: Type.NUMBER },
                rpmOther: { type: Type.NUMBER },
                signal: { type: Type.STRING, description: "🌍 / 💰 / 🇺🇸" }
              },
              required: ["article", "revenue", "rpmFR", "rpmOther", "signal"]
            }
          },
          priorities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                blog: { type: Type.STRING },
                title: { type: Type.STRING },
                angle: { type: Type.STRING },
                why: { type: Type.STRING },
                illustration: { type: Type.STRING }
              },
              required: ["blog", "title", "angle", "why", "illustration"]
            }
          },
          recentlyCovered: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                blog: { type: Type.STRING },
                theme: { type: Type.STRING },
                daysAgo: { type: Type.NUMBER }
              },
              required: ["blog", "theme", "daysAgo"]
            }
          },
          bonusSuggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          recycling: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                target: { type: Type.STRING },
                originalTitle: { type: Type.STRING },
                suggestedAngle: { type: Type.STRING }
              },
              required: ["source", "target", "originalTitle", "suggestedAngle"]
            }
          }
        },
        required: ["blogStatus", "analyticsAlerts", "topArticles", "priorities", "recentlyCovered", "bonusSuggestions", "recycling"]
      }
    }
  });

  return response.text;
}
