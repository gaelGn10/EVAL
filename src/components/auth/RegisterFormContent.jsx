import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AUTH_URL } from "../../lib/const";

const RegisterFormContent = () => {
    const [form, setForm] = useState({ name: "", email: "", birthday: "" });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const body = {
                name: form.name,
                email: form.email,
                birthday: form.birthday || null,
            };

            const res = await fetch(`${AUTH_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || "Inscription échouée");
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
        <div className="flex flex-col items-center justify-center flex-1 w-full max-md mx-auto">
            <div className="card bg-base-100 shadow-xl w-full">
                <div className="card-body">
                    <h2 className="card-title font-is-b text-2xl mb-4">Inscription</h2>

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
                                name="name"
                                placeholder="Votre nom"
                                className="input input-bordered w-full"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-inter-m">Email</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="votre@email.com"
                                className="input input-bordered w-full"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-inter-m">Date de naissance</span>
                            </label>
                            <input
                                type="date"
                                name="birthday"
                                className="input input-bordered w-full"
                                value={form.birthday}
                                onChange={handleChange}
                            />
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary w-full ${loading ? "loading" : ""}`}
                            disabled={loading}
                        >
                            {loading ? "Inscription..." : "S'inscrire"}
                        </button>
                    </form>

                    <div className="divider">OU</div>

                    <Link to="/login" className="btn btn-outline btn-sm w-full">
                        Déjà un compte ? Se connecter
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterFormContent;
