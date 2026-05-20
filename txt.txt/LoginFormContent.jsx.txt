import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AUTH_URL } from "../../lib/const";

const LoginFormContent = () => {
    const [name, setName] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${AUTH_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
                body: JSON.stringify({ name }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || "Login échoué");
            }

            const data = await res.json();
            login(data.user);
            navigate("/my-documents");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md mx-auto">
            <div className="card bg-base-100 shadow-xl w-full">
                <div className="card-body">
                    <h2 className="card-title font-is-b text-2xl mb-4">Connexion</h2>

                    {error && (
                        <div className="alert alert-error mb-4">
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-inter-m">Nom</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Votre nom"
                                className="input input-bordered w-full"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary w-full ${loading ? "loading" : ""}`}
                            disabled={loading}
                        >
                            {loading ? "Connexion..." : "Se connecter"}
                        </button>
                    </form>

                    <div className="divider">OU</div>

                    <Link to="/register" className="btn btn-outline btn-sm w-full">
                        Créer un compte
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginFormContent;
