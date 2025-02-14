import { useState, useEffect, useCallback } from "react";
import "./HomePage.css";

interface Message {
    id: number;
    message: string;
    date_save: string;
    likes: number;
}

export default function HomePage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [page, setPage] = useState(1);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token);
    }, []);

    const fetchMessages = useCallback(async () => {
        try {
            const response = await fetch(`https://backend-cupidon-express.decian.ddnsfree.com:7565/messages?limit=10&page=${page}`);
            const data = await response.json();
            
            if (!data.messages.length) {
                console.warn("Aucun nouveau message à charger.");
                return;
            }
    
            setMessages((prev) => [...prev, ...data.messages]);
        } catch (error) {
            console.error("Erreur lors de la récupération des messages :", error);
        }
    }, [page]);
    

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:8080/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data.token) {
                localStorage.setItem("token", data.token);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error("Erreur lors de la connexion :", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
    };

    const handleLike = async (id: number) => {
        if (!isAuthenticated) return;
        try {
            await fetch(`http://localhost:8080/like/${id}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });
            setMessages(messages.map(msg => msg.id === id ? { ...msg, likes: msg.likes + 1 } : msg));
        } catch (error) {
            console.error("Erreur lors du like :", error);
        }
    };

    const handlePostMessage = async () => {
        if (!isAuthenticated || !newMessage.trim()) return;
        try {
            const response = await fetch("http://localhost:8080/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ message: newMessage })
            });
            const data = await response.json();
            setMessages([{ id: data.messageId, message: newMessage, date_save: new Date().toISOString(), likes: 0 }, ...messages]);
            setNewMessage("");
        } catch (error) {
            console.error("Erreur lors de l'envoi du message :", error);
        }
    };

    return (
        <div className="home-container">
            <h1 className="title">Mur des Déclarations 💌</h1>
            {!isAuthenticated ? (
                <form className="login-box" onSubmit={handleLogin}>
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input 
                        type="password" 
                        placeholder="Mot de passe" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="login-button">Se connecter</button>
                </form>
            ) : (
                <button onClick={handleLogout} className="logout-button">Se déconnecter</button>
            )}
            {isAuthenticated && (
                <div className="message-box">
                    <textarea 
                        className="message-input" 
                        placeholder="Écrivez votre message..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button 
                        onClick={handlePostMessage} 
                        className="send-button">
                        Envoyer
                    </button>
                </div>
            )}
            <div className="messages-list">
                {messages.map((msg) => (
                    <div key={msg.id} className="message-card">
                        <p className="message-text">{msg.message}</p>
                        <div className="message-footer">
                            <span className="message-date">{new Date(msg.date_save).toLocaleString()}</span>
                            <button 
                                onClick={() => handleLike(msg.id)}
                                className={`like-button ${!isAuthenticated ? 'disabled' : ''}`}>
                                ❤️ {msg.likes}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <button 
                onClick={() => setPage(page + 1)} 
                className="load-more">
                Voir plus
            </button>
        </div>
    );
}
