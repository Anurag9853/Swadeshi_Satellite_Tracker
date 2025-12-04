import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await signup(form.name, form.email, form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-10 bg-white/10 backdrop-blur-xl rounded-lg border border-white/20">
      <h1 className="text-2xl font-bold text-white mb-6">Create an Account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Full Name"
          className="w-full p-3 rounded bg-white/5 border border-white/10 text-white"
          required
        />

        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full p-3 rounded bg-white/5 border border-white/10 text-white"
          required
        />

        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password (min 6 characters)"
          className="w-full p-3 rounded bg-white/5 border border-white/10 text-white"
          required
          minLength={6}
        />

        {error && <p className="text-red-400">{error}</p>}

        <button
          type="submit"
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded text-white font-semibold"
        >
          Sign Up
        </button>
      </form>

      <p className="text-slate-300 text-sm mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-cyan-400 hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
};

export default Signup;
