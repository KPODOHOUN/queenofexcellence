"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Identifiants incorrects");
      setLoading(false);
    } else {
      window.location.href = "/admin";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0c0c] px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] rounded-full bg-gold/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Queen of Excellence"
            width={48}
            height={48}
            className="h-12 w-12 object-contain mx-auto mb-4"
          />
          <h1 className="font-serif text-2xl text-white mb-1">
            Queen of <span className="text-gold">Excellence</span>
          </h1>
          <p className="text-sm text-white/40">Administration</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-[#141414] border border-gold/10 p-8 rounded-2xl shadow-2xl shadow-black/40 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition-all"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-medium text-foreground gold-gradient rounded-xl disabled:opacity-50 shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
