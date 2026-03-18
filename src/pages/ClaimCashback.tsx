import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Instagram, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import axios from 'axios';

export default function ClaimCashback() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useStore();
  
  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState<string | null>(null);
  const [instagramHandle, setInstagramHandle] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [claimStatus, setClaimStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!id) return;
      try {
        const res = await axios.get(`/api/ugc/claims/${id}`);
        if (res.data && res.data.status !== 'eligible') {
          setClaimStatus(res.data);
          setStep(5); // Show status screen
        }
      } catch (err) {
        console.error('Failed to fetch claim status', err);
      } finally {
        setIsLoadingStatus(false);
      }
    };
    fetchStatus();
  }, [id]);

  const handleNext = () => {
    if (step === 1 && !contentType) {
      setError('Please select a content type');
      return;
    }
    if (step === 2) {
      if ((contentType === 'story' || contentType === 'story_highlight') && !instagramHandle) {
        setError('Please enter your Instagram handle');
        return;
      }
      if ((contentType === 'feed_post' || contentType === 'reel') && !postUrl) {
        setError('Please enter the post URL');
        return;
      }
    }
    setError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!user || !id) return;
    setIsSubmitting(true);
    setError('');

    try {
      const res = await axios.post('/api/ugc/claims', {
        userId: user.id,
        orderId: id,
        instagramHandle,
        contentType,
        postUrl
      });

      if (res.data.success) {
        setStep(4); // Success step
      } else {
        throw new Error(res.data.error || 'Failed to submit claim');
      }
    } catch (err: any) {
      console.error('Error submitting claim:', err);
      setError(err.response?.data?.error || err.message || 'Failed to submit claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-vibe-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-24">
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors border border-white/5 mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Claim Cashback</h1>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto">
        {/* Progress Bar */}
        {step < 4 && (
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? 'bg-vibe-primary text-black' : 'bg-zinc-900 text-zinc-500 border border-white/10'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-1 mx-2 rounded-full ${
                    step > s ? 'bg-vibe-primary' : 'bg-zinc-900'
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black mb-2">What did you post?</h2>
                <p className="text-zinc-400">Select the type of content you posted on Instagram.</p>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'story', label: 'Story', amount: 50, desc: 'Must tag @VibePassIndia' },
                  { id: 'story_highlight', label: 'Story + Highlight', amount: 100, desc: 'Keep it on your profile for 24h+' },
                  { id: 'feed_post', label: 'Feed Post', amount: 100, desc: 'Tag @VibePassIndia in caption' },
                  { id: 'reel', label: 'Reel', amount: 150, desc: 'Tag @VibePassIndia in caption' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setContentType(type.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      contentType === type.id 
                        ? 'bg-vibe-primary/10 border-vibe-primary' 
                        : 'bg-zinc-900 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white">{type.label}</span>
                      <span className="font-black text-emerald-400">₹{type.amount}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{type.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black mb-2">Verify your post</h2>
                <p className="text-zinc-400">
                  {(contentType === 'story' || contentType === 'story_highlight') 
                    ? "Enter your Instagram handle so we can verify your story." 
                    : "Paste the link to your post so we can verify it."}
                </p>
              </div>

              {(contentType === 'story' || contentType === 'story_highlight') ? (
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2">Instagram Handle</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">@</span>
                    <input
                      type="text"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      placeholder="username"
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white focus:outline-none focus:border-vibe-primary transition-colors"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Make sure your profile is public so we can see the story.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2">Post URL</label>
                  <input
                    type="url"
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    placeholder="https://instagram.com/p/..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-vibe-primary transition-colors"
                  />
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black mb-2">Review & Submit</h2>
                <p className="text-zinc-400">Please review your details before submitting.</p>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4 border border-white/5 space-y-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Content Type</p>
                  <p className="font-bold text-white capitalize">{contentType?.replace('_', ' ')}</p>
                </div>
                {(contentType === 'story' || contentType === 'story_highlight') ? (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Instagram Handle</p>
                    <p className="font-bold text-white">@{instagramHandle}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Post URL</p>
                    <p className="font-bold text-white truncate">{postUrl}</p>
                  </div>
                )}
                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Expected Cashback</p>
                  <p className="text-2xl font-black text-emerald-400">
                    ₹{contentType === 'reel' ? 150 : contentType === 'story' ? 50 : 100}
                  </p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-200 leading-relaxed">
                  Verification usually takes a few minutes but can take up to 24 hours. You'll receive a notification once approved.
                </p>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black mb-2">Claim Submitted!</h2>
              <p className="text-zinc-400 mb-8">
                We're verifying your post. We'll notify you once the cashback is credited to your wallet.
              </p>
              <button
                onClick={() => navigate('/wallet')}
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-colors border border-white/10"
              >
                Back to Wallet
              </button>
            </motion.div>
          )}

          {step === 5 && claimStatus && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center py-8">
                {claimStatus.status === 'approved' || claimStatus.status === 'paid' ? (
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                ) : claimStatus.status === 'rejected' ? (
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                  </div>
                )}
                
                <h2 className="text-2xl font-black mb-2 capitalize">
                  {claimStatus.status === 'verifying' ? 'Verifying...' : claimStatus.status}
                </h2>
                <p className="text-zinc-400">
                  {claimStatus.status === 'approved' || claimStatus.status === 'paid' 
                    ? `₹${claimStatus.cashbackAmount} has been credited to your wallet!` 
                    : claimStatus.status === 'rejected' 
                    ? claimStatus.rejectionReason || 'Your post did not meet the requirements.'
                    : 'We are currently verifying your post. This usually takes a few minutes.'}
                </p>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4 border border-white/5 space-y-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Content Type</p>
                  <p className="font-bold text-white capitalize">{claimStatus.contentType?.replace('_', ' ')}</p>
                </div>
                {claimStatus.instagramHandle ? (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Instagram Handle</p>
                    <p className="font-bold text-white">@{claimStatus.instagramHandle}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Post URL</p>
                    <p className="font-bold text-white truncate">{claimStatus.postUrl}</p>
                  </div>
                )}
                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Expected Cashback</p>
                  <p className="text-2xl font-black text-emerald-400">₹{claimStatus.cashbackAmount}</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/wallet')}
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-colors border border-white/10"
              >
                Back to Wallet
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
        )}

        {step < 4 && (
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-6 py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-colors border border-white/10"
              >
                Back
              </button>
            )}
            <button
              onClick={step === 3 ? handleSubmit : handleNext}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-vibe-primary text-black font-bold rounded-2xl hover:bg-vibe-primary-hover transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : step === 3 ? (
                'Submit Claim'
              ) : (
                'Continue'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
