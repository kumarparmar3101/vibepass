import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ArrowLeft, CreditCard, Smartphone, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react';

export default function PaymentMethods() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [methods, setMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newMethod, setNewMethod] = useState({ type: 'Card', last4: '' });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchMethods();
  }, [user, navigate]);

  const fetchMethods = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const q = query(collection(db, 'payment_methods'), where('userId', '==', user.id));
      const querySnapshot = await getDocs(q);
      const fetchedMethods = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMethods(fetchedMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMethod.last4) return;

    setIsAdding(true);
    try {
      // In a real app, this is where you'd integrate Stripe/Razorpay tokenization
      // We are simulating adding a saved method
      const methodData = {
        userId: user.id,
        type: newMethod.type,
        last4: newMethod.last4.slice(-4), // Only store last 4
        isDefault: methods.length === 0, // Make default if it's the first one
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'payment_methods'), methodData);
      setMethods([...methods, { id: docRef.id, ...methodData }]);
      setNewMethod({ type: 'Card', last4: '' });
      showToast("Payment method added successfully");
    } catch (error) {
      console.error("Error adding payment method:", error);
      showToast("Failed to add payment method");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'payment_methods', id));
      setMethods(methods.filter(m => m.id !== id));
      showToast("Payment method removed");
    } catch (error) {
      console.error("Error deleting payment method:", error);
      showToast("Failed to remove payment method");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Set all to false
      const updatePromises = methods.map(m => 
        updateDoc(doc(db, 'payment_methods', m.id), { isDefault: m.id === id })
      );
      await Promise.all(updatePromises);
      
      setMethods(methods.map(m => ({ ...m, isDefault: m.id === id })));
      showToast("Default payment method updated");
    } catch (error) {
      console.error("Error setting default method:", error);
      showToast("Failed to update default method");
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  if (!user) return null;

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
          <h1 className="text-xl font-bold">Payment Methods</h1>
        </div>
      </header>

      <div className="p-4 space-y-8">
        {/* Saved Methods */}
        <section>
          <h2 className="text-lg font-bold mb-4">Saved Methods</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-vibe-primary" />
            </div>
          ) : methods.length === 0 ? (
            <div className="text-center py-8 bg-vibe-card rounded-2xl border border-white/5">
              <CreditCard className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">No payment methods saved yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {methods.map((method) => (
                <div key={method.id} className="bg-vibe-card rounded-2xl border border-white/5 p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
                      {method.type === 'Card' ? <CreditCard className="w-6 h-6 text-zinc-400" /> : <Smartphone className="w-6 h-6 text-zinc-400" />}
                    </div>
                    <div>
                      <p className="font-bold text-white">
                        {method.type} ending in {method.last4}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {method.isDefault && (
                          <span className="text-[10px] font-bold text-vibe-primary uppercase tracking-wider bg-vibe-primary/10 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                        {!method.isDefault && (
                          <button 
                            onClick={() => handleSetDefault(method.id)}
                            className="text-xs text-zinc-500 hover:text-white transition-colors"
                          >
                            Set as default
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(method.id)}
                    className="p-2 text-zinc-500 hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Add New Method */}
        <section>
          <h2 className="text-lg font-bold mb-4">Add New Method</h2>
          <form onSubmit={handleAddMethod} className="bg-vibe-card rounded-2xl border border-white/5 p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Method Type</label>
              <select
                value={newMethod.type}
                onChange={(e) => setNewMethod({ ...newMethod, type: e.target.value })}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-vibe-primary transition-colors appearance-none"
              >
                <option value="Card">Credit / Debit Card</option>
                <option value="UPI">UPI / Wallet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                {newMethod.type === 'Card' ? 'Card Number' : 'UPI ID'}
              </label>
              <input
                type="text"
                value={newMethod.last4}
                onChange={(e) => setNewMethod({ ...newMethod, last4: e.target.value })}
                placeholder={newMethod.type === 'Card' ? '**** **** **** 1234' : 'username@upi'}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-vibe-primary transition-colors"
                required
              />
              <p className="text-[10px] text-zinc-500 mt-2">
                For security, we only store a secure token and the last 4 digits.
              </p>
            </div>

            <button
              type="submit"
              disabled={isAdding || !newMethod.last4}
              className="w-full bg-zinc-800 text-white font-bold rounded-xl py-4 flex items-center justify-center space-x-2 hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {isAdding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Add Securely</span>
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
