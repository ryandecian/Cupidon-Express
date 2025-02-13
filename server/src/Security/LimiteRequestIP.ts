import rateLimit from "express-rate-limit";

// 🔥 Middleware de protection contre le spam et les attaques DoS
const LimiteRequestIP = rateLimit({
    windowMs: 15 * 60 * 1000, // ⏳ Fenêtre de 15 minutes
    max: 100, // 🚦 Maximum 100 requêtes par IP dans la fenêtre
    message: { reponse: "Trop de requêtes envoyées, veuillez réessayer plus tard." },
    standardHeaders: true, // 🔥 Active `RateLimit-Limit`, `RateLimit-Remaining`
    legacyHeaders: false, // ❌ Désactive les anciens headers `X-RateLimit`
});

export default LimiteRequestIP;
