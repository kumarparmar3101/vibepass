import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, CreditCard, Smartphone, Gift, Monitor, Clock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function Payment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cart, setCart, user } = useStore();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = cart.total || 0;

  const handlePay = async (method: string) => {
    if (!user) {
      alert("Please login to continue");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Simulate payment gateway interaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create order in Firebase
      const orderData = {
        userId: user.id,
        eventId: cart.eventId || id || 'unknown',
        seats: cart.seats && cart.seats.length > 0 ? cart.seats : ['General Admission'],
        totalAmount: totalAmount,
        ticketPrice: cart.ticketPrice || 0,
        convenienceFee: cart.convenienceFee || 0,
        donation: cart.donation || 0,
        status: 'confirmed',
        paymentMethod: method,
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Navigate to ticket page
      setIsProcessing(false);
      navigate(`/ticket/${encodeURIComponent(id || '')}`);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Payment failed. Please try again.");
      setIsProcessing(false);
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  const renderPaymentContent = () => {
    switch (activeTab) {
      case 'upi':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100 mt-4"
          >
            <div className="flex items-center mb-4">
              <button onClick={() => setActiveTab(null)} className="mr-2"><ArrowLeft className="w-5 h-5" /></button>
              <h2 className="text-lg font-medium text-zinc-900">Pay by any UPI App</h2>
            </div>
            <div className="space-y-4">
              {['Google Pay', 'Navi', 'POP UPI', 'PhonePe'].map((app) => (
                <button
                  key={app}
                  onClick={() => handlePay(`UPI - ${app}`)}
                  className="w-full flex items-center justify-between p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center mr-3">
                      <Smartphone className="w-4 h-4 text-zinc-600" />
                    </div>
                    <span className="font-medium text-zinc-900">{app}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400" />
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 'card':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100 mt-4"
          >
            <div className="flex items-center mb-4">
              <button onClick={() => setActiveTab(null)} className="mr-2"><ArrowLeft className="w-5 h-5" /></button>
              <h2 className="text-lg font-medium text-zinc-900">Add credit/debit/ATM card</h2>
            </div>
            <p className="text-sm text-zinc-600 mb-4">Please enter your credit/debit card number.</p>
            <div className="space-y-4">
              <input type="text" placeholder="Credit/debit card number" className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500" />
              <div className="flex space-x-4">
                <input type="text" placeholder="MM/YY" className="w-1/2 p-3 border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500" />
                <input type="text" placeholder="CVV" className="w-1/2 p-3 border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500" />
              </div>
              <input type="text" placeholder="Card holder name" className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500" />
              
              <label className="flex items-start space-x-2 mt-4">
                <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-[#f84464] rounded border-zinc-300 focus:ring-[#f84464]" />
                <span className="text-sm text-zinc-700">
                  Save your card as per the new RBI guidelines. <span className="text-blue-600">Learn more</span>
                </span>
              </label>

              <button
                onClick={() => handlePay('Credit/Debit Card')}
                disabled={isProcessing}
                className="w-full bg-zinc-600 text-white py-3 rounded-lg font-medium mt-6"
              >
                {isProcessing ? 'Processing...' : `Pay ₹${totalAmount.toFixed(2)}`}
              </button>
            </div>
          </motion.div>
        );
      case 'netbanking':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100 mt-4"
          >
            <div className="flex items-center mb-4">
              <button onClick={() => setActiveTab(null)} className="mr-2"><ArrowLeft className="w-5 h-5" /></button>
              <h2 className="text-lg font-medium text-zinc-900">Net Banking</h2>
            </div>
            <div className="mb-4">
              <input type="text" placeholder="Search by Bank Name" className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none" />
            </div>
            
            <h3 className="text-sm font-medium text-zinc-500 mb-2">Popular Banks</h3>
            <div className="space-y-2 mb-6">
              {['SBI Bank', 'HDFC Bank', 'ICICI Bank', 'AXIS Bank'].map((bank) => (
                <button
                  key={bank}
                  onClick={() => handlePay(`Net Banking - ${bank}`)}
                  className="w-full flex items-center p-3 border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center mr-3">
                    <Monitor className="w-4 h-4 text-zinc-600" />
                  </div>
                  <span className="font-medium text-zinc-900">{bank}</span>
                </button>
              ))}
            </div>

            <h3 className="text-sm font-medium text-zinc-500 mb-2">Other Banks</h3>
            <div className="space-y-2">
              {['Kotak Bank', 'Bank of India', 'Bank of Maharashtra', 'Central Bank of India'].map((bank) => (
                <button
                  key={bank}
                  onClick={() => handlePay(`Net Banking - ${bank}`)}
                  className="w-full flex items-center p-3 border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center mr-3">
                    <Monitor className="w-4 h-4 text-zinc-600" />
                  </div>
                  <span className="font-medium text-zinc-900">{bank}</span>
                </button>
              ))}
            </div>
          </motion.div>
        );
      default:
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Preferred Payments */}
            <div>
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-2">Preferred Payments</h3>
              <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
                <button 
                  onClick={() => handlePay('UPI - CRED')}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-3 shrink-0">
                      <span className="text-white text-xs font-bold">CRED</span>
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-zinc-900">CRED UPI</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">Get assured cashback upto ₹200 on this transaction, T&Cs apply</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 shrink-0 ml-2" />
                </button>
              </div>
            </div>

            {/* Other Payment Options */}
            <div>
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-2">Other Payment Options</h3>
              <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden divide-y divide-zinc-100">
                <button 
                  onClick={() => setActiveTab('upi')}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Smartphone className="w-5 h-5 text-zinc-600 mr-3" />
                    <span className="font-medium text-zinc-900">Pay by any UPI App</span>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('card')}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-zinc-600 mr-3" />
                    <span className="font-medium text-zinc-900">Debit/Credit Card</span>
                  </div>
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center">
                    <Smartphone className="w-5 h-5 text-green-600 mr-3" />
                    <span className="font-medium text-zinc-900">Mobile Wallets</span>
                  </div>
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center">
                    <Gift className="w-5 h-5 text-pink-500 mr-3" />
                    <span className="font-medium text-zinc-900">Gift Voucher</span>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('netbanking')}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Monitor className="w-5 h-5 text-zinc-600 mr-3" />
                    <span className="font-medium text-zinc-900">Net Banking</span>
                  </div>
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-zinc-600 mr-3" />
                    <span className="font-medium text-zinc-900">Pay Later</span>
                  </div>
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center">
                    <div className="w-5 h-5 border border-orange-500 text-orange-500 rounded flex items-center justify-center text-[10px] font-bold mr-3">123</div>
                    <span className="font-medium text-zinc-900">Redeem Points</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer Notes */}
            <div className="px-2 pt-4 pb-8">
              <div className="flex justify-center mb-6">
                <div className="flex items-center justify-center w-24 h-24 rounded-full border border-zinc-200 bg-white">
                  <div className="text-center">
                    <ShieldCheck className="w-6 h-6 text-zinc-400 mx-auto mb-1" />
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block">100% Secure</span>
                  </div>
                </div>
              </div>
              <h4 className="text-sm font-medium text-zinc-500 mb-2">Note</h4>
              <ol className="list-decimal pl-4 space-y-2 text-xs text-zinc-500">
                <li>Registrations/Tickets once booked can't be exchanged, cancelled or refunded.</li>
                <li>If booked via Credit/Debit Card, the card holder must be present at the ticket counter while collecting the ticket(s).</li>
              </ol>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-[#f5f5f5] text-zinc-900 font-sans"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 pt-safe">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => {
              if (activeTab) setActiveTab(null);
              else navigate(-1);
            }}
            className="w-8 h-8 flex items-center justify-center text-zinc-700 mr-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-medium text-zinc-900">Payment</h1>
        </div>
      </header>

      {/* Amount Payable */}
      <div className="bg-[#fffdf5] border-b border-dashed border-zinc-300 p-4 flex justify-between items-center">
        <span className="text-sm font-medium text-zinc-700">Amount Payable</span>
        <span className="text-lg font-bold text-zinc-900">₹{totalAmount.toFixed(2)}</span>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {renderPaymentContent()}
        </AnimatePresence>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-zinc-200 border-t-[#f84464] rounded-full animate-spin mb-4"></div>
            <p className="font-medium text-zinc-900">Processing Payment...</p>
            <p className="text-sm text-zinc-500 mt-1">Please do not close this window</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
