import React, { useState, useEffect } from 'react';
import { Vendor, Cart, User, IDProofType } from '../../types';
import { StorageService } from '../../services/storage';
import { onboardVendor } from '../../services/vendorsFirestore';
import { X, UserPlus, Camera, MapPin, Navigation, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, IndianRupee, Plus, Loader2 } from 'lucide-react';

interface VendorModalProps {
  currentUser: User;
  availableCarts: Cart[];
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_AREA_SUGGESTIONS = [
  { prefix: 'KKV', label: 'KKV Hall Area' },
  { prefix: 'CGR', label: 'CG Road Area' },
  { prefix: 'SKR', label: 'Sant Kabir Road' },
  { prefix: 'AMB', label: 'Ambawadi Market' },
  { prefix: 'VST', label: 'Vastrapur Lake' },
  { prefix: 'GEN', label: 'General / Other' }
];

export const VendorModal: React.FC<VendorModalProps> = ({
  currentUser,
  availableCarts,
  onClose,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');

  // Step 2: Contact
  const [phone, setPhone] = useState('+91 ');
  const [whatsAppPhone, setWhatsAppPhone] = useState('+91 ');
  const [sameAsRegularPhone, setSameAsRegularPhone] = useState(true);
  const [emergencyContact, setEmergencyContact] = useState('');

  // Step 3: Location & Area
  const [isCustomArea, setIsCustomArea] = useState(false);
  const [areaPrefix, setAreaPrefix] = useState('KKV');
  const [areaLandmark, setAreaLandmark] = useState('KKV Hall Area');
  const [customAreaName, setCustomAreaName] = useState('');
  const [customAreaPrefix, setCustomAreaPrefix] = useState('');
  const [address, setAddress] = useState('KKV Hall Circle, Kalawad Road');
  const [cartLat, setCartLat] = useState<number>(22.2905);
  const [cartLng, setCartLng] = useState<number>(70.7858);

  // Step 4: Cart Details
  const [cartNumber, setCartNumber] = useState('KKV-001');
  const [cartModel, setCartModel] = useState('Standard FastFood Cart V2');
  const [monthlyRent, setMonthlyRent] = useState(7000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextPayDate, setNextPayDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });

  // Step 5: Financial (Advance) & ID
  const [advanceRentPaid, setAdvanceRentPaid] = useState(7000);
  const [securityDeposit, setSecurityDeposit] = useState(15000);
  const [hasIdProof, setHasIdProof] = useState(false);
  const [idProofType, setIdProofType] = useState<IDProofType>('aadhaar');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [dpdpConsented, setDpdpConsented] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-fill WhatsApp phone when toggle changes
  useEffect(() => {
    if (sameAsRegularPhone) {
      setWhatsAppPhone(phone);
    }
  }, [sameAsRegularPhone, phone]);

  // Auto-increment Cart Number based on active Area Prefix
  useEffect(() => {
    const activePrefix = isCustomArea ? customAreaPrefix.toUpperCase() : areaPrefix;
    if (!activePrefix) return;

    const existingCarts = StorageService.getCarts();
    const matching = existingCarts.filter(c => c.cartNumber.startsWith(activePrefix));
    const nextNum = matching.length + 1;
    const formattedNum = `${activePrefix}-${String(nextNum).padStart(3, '0')}`;
    setCartNumber(formattedNum);

    if (!isCustomArea) {
      const matchArea = DEFAULT_AREA_SUGGESTIONS.find(a => a.prefix === areaPrefix);
      if (matchArea) setAreaLandmark(matchArea.label);
    } else {
      setAreaLandmark(customAreaName || 'Custom Area');
    }
  }, [areaPrefix, isCustomArea, customAreaPrefix, customAreaName]);

  const handleFetchCurrentGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCartLat(Number(pos.coords.latitude.toFixed(6)));
          setCartLng(Number(pos.coords.longitude.toFixed(6)));
        },
        () => {
          setCartLat(22.2905);
          setCartLng(70.7858);
        }
      );
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && (!firstName || !lastName)) return;
    if (currentStep === 2 && !phone) return;
    if (currentStep === 3 && !address) return;
    if (currentStep === 4 && !cartNumber) return;
    if (currentStep < 5) setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${firstName} ${lastName}`.trim();
    if (!firstName.trim() || !lastName.trim()) {
      alert('Please enter vendor first and last name in Step 1');
      setCurrentStep(1);
      return;
    }
    if (!phone.trim()) {
      alert('Please enter mobile number in Step 2');
      setCurrentStep(2);
      return;
    }

    const finalAreaPrefix = isCustomArea ? (customAreaPrefix.toUpperCase() || 'GEN') : areaPrefix;
    const finalAreaLandmark = isCustomArea ? (customAreaName || 'Custom Area') : areaLandmark;
    const finalCartNumber = cartNumber || `${finalAreaPrefix}-001`;

    setIsSaving(true);
    try {
      // 1. Save to StorageService immediately (Offline-First Guarantee — Instant Save)
      const vendorId = `v_${Date.now()}`;
      const cartId = `c_${Date.now()}`;

      const newCart: Cart = {
        id: cartId,
        cartNumber: finalCartNumber,
        areaPrefix: finalAreaPrefix,
        modelType: cartModel || 'Standard FastFood Cart V2',
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?auto=format&fit=crop&w=600&q=80',
        status: 'rented',
        currentLat: cartLat || 22.2905,
        currentLng: cartLng || 70.7858,
        lastLocationAddress: `${address || 'Stall Location'} (${finalAreaLandmark})`,
        lastLocationUpdateAt: new Date().toISOString(),
        lastUpdatedBy: currentUser.name
      };
      StorageService.saveCart(newCart, currentUser);

      const newVendor: Vendor = {
        id: vendorId,
        fullName,
        phone,
        whatsAppPhone: sameAsRegularPhone ? phone : (whatsAppPhone || phone),
        address: address || finalAreaLandmark,
        areaTag: finalAreaLandmark,
        emergencyContact,
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        idProofUrl: hasIdProof
          ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
          : '',
        idProofType: hasIdProof ? idProofType : 'aadhaar',
        idProofNumber: hasIdProof ? idProofNumber : '',
        joinDate: startDate || new Date().toISOString().split('T')[0],
        status: 'active',
        loyaltyScore: 100,
        securityDeposit: Number(securityDeposit) || 15000,
        advanceRent: Number(advanceRentPaid) || 7000,
        dpdpConsented,
        dpdpConsentDate: new Date().toISOString()
      };
      StorageService.saveVendor(newVendor, currentUser);

      StorageService.saveAgreement(
        {
          id: `ag_${Date.now()}`,
          vendorId,
          cartId,
          monthlyRent: Number(monthlyRent) || 7000,
          advanceRentPaid: Number(advanceRentPaid) || 7000,
          startDate: startDate || new Date().toISOString().split('T')[0],
          nextPayDate: nextPayDate || new Date().toISOString().split('T')[0],
          termMonths: 12,
          status: 'active'
        },
        currentUser
      );

      // 2. Non-blocking Cloud Sync (max 2.5s timeout so UI never hangs or freezes)
      Promise.race([
        onboardVendor({
          fullName,
          phone,
          whatsAppPhone: sameAsRegularPhone ? phone : (whatsAppPhone || phone),
          address: address || finalAreaLandmark,
          areaTag: finalAreaLandmark,
          emergencyContact,
          photoUrl,
          idProofUrl: hasIdProof ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80' : '',
          idProofType: hasIdProof ? idProofType : 'aadhaar',
          idProofNumber: hasIdProof ? idProofNumber : '',
          monthlyRent: Number(monthlyRent) || 7000,
          securityDeposit: Number(securityDeposit) || 15000,
          advanceRent: Number(advanceRentPaid) || 7000,
          zonePrefix: finalAreaPrefix,
          startDate: startDate || new Date().toISOString().split('T')[0],
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Cloud sync timeout')), 2500))
      ]).catch(fsErr => {
        console.warn('Firestore cloud sync pending (saved locally):', fsErr);
      });

      // Call onSuccess immediately to close modal and refresh state
      onSuccess();
    } catch (err) {
      console.error('Failed to onboard vendor:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Theme-aware helper classes
  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500`;

  const labelCls = `block font-bold text-xs mb-1.5 text-slate-600 dark:text-slate-300`;

  const sectionCls = `p-4 rounded-xl border bg-slate-50 border-slate-200 dark:bg-slate-950/80 dark:border-slate-800`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 backdrop-blur-sm animate-fade-in bg-black/30 dark:bg-slate-950/80">
      <div className="border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700/80">
        {/* Header & Stepper Indicator Bar */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-4 text-white shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              <h2 className="text-base font-black font-outfit">Vendor Onboarding</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 5-Step Stepper Progress Bar */}
          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold">
            {[1, 2, 3, 4, 5].map(step => (
              <div
                key={step}
                className={`py-1 rounded-md transition ${
                  currentStep === step
                    ? 'bg-white text-orange-600 shadow-md font-extrabold'
                    : currentStep > step
                    ? 'bg-orange-800/80 text-orange-200'
                    : 'bg-black/20 text-orange-200/60'
                }`}
              >
                Step {step}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* ===== STEP 1: Personal Info ===== */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-orange-400 uppercase text-[11px] tracking-wider">
                Step 1 of 5: Vendor Identity &amp; Photo
              </h3>

              {/* Photo Upload / Avatar Box */}
              <div className={`flex flex-col items-center justify-center p-4 rounded-xl border bg-slate-50 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700/80`}>
                <img
                  src={photoUrl}
                  alt="Vendor Avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-orange-500 shadow-lg mb-2"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPhotoUrl(
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition border bg-white hover:bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-slate-600"
                >
                  <Camera className="w-3.5 h-3.5 text-orange-400" />
                  <span>Take Photo / Upload Avatar</span>
                </button>
              </div>

              {/* First & Last Name — 2-column is fine for short names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Patel"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 2: Contact Info ===== */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-orange-400 uppercase text-[11px] tracking-wider">
                Step 2 of 5: Contact Numbers &amp; WhatsApp
              </h3>

              <div>
                <label className={labelCls}>Regular Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>

              {/* Same as Regular Phone Toggle */}
              <div className={`p-3 rounded-xl border space-y-2 bg-slate-50 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700/80`}>
                <label className={`flex items-center gap-2 cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-200`}>
                  <input
                    type="checkbox"
                    checked={sameAsRegularPhone}
                    onChange={e => setSameAsRegularPhone(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600"
                  />
                  <span>WhatsApp number is same as regular mobile</span>
                </label>

                {!sameAsRegularPhone && (
                  <div>
                    <label className={labelCls}>WhatsApp Number *</label>
                    <input
                      type="text"
                      required
                      value={whatsAppPhone}
                      onChange={e => setWhatsAppPhone(e.target.value)}
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Emergency Contact Person &amp; Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98250 99999 (Brother: Ramesh)"
                  value={emergencyContact}
                  onChange={e => setEmergencyContact(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* ===== STEP 3: Location & Area (MANUAL CREATION SUPPORT) ===== */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-orange-400 uppercase text-[11px] tracking-wider">
                Step 3 of 5: Area Tag &amp; GPS Coordinates
              </h3>

              {/* Area Mode Toggle */}
              <div className={sectionCls}>
                <div className="flex items-center gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setIsCustomArea(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold text-center transition border ${
                      !isCustomArea
                        ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                        : 'bg-white text-slate-500 border-slate-300 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    Select Existing Area
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCustomArea(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold text-center transition border flex items-center justify-center gap-1 ${
                      isCustomArea
                        ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                        : 'bg-white text-slate-500 border-slate-300 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    Create New Area
                  </button>
                </div>

                {/* Existing Area Dropdown */}
                {!isCustomArea && (
                  <div>
                    <label className={labelCls}>Select Operating Area Landmark *</label>
                    <select
                      value={areaPrefix}
                      onChange={e => setAreaPrefix(e.target.value)}
                      className={`${inputCls} cursor-pointer font-bold`}
                    >
                      {DEFAULT_AREA_SUGGESTIONS.map(a => (
                        <option key={a.prefix} value={a.prefix}>
                          {a.label} (Prefix: {a.prefix})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Custom Area Creation */}
                {isCustomArea && (
                  <div className="space-y-3">
                    <div className="p-2.5 rounded-lg border text-[11px] bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-300">
                      💡 <strong>Example:</strong> Type "Kalawad Road Market" as Area Name and "KRM" as Prefix → Cart IDs will auto-generate as KRM-001, KRM-002, etc.
                    </div>

                    <div>
                      <label className={labelCls}>Custom Area / Landmark Name *</label>
                      <input
                        type="text"
                        required={isCustomArea}
                        placeholder='e.g. "Kalawad Road Market" or "KKV Hall Circle"'
                        value={customAreaName}
                        onChange={e => setCustomAreaName(e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>3-Letter Area Prefix Code *</label>
                      <input
                        type="text"
                        required={isCustomArea}
                        maxLength={4}
                        placeholder="e.g. KRM"
                        value={customAreaPrefix}
                        onChange={e => setCustomAreaPrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                        className={`${inputCls} font-mono uppercase font-extrabold tracking-widest`}
                      />
                      <p className={`text-[10px] mt-1 text-slate-500 dark:text-slate-400`}>
                        Used for Cart ID generation (e.g. <strong>{customAreaPrefix || 'KRM'}-001</strong>)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Full Stall Address / Location Details *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KKV Hall Circle, Kalawad Road, Rajkot"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Manual Lat/Long + GPS Fetch Button */}
              <div className={sectionCls}>
                <div className="flex items-center justify-between mb-2">
                  <label className={`font-bold text-xs text-slate-600 dark:text-slate-300`}>
                    GPS Location (Free OSM)
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchCurrentGps}
                    className="text-[10px] font-bold text-orange-400 hover:underline flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" /> Fetch Live GPS
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Latitude"
                    value={cartLat}
                    onChange={e => setCartLat(Number(e.target.value))}
                    className={`${inputCls} font-mono text-xs`}
                  />
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Longitude"
                    value={cartLng}
                    onChange={e => setCartLng(Number(e.target.value))}
                    className={`${inputCls} font-mono text-xs`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 4: Cart Details (FIXED SINGLE-COLUMN MOBILE LAYOUT) ===== */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-bold text-orange-400 uppercase text-[11px] tracking-wider">
                Step 4 of 5: Cart Assignment &amp; Rent Dates
              </h3>

              <div className={`${sectionCls} space-y-4`}>
                {/* Cart ID */}
                <div>
                  <label className={labelCls}>Auto-Generated Area Cart ID *</label>
                  <input
                    type="text"
                    required
                    value={cartNumber}
                    onChange={e => setCartNumber(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border-2 font-mono font-extrabold text-sm uppercase focus:outline-none focus:ring-2 focus:ring-orange-500/40 bg-orange-50 border-orange-400 text-orange-700 dark:bg-slate-800 dark:border-orange-500/80 dark:text-orange-400`}
                  />
                  <span className={`text-[10px] mt-1 block text-slate-500 dark:text-slate-400`}>
                    Auto-incremented for area prefix: <strong>{isCustomArea ? customAreaPrefix : areaPrefix}</strong>
                  </span>
                </div>

                {/* Cart Model Type — FULL WIDTH */}
                <div>
                  <label className={labelCls}>Cart Model Type</label>
                  <input
                    type="text"
                    value={cartModel}
                    onChange={e => setCartModel(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Monthly Rent — FULL WIDTH */}
                <div>
                  <label className={labelCls}>Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    required
                    value={monthlyRent}
                    onChange={e => setMonthlyRent(Number(e.target.value))}
                    className={`${inputCls} font-bold`}
                  />
                </div>

                {/* Start Rent Date — FULL WIDTH */}
                <div>
                  <label className={labelCls}>Start Rent Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Next Payment Date — FULL WIDTH */}
                <div>
                  <label className={labelCls}>Next Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={nextPayDate}
                    onChange={e => setNextPayDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 5: Financial (Advance) & OPTIONAL ID Proof ===== */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="font-bold text-orange-400 uppercase text-[11px] tracking-wider">
                Step 5 of 5: Advance Rent &amp; Government ID Proof
              </h3>

              {/* Advance Rent Paid */}
              <div className={`${sectionCls} space-y-2`}>
                <label className="block font-bold text-emerald-400 mb-1 flex items-center gap-1.5 text-xs">
                  <IndianRupee className="w-4 h-4" /> Advance Rent Paid (Refundable Deposit) *
                </label>
                <input
                  type="number"
                  required
                  value={advanceRentPaid}
                  onChange={e => setAdvanceRentPaid(Number(e.target.value))}
                  className={`${inputCls} font-extrabold`}
                />
                <p className={`text-[10px] p-2 rounded-lg border text-slate-500 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-900 dark:border-slate-800`}>
                  ℹ️ <strong>Settlement Note:</strong> This advance will be deducted from the final settlement formula when the cart is returned.
                </p>
              </div>

              {/* Government ID — OPTIONAL with toggle */}
              <div className={`${sectionCls} space-y-3`}>
                <label className={`flex items-center gap-2 cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-200`}>
                  <input
                    type="checkbox"
                    checked={hasIdProof}
                    onChange={e => setHasIdProof(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600"
                  />
                  <span>Vendor provided Government ID Proof</span>
                </label>

                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  (Optional — skip if vendor denies to provide ID proof)
                </p>

                {hasIdProof && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className={labelCls}>ID Proof Type</label>
                      <select
                        value={idProofType}
                        onChange={e => setIdProofType(e.target.value as IDProofType)}
                        className={`${inputCls} cursor-pointer capitalize`}
                      >
                        <option value="aadhaar">Aadhaar Card</option>
                        <option value="pan">PAN Card</option>
                        <option value="voter_id">Voter ID</option>
                        <option value="driving_license">Driving License</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelCls}>ID Number</label>
                      <input
                        type="text"
                        placeholder="XXXX-XXXX-1234"
                        value={idProofNumber}
                        onChange={e => setIdProofNumber(e.target.value)}
                        className={`${inputCls} font-mono uppercase`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* DPDP Act Purpose Consent */}
              <div className="p-3 rounded-xl border bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30">
                <label className={`flex items-start gap-2 cursor-pointer font-semibold text-[11px] text-slate-700 dark:text-slate-200`}>
                  <input
                    type="checkbox"
                    required
                    checked={dpdpConsented}
                    onChange={e => setDpdpConsented(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-orange-600"
                  />
                  <span>
                    <strong>DPDP Act 2023 Consent:</strong> Vendor consents to personal data processing &amp; opt-in for automated WhatsApp receipts.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Controls Bar */}
          <div className={`flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800`}>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2.5 font-bold rounded-xl flex items-center gap-1.5 transition bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-xl flex items-center gap-1.5 shadow-lg shadow-orange-600/20 transition active:scale-95 ml-auto"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black rounded-xl shadow-xl shadow-orange-600/30 flex items-center gap-1.5 transition active:scale-95 ml-auto disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Onboarding</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
