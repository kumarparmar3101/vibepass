import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, MessageSquare, FileText, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  {
    question: "How do I cancel my booking?",
    answer: "You can cancel your booking up to 4 hours before the showtime from the 'My Bookings' section in your profile. A cancellation fee may apply depending on the venue's policy."
  },
  {
    question: "Where can I find my tickets?",
    answer: "Your tickets are available in the 'Wallet' section of the app. You will also receive a copy via email and SMS."
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept all major credit/debit cards, UPI, Net Banking, and popular mobile wallets."
  },
  {
    question: "I haven't received my refund yet.",
    answer: "Refunds typically take 5-7 business days to reflect in your original payment method. If it has been longer, please raise a ticket below."
  }
];

export default function Support() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketData, setTicketData] = useState({
    category: 'Booking Issue',
    description: ''
  });
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticketData.description.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        userId: user.id,
        category: ticketData.category,
        description: ticketData.description,
        status: 'Open',
        createdAt: serverTimestamp()
      });

      setToast("Ticket submitted successfully. We'll get back to you soon.");
      setTicketData({ ...ticketData, description: '' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error("Error submitting ticket:", error);
      setToast("Failed to submit ticket. Please try again.");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-vibe-bg text-zinc-50 pb-24 relative"
    >
      <header className="sticky top-0 z-40 bg-vibe-bg/80 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="px-4 py-4 flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Help & Support</h1>
        </div>
      </header>

      <div className="p-4 space-y-8">
        {/* FAQs */}
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-5 h-5 text-vibe-primary" />
            <h2 className="text-lg font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="bg-vibe-card rounded-2xl border border-white/5 overflow-hidden">
            {FAQS.map((faq, index) => (
              <div key={index} className={`border-b border-white/5 last:border-0`}>
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-medium text-zinc-200">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-zinc-500 flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-500 flex-shrink-0 ml-4" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="p-4 pt-0 text-sm text-zinc-400 leading-relaxed bg-white/5">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Raise a Ticket */}
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="w-5 h-5 text-vibe-primary" />
            <h2 className="text-lg font-bold">Raise a Ticket</h2>
          </div>
          <form onSubmit={handleSubmitTicket} className="bg-vibe-card rounded-2xl border border-white/5 p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Category</label>
              <select
                value={ticketData.category}
                onChange={(e) => setTicketData({ ...ticketData, category: e.target.value })}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-vibe-primary transition-colors appearance-none"
              >
                <option value="Booking Issue">Booking Issue</option>
                <option value="Payment Failure">Payment Failure</option>
                <option value="Refund Status">Refund Status</option>
                <option value="Account Settings">Account Settings</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Description</label>
              <textarea
                value={ticketData.description}
                onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                rows={4}
                placeholder="Please describe your issue in detail..."
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-vibe-primary transition-colors resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !ticketData.description.trim()}
              className="w-full bg-vibe-primary text-white font-bold rounded-xl py-4 flex items-center justify-center space-x-2 hover:bg-vibe-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-6 py-3 rounded-full shadow-2xl shadow-black/50 border border-white/10 z-50 whitespace-nowrap text-sm font-medium"
        >
          {toast}
        </motion.div>
      )}
    </motion.div>
  );
}
