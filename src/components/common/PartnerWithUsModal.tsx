import React, { useState } from 'react';
import { X, Building2, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { StorageService } from '../../services/storage';
import { PartnerLeadService } from '../../services/firestore';

interface PartnerWithUsModalProps {
  onClose: () => void;
}

export const PartnerWithUsModal: React.FC<PartnerWithUsModalProps> = ({ onClose }) => {
  const [agencyName, setAgencyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [requirement, setRequirement] = useState<'ERP' | 'Website' | 'Mobile App' | 'Custom Solution'>('ERP');
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName || !fullName || !phone) return;

    setIsSaving(true);
    try {
      // Firestore (primary)
      await PartnerLeadService.create({
        agencyName,
        fullName,
        email,
        phone,
        requirement,
        createdAt: new Date().toISOString(),
      });

      // localStorage (offline cache)
      StorageService.savePartnerLead({
        agencyName,
        fullName,
        email,
        phone,
        requirement
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Failed to save partner lead to Firestore:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <h2 className="text-lg font-black font-outfit">Partner with Us</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <h3 className="font-extrabold text-white text-lg">Inquiry Submitted!</h3>
            <p className="text-xs text-slate-300">
              Thank you for reaching out! Our enterprise development team will contact you shortly on <strong>{phone}</strong>.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-xl transition text-xs"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs text-slate-300">
            <p className="text-[11px] text-slate-400">
              Want a custom Food Cart ERP, Mobile App, or Web System for your franchise or fleet? Submit your request below:
            </p>

            <div>
              <label className="block font-bold text-slate-200 mb-1">Agency / Enterprise Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Royal Food Cart Fleet Pvt Ltd"
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-200 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-200 mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-200 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="e.g. contact@royalfoodcarts.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-200 mb-1">Requirement Category</label>
              <select
                value={requirement}
                onChange={e => setRequirement(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="ERP">Custom Cart ERP Software</option>
                <option value="Mobile App">Dedicated Android / iOS App</option>
                <option value="Website">Franchise &amp; Vendor Website</option>
                <option value="Custom Solution">Full Suite Enterprise Build</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold py-3 rounded-xl shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 transition active:scale-95 text-xs disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Enterprise Request</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
