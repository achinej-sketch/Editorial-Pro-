import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to fetch sitemap and get the last article
  app.get("/api/sitemap", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const response = await axios.get(url, { timeout: 10000 });
      const parser = new XMLParser();
      const jsonObj = parser.parse(response.data);
      
      // WordPress sitemaps usually have <urlset><url><loc> and <lastmod>
      // Some sitemaps are index sitemaps, we might need to handle those or just expect post-sitemap.xml
      let urls = jsonObj.urlset?.url;
      
      if (!urls) {
        return res.json({ lastArticle: "Aucun article trouvé", lastArticleDate: null });
      }

      if (!Array.isArray(urls)) {
        urls = [urls];
      }

      // Sort by lastmod descending
      const sortedUrls = urls
        .filter((u: any) => u.loc && u.lastmod)
        .sort((a: any, b: any) => new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime());

      if (sortedUrls.length > 0) {
        const last = sortedUrls[0];
        // Try to extract a title from the URL slug
        const slug = last.loc.split('/').filter(Boolean).pop() || "";
        const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        
        return res.json({ 
          lastArticle: title, 
          lastArticleDate: last.lastmod,
          url: last.loc
        });
      }

      res.json({ lastArticle: "Aucun article trouvé", lastArticleDate: null });
    } catch (error) {
      console.error(`Error fetching sitemap ${url}:`, error);
      res.status(500).json({ error: "Failed to fetch sitemap" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
