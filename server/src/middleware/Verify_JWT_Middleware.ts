import jwt, { JwtPayload } from "jsonwebtoken";
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
                type: "middleware",
                chemin: "/server/src/middleware/Verify_JWT_Middleware.ts",
                "⚠️ Alerte": "Tentative d'accès sans token JWT.",
                "⚠️ Alerte !": "Accès refusé.",
            });
            return;
        }

        // ✅ Vérification et déchiffrement du token avec async/await
        try {
            const decoded = await jwt.verify(token, SECRET_KEY) as JwtPayload;
            req.body.user = decoded; // ✅ Stocke les infos du token dans req.body.user
            next();
        }
        catch (error) {
            res.status(403).json({ error: "Token invalide ou expiré." });
            console.warn({
                identity: "Verify_JWT_Middleware.ts",
                type: "middleware",
                chemin: "/server/src/middleware/Verify_JWT_Middleware.ts",
                "⚠️ Alerte": "Tentative d'accès avec un token invalide ou expiré.",
                "⚠️ Alerte !": "Accès refusé.",
            });
            return;
        }
    } 
    catch (error) {
        res.status(500).json({ error: "Erreur interne serveur." });
        console.error(
            {
                identity: "Verify_JWT_Middleware.ts",
                type: "middleware",
                chemin: "/server/src/middleware/Verify_JWT_Middleware.ts",
                "❌ Nature de l'erreur": "Erreur non gérée dans le serveur !",
                details: error,
            },
        );
    }
}

export default Verify_JWT_Middleware;
