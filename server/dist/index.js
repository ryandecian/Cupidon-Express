"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import général
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Import des composants de sécurités
const LimiteRequestIP_1 = __importDefault(require("./Security/LimiteRequestIP"));
// Import des middlewares de sécurités
// Non opérationnel
const RouteLimiterRequestIP_1 = __importDefault(require("./Security/middlewareSecurity/RouteLimiterRequestIP"));
/*----------------------------------------------------*/
// Import pour SQL
const config_1 = __importDefault(require("./database/config"));
// Import des middlewares générals
const VerifyKeys_1 = __importDefault(require("./middleware/VerifyKeys"));
const VerifyEmailFalse_1 = __importDefault(require("./middleware/VerifyEmailFalse"));
const VerifyEmailTrue_1 = __importDefault(require("./middleware/VerifyEmailTrue"));
const HashPassword_1 = __importDefault(require("./middleware/HashPassword"));
const VerifyPassword_1 = __importDefault(require("./middleware/VerifyPassword"));
const InsertUser_1 = __importDefault(require("./middleware/InsertUser"));
const Create_JWT_Middleware_1 = __importDefault(require("./middleware/Create_JWT_Middleware"));
const Verify_JWT_Middleware_1 = __importDefault(require("./middleware/Verify_JWT_Middleware"));
const app = (0, express_1.default)();
const port = 9010;
/**
 * Pour lire le body d'un (request) contenant un json, j'ai besoin d'importer un middleware
 * d'express pour lire la request correctement.
 * Action callBack
 * Methode: USE
 */
app.use(express_1.default.json());
/**
 * Sécurité DDOS
 * Permet de limité les requêtes d'une même IP à 150 par min
 * Déblocage automatique
 */
app.use(LimiteRequestIP_1.default);
/**
 * Sécurité DDOS
 * Permet de limité les requêtes d'une même IP à 150 par min
 * Déblocage automatique
 */
app.use((0, cors_1.default)({
    origin: "http://localhost:3000", // 🔹 Ajuste selon l'URL de ton front
    credentials: true
}));
/**
 * Route de base
 * Path: /
 * Action callBack
 * Methode: GET
 */
app.get("/", (req, res) => {
    res.status(200).send("API Cupidon Express !!!");
});
/**
 * Route de base
 * Path: /
 * Action callBack
 * Methode: POST
 */
app.post("/", (req, res) => {
    res.status(502).json({ reponse: "Requête invalide !", data: req.body });
});
/**
 * Route de register
 * Path: /register
 * middleware: HashPassword
 * Action callBack
 * Methode: POST
 */
app.post("/register", 
// Ajout des middlewares
RouteLimiterRequestIP_1.default, (0, VerifyKeys_1.default)(["name", "email", "password"]), VerifyEmailFalse_1.default, HashPassword_1.default, InsertUser_1.default, 
// Début de la fonction de la route principale
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // ✅ Réponse de succès
        res.status(201).json({
            reponse: "Enregistrement accepté",
            id: req.body.id,
            name: req.body.name,
            email: req.body.email,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Erreur interne serveur." });
        console.error({
            identity: "index.ts",
            type: "route register",
            chemin: "/server/src/index.ts",
            "❌ Nature de l'erreur": "Erreur non gérée dans le serveur !",
            details: error,
        });
        return;
    }
}));
/**
 * Route de login
 * Path: /login
 * Action callBack
 * Methode: POST
 */
app.post("/login", 
// Ajout des middlewares
RouteLimiterRequestIP_1.default, (0, VerifyKeys_1.default)(["email", "password"]), VerifyEmailTrue_1.default, VerifyPassword_1.default, Create_JWT_Middleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        console.error({
            identity: "index.ts",
            type: "route login",
            chemin: "/server/src/index.ts",
            "❌ Nature de l'erreur": "Erreur non gérée dans le serveur !",
            details: error,
        });
        return;
    }
}));
/**
 * Route pour ajouter un message
 * Path: /messages
 * Middleware: Vérification JWT
 * Action callBack
 * Méthode: POST
 */
app.post("/messages", Verify_JWT_Middleware_1.default, // Vérifie que l'utilisateur est connecté avec un token JWT
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { message } = req.body;
    const userId = (_a = req.body.dataUser) === null || _a === void 0 ? void 0 : _a.id; // ID utilisateur récupéré du middleware JWT
    // Vérification des données envoyées
    if (!message || typeof message !== "string") {
        res.status(400).json({ success: false, error: "Le message est obligatoire et doit être une chaîne de caractères." });
        return;
    }
    try {
        const pool = config_1.default;
        const [result] = yield pool.query("INSERT INTO item (message) VALUES (?)", [message]);
        res.status(201).json({
            success: true,
            message: "Message ajouté avec succès",
            messageId: result.insertId
        });
    }
    catch (error) {
        console.error("❌ Erreur lors de l'ajout du message :", error);
        res.status(500).json({ success: false, error: "Erreur serveur" });
    }
}));
/**
 * Route pour récupérer les messages
 * Path: /messages
 * Action callBack
 * Méthode: GET
 */
app.get("/messages", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pool = config_1.default;
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        const [rows] = yield pool.query("SELECT * FROM item ORDER BY date_save DESC LIMIT ? OFFSET ?", [limit, offset]);
        res.status(200).json({ success: true, messages: rows });
    }
    catch (error) {
        console.error("❌ Erreur lors de la récupération des messages :", error);
        res.status(500).json({ success: false, error: "Erreur serveur" });
    }
}));
/**
 * Route pour récupérer les messages
 * Path: /like
 * Action callBack
 * Méthode: POST
 */
app.post("/like/:id", Verify_JWT_Middleware_1.default, // Vérifie que l'utilisateur est connecté
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const userId = (_a = req.body.user) === null || _a === void 0 ? void 0 : _a.id; // ID utilisateur récupéré depuis le JWT
    if (!id || isNaN(Number(id))) {
        res.status(400).json({ success: false, error: "ID du message invalide." });
        return;
    }
    try {
        const pool = config_1.default;
        // Vérifie si l'utilisateur a déjà liké ce message
        const [existingLike] = yield pool.query("SELECT * FROM `like` WHERE user_id = ? AND item_id = ?", [userId, id]);
        if (existingLike.length > 0) {
            res.status(400).json({ success: false, error: "Vous avez déjà liké ce message." });
            return;
        }
        // Ajoute un like
        yield pool.query("INSERT INTO `like` (user_id, item_id) VALUES (?, ?)", [userId, id]);
        // Met à jour le compteur de likes dans la table `item`
        yield pool.query("UPDATE item SET likes = likes + 1 WHERE id = ?", [id]);
        res.status(200).json({ success: true, message: "Like ajouté !" });
    }
    catch (error) {
        console.error("❌ Erreur lors de l'ajout du like :", error);
        res.status(500).json({ success: false, error: "Erreur serveur" });
    }
}));
/**
 * Le server se lance sur le port 8080
 */
app.listen(port, () => {
    console.log(`Server lancé sur http://localhost:${port}`);
});
