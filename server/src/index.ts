// Import général
import express, { query, Request, Response, NextFunction } from "express";
import cors from "cors";

// Import des composants de sécurités
import LimiteRequestIP from "./Security/LimiteRequestIP";

// Import des middlewares de sécurités
// Non opérationnel
import RouteLimiterRequestIP from "./Security/middlewareSecurity/RouteLimiterRequestIP";

/*----------------------------------------------------*/

// Import pour SQL
import usePoolConnection from "./database/config";
import { useComplexConnection } from "./database/config";
import { ResultSetHeader, RowDataPacket } from "mysql2";

// Import des middlewares générals
import VerifyKeys from "./middleware/VerifyKeys";
import VerifyEmailFalse from "./middleware/VerifyEmailFalse";
import VerifyEmailTrue from "./middleware/VerifyEmailTrue";
import HashPassword from "./middleware/HashPassword";
import VerifyPassword from "./middleware/VerifyPassword";
import InsertUser from "./middleware/InsertUser";
import Create_JWT_Middleware from "./middleware/Create_JWT_Middleware";
import Verify_JWT_Middleware from "./middleware/Verify_JWT_Middleware";

const app = express();
const port = 8080;

/**
 * Pour lire le body d'un (request) contenant un json, j'ai besoin d'importer un middleware
 * d'express pour lire la request correctement.
 * Action callBack
 * Methode: USE
 */
app.use(express.json());

/**
 * Sécurité DDOS
 * Permet de limité les requêtes d'une même IP à 150 par min
 * Déblocage automatique
 */
app.use(LimiteRequestIP);

/**
 * Sécurité DDOS
 * Permet de limité les requêtes d'une même IP à 150 par min
 * Déblocage automatique
 */
app.use(cors({
    origin: "http://localhost:3000", // 🔹 Ajuste selon l'URL de ton front
    credentials: true
}));

/**
 * Route de base
 * Path: /
 * Action callBack
 * Methode: GET
 */
app.get("/", (req: Request, res: Response) => {
    res.status(200).send("API Cupidon Express !!!");
})

/**
 * Route de base
 * Path: /
 * Action callBack
 * Methode: POST
 */
app.post("/", (req: Request, res: Response) => {
    res.status(502).json({ reponse: "Requête invalide !", data: req.body })
})

/**
 * Route de register
 * Path: /register
 * middleware: HashPassword
 * Action callBack
 * Methode: POST
 */
app.post("/register",
    // Ajout des middlewares
    RouteLimiterRequestIP,
    VerifyKeys(["name", "email", "password"]),
    VerifyEmailFalse,
    HashPassword,
    InsertUser,

    // Début de la fonction de la route principale
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        try {
            // ✅ Réponse de succès
            res.status(201).json(
                {
                    reponse: "Enregistrement accepté",
                    id: req.body.id, 
                    name: req.body.name,
                    email: req.body.email,
                }
            );
        }
        catch (error) {
            res.status(500).json({ error: "Erreur interne serveur." });
            console.error(
                {
                    identity: "index.ts",
                    type: "route register",
                    chemin: "/server/src/index.ts",
                    "❌ Nature de l'erreur": "Erreur non gérée dans le serveur !",
                    details: error,
                },
            );
            return;
        }
})

/**
 * Route de login
 * Path: /login
 * Action callBack
 * Methode: POST
 */
app.post("/login",
    // Ajout des middlewares
    RouteLimiterRequestIP,
    VerifyKeys(["email", "password"]),
    VerifyEmailTrue,
    VerifyPassword,
    Create_JWT_Middleware,
    async (req: Request, res: Response):Promise<void> => {
    try {
        res.status(200)
        .cookie("jwtToken", req.body.jwt)
        .json({
            token: req.body.jwt,
            id: req.body.dataUser.id,
            name: req.body.dataUser.name,
            email: req.body.dataUser.email,
        });
    } 
    catch (error) {
        res.status(500).json({ error: "Erreur interne serveur." });
        console.error(
            {
                identity: "index.ts",
                type: "route login",
                chemin: "/server/src/index.ts",
                "❌ Nature de l'erreur": "Erreur non gérée dans le serveur !",
                details: error,
            },
        );
        return;
    }
});

/**
 * Route pour ajouter un message
 * Path: /messages
 * Middleware: Vérification JWT
 * Action callBack
 * Méthode: POST
 */
app.post("/messages",
    Verify_JWT_Middleware, // Vérifie que l'utilisateur est connecté avec un token JWT
    async (req: Request, res: Response): Promise<void> => {
        const { message } = req.body;
        const userId = req.body.dataUser?.id; // ID utilisateur récupéré du middleware JWT

        // Vérification des données envoyées
        if (!message || typeof message !== "string") {
            res.status(400).json({ success: false, error: "Le message est obligatoire et doit être une chaîne de caractères." });
            return;
        }

        try {
            const pool = usePoolConnection;
            const [result] = await pool.query<ResultSetHeader>(
                "INSERT INTO item (message) VALUES (?)",
                [message]
            );

            res.status(201).json({ 
                success: true, 
                message: "Message ajouté avec succès", 
                messageId: result.insertId 
            });
        } catch (error) {
            console.error("❌ Erreur lors de l'ajout du message :", error);
            res.status(500).json({ success: false, error: "Erreur serveur" });
        }
    }
);

/**
 * Route pour récupérer les messages
 * Path: /messages
 * Action callBack
 * Méthode: GET
 */
app.get("/messages",
    async (req: Request, res: Response): Promise<void> => {
        try {
            const pool = usePoolConnection;
            const limit = parseInt(req.query.limit as string) || 10; // ✅ Limite configurable (par défaut 10)

            const [rows] = await pool.query(
                "SELECT * FROM item ORDER BY date_save DESC LIMIT ?",
                [limit]
            );

            res.status(200).json({ success: true, messages: rows });
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des messages :", error);
            res.status(500).json({ success: false, error: "Erreur serveur" });
        }
    }
);

/**
 * Route pour récupérer les messages
 * Path: /like
 * Action callBack
 * Méthode: POST
 */
app.post("/like/:id",
    Verify_JWT_Middleware, // Vérifie que l'utilisateur est connecté
    async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const userId = req.body.user?.id; // ID utilisateur récupéré depuis le JWT

        if (!id || isNaN(Number(id))) {
            res.status(400).json({ success: false, error: "ID du message invalide." });
            return;
        }

        try {
            const pool = usePoolConnection;

            // Vérifie si l'utilisateur a déjà liké ce message
            const [existingLike]: any = await pool.query(
                "SELECT * FROM `like` WHERE user_id = ? AND item_id = ?",
                [userId, id]
            );

            if (existingLike.length > 0) {
                res.status(400).json({ success: false, error: "Vous avez déjà liké ce message." });
                return;
            }

            // Ajoute un like
            await pool.query(
                "INSERT INTO `like` (user_id, item_id) VALUES (?, ?)",
                [userId, id]
            );

            // Met à jour le compteur de likes dans la table `item`
            await pool.query(
                "UPDATE item SET likes = likes + 1 WHERE id = ?",
                [id]
            );

            res.status(200).json({ success: true, message: "Like ajouté !" });
        } catch (error) {
            console.error("❌ Erreur lors de l'ajout du like :", error);
            res.status(500).json({ success: false, error: "Erreur serveur" });
        }
    }
);


/**
 * Le server se lance sur le port 8080
 */
app.listen(port, () => {
    console.log(`Server lancé sur http://localhost:${port}`);
});
