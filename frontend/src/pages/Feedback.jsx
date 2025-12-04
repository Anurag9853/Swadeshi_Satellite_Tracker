import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiStar, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import api from '../services/api';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

const initialForm = {
  name: '',
  email: '',
  message: '',
  rating: 5,
};

const Feedback = () => {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'rating' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');
    try {
      await api.post('/feedback', form);
      setStatus('Thank you! Your feedback uplinks our mission.');
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to send feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="mx-auto max-w-7xl px-8 py-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title="Mission Feedback"
        subtitle="Share ideas to improve Swadeshi space awareness tools"
      />

      <Card variant="large">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Name Field */}
            <div className="relative">
              <label
                htmlFor="name"
                className={`absolute left-4 transition-all duration-200 ${
                  focused === 'name' || form.name
                    ? 'top-2 text-xs text-cyan-400'
                    : 'top-4 text-sm text-slate-400'
                }`}
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused('')}
                required
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 pt-6 pb-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Email Field */}
            <div className="relative">
              <label
                htmlFor="email"
                className={`absolute left-4 transition-all duration-200 ${
                  focused === 'email' || form.email
                    ? 'top-2 text-xs text-cyan-400'
                    : 'top-4 text-sm text-slate-400'
                }`}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                required
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 pt-6 pb-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Message Field */}
          <div className="relative">
            <label
              htmlFor="message"
              className={`absolute left-4 transition-all duration-200 ${
                focused === 'message' || form.message
                  ? 'top-2 text-xs text-cyan-400'
                  : 'top-4 text-sm text-slate-400'
              }`}
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={form.message}
              onChange={handleChange}
              onFocus={() => setFocused('message')}
              onBlur={() => setFocused('')}
              required
              rows={6}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 pt-6 pb-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Rating Field */}
          <div>
            <label className="block text-sm text-slate-400 mb-3">
              Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleChange({ target: { name: 'rating', value: star } })}
                  className="focus:outline-none"
                >
                  <HiStar
                    size={32}
                    className={`transition-colors ${
                      star <= form.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-4 text-slate-300 font-medium">
                {form.rating}/5
              </span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            className="w-full"
          >
            Send Feedback
          </Button>

          {/* Toast Notifications */}
          <AnimatePresence>
            {status && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-3 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400"
              >
                <HiCheckCircle size={24} />
                <p>{status}</p>
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400"
              >
                <HiXCircle size={24} />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
        </Card>
      </div>
    </motion.div>
  );
};

export default Feedback;
