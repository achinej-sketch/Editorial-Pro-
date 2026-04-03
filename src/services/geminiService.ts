import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateBriefing(
  analyticsData: any[],
  adsenseData: any[],
  blogContext: any[]
) {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Tu es un assistant éditorial expert pour un portfolio de 4 blogs WordPress (astucieusement.com, quandonestmaman.fr, tutoriel-iphone.fr, en.astucieusement.com).
    
    Voici les données récoltées :
    - Analytics : ${JSON.stringify(analyticsData)}
    - AdSense (Rapport Claude) : ${JSON.stringify(adsenseData)}
    - Contexte Blogs (derniers articles, cadences) : ${JSON.stringify(blogContext)}
    
    Règles d'analyse :
    1. AdSense : Calculer RPM par pays, Score de valeur, identifier niches à fort CPC.
    2. Analytics : Identifier engagement (>45s ok, <20s alerte), trafic vs RPM.
    3. Cadence : Détecter les retards (astucieusement: 3/sem, quandonestmaman: 2/sem, tutoriel-iphone: 2/sem, en.astucieusement: 1/sem).
    4. Priorités : Proposer des sujets à fort CPC (coiffure 50+, mode, anti-âge, deco premium).
    5. Recyclage : Suggérer des ponts entre les blogs.
    
    IMPORTANT: Pour chaque priorité suggérée, ajouter obligatoirement :
    📎 Pour illustrer → [JSON PinMetrics] + [recherche Pinterest suggérée]
    
    Format de sortie attendu (Markdown strict) :
    
    📊 État des blogs
    | Blog | Dernier article | Thème | Jours | Statut |
    | :--- | :--- | :--- | :--- | :--- |
    | astucieusement.com | [titre] | [thème] | il y a [X] jours | [✅ ok / ⚠️ retard] |
    | quandonestmaman.fr | [titre] | [thème] | il y a [X] jours | [✅ ok / ⚠️ retard] |
    | tutoriel-iphone.fr | [titre] | [thème] | il y a [X] jours | [✅ ok / ⚠️ retard] |
    | en.astucieusement.com | [titre] | [thème] | il y a [X] jours | [✅ ok / ⚠️ retard] |
    
    🔍 Alertes Analytics (si fichiers Analytics fournis)
    | Blog | Article | Vues | Engagement | Signal |
    | :--- | :--- | :--- | :--- | :--- |
    | [blog] | [titre court] | [X] | [X]s | [⏱️ / ⚡ / 🚫] |
    
    💰 Top articles (si rapport Claude fourni)
    | Article | Revenus 28j | RPM France | RPM Canada/BE | Signal |
    | :--- | :--- | :--- | :--- | :--- |
    | [titre court] | €[X] | €[X] | €[X] | [🌍 / 💰 / 🇺🇸] |
    
    🎯 Priorités du jour
    - [Blog] → [Titre suggéré] — [angle / mots-clés] — pourquoi : [signal CPC / RPM / retard / tendance]
      📎 Pour illustrer → [JSON PinMetrics] + [recherche Pinterest suggérée]
    
    🚫 Sujets déjà couverts récemment
    - [blog] : [thème] — publié il y a [X] jours, ne pas répéter
    
    💡 Suggestions bonus
    [Opportunités saisonnières, CPC, pays, etc.]
    
    ♻️ Recyclages possibles
    - [Blog source] → [Blog cible] : [Titre original] — angle suggéré : [nouvel angle]
    
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
  });

  return response.text;
}
