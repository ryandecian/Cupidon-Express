"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Utilisation : 
// import VerifyKeys from "./middleware/VerifyKeys";
// VerifyKeys(["motclé1", "motclé2"])
// On peut mettre autant de mot clé que necessaire
function VerifyKeys(requiredKeys) {
    return (function ControleKeys(req, res, next) {
        const missingKeys = requiredKeys.filter(key => !req.body[key]);
        if (missingKeys.length > 0) {
            res.status(400).json({ reponse: "La syntaxe de la requête est erronée." });
            console.error({
                identity: "VerifyKeys.ts",
                type: "middleware",
                chemin: "/server/src/middleware/VerifyKeys.ts",
                "❌ Nature de l'erreur": "Clés manquantes dans la requête",
                missingKeys,
                body: req.body
            });
            return;
        }
        next();
    });
}
exports.default = VerifyKeys;
