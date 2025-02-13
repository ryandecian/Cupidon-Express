import jwt, {  VerifyErrors, JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import "dotenv/config";

const SECRET_KEY = process.env.SECRET_KEY_TOKEN;

async function Verify_JWT_Middleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (!SECRET_KEY) {
            res.status(500).json({ error: "Erreur interne serveur." });
            console.error({
                identity: "Verify_JWT_Middleware.ts",
                type: "middleware",
                chemin: "/server/src/middleware/Verify_JWT_Middleware.ts",
                "❌ Nature de l'erreur": "SECRET_KEY_TOKEN est absent dans .env !",
            });
            return;
        }

        // ✅ Récupération du token depuis les cookies ou l’Authorization header
        const token = req.cookies?.jwtToken || req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({ error: "Accès refusé. Aucun token fourni." });
            console.warn({
                identity: "Verify_JWT_Middleware.ts",
                type: "sécurité",
                chemin: "/server/src/middleware/Verify_JWT_Middleware.ts",
                "⚠️ Alerte !": "Tentative d'accès sans token JWT.",
            });
            return;
        }

        // ✅ Vérification et déchiffrement du token avec async/await
        try {
           // ✅ Vérification du token (bloque les erreurs)
                       const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
        }
        catch (err) {
            res.status(403).json({ error: "Token invalide ou expiré." });
            return;
        }
    } catch (error) {
        console.error("❌ Erreur dans Verify_JWT_Middleware :", error);
        res.status(500).json({ error: "Erreur interne serveur." });
    }
}

export default Verify_JWT_Middleware;
