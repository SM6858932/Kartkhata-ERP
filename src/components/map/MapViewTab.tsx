import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { User, Vendor, Cart, RentAgreement, Payment } from '../../types';
import { calculateVendorLedger } from '../../utils/ledger';
import { StorageService } from '../../services/storage';
import { MapPin, Navigation, Crosshair, Phone, ShieldCheck, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { iconPaid, iconPending } from './CartMarkerIcon';

interface MapViewTabProps {
  currentUser: User;
  vendors: Vendor[];
  carts: Cart[];
  agreements: RentAgreement[];
  payments: Payment[];
  onSelectVendorToCollect: (vendorId: string) => void;
  onRefreshData: () => void;
}

export const MapViewTab: React.FC<MapViewTabProps> = ({
  currentUser,
  vendors,
  carts,
  agreements,
  payments,
  onSelectVendorToCollect,
  onRefreshData
}) => {
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [manualLat, setManualLat] = useState<number>(23.0225);
  const [manualLng, setManualLng] = useState<number>(72.5714);
  const [manualAddress, setManualAddress] = useState('');

  // Default Map Center (Ahmedabad Market Hub)
  const defaultCenter: [number, number] = [23.0225, 72.5714];

  const handleOpenUpdateModal = (cart: Cart) => {
    setSelectedCart(cart);
    setManualLat(cart.currentLat);
    setManualLng(cart.currentLng);
    setManualAddress(cart.lastLocationAddress);
    setIsUpdatingLocation(true);
  };

  const handleUseCurrentGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setManualLat(pos.coords.latitude);
          setManualLng(pos.coords.longitude);
          setManualAddress(`GPS Loc: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        err => {
          // Fallback simulation with slight offset
          if (selectedCart) {
            const simulatedLat = selectedCart.currentLat + 0.002;
            const simulatedLng = selectedCart.currentLng + 0.002;
            setManualLat(simulatedLat);
            setManualLng(simulatedLng);
            setManualAddress('On-site Field GPS (Simulated)');
          }
        }
      );
    }
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCart) return;

    StorageService.updateCartLocation(selectedCart.id, manualLat, manualLng, manualAddress, currentUser);
    setIsUpdatingLocation(false);
    setSelectedCart(null);
    onRefreshData();
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Map Header Controls */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div>
          <h2 className="font-extrabold text-lg text-white font-outfit flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Food Cart Live GPS Map
          </h2>
          <p className="text-xs text-slate-400">
            Real-time operational cart locations. Click any cart pin to view details or update GPS.
          </p>
        </div>

        {/* Legend Pills */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Paid
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> Pending
          </span>
        </div>
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="h-[520px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl relative">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {carts.map(cart => {
            const agreement = agreements.find(a => a.cartId === cart.id && a.status === 'active');
            const vendor = agreement ? vendors.find(v => v.id === agreement.vendorId) : undefined;
            const summary = vendor ? calculateVendorLedger(vendor, agreements, carts, payments) : undefined;

            const isPaid = summary?.paymentStatus === 'paid_full';
            const markerIcon = isPaid ? iconPaid : iconPending;

            return (
              <Marker key={cart.id} position={[cart.currentLat, cart.currentLng]} icon={markerIcon}>
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 max-w-xs space-y-2 text-slate-900 font-sans">
                    <div className="flex items-center justify-between border-b pb-1">
                      <strong className="text-sm font-bold text-orange-700">{cart.cartNumber}</strong>
                      <span className="text-[10px] font-mono bg-slate-200 px-1.5 py-0.5 rounded">
                        {cart.modelType}
                      </span>
                    </div>

                    {vendor && summary ? (
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-slate-800">{vendor.fullName}</p>
                        <p className="text-slate-600 font-mono">📱 {vendor.phone}</p>
                        <p className="text-slate-600">📍 {cart.lastLocationAddress}</p>
                        <div className="pt-1 flex items-center justify-between font-bold">
                          <span>Total Due:</span>
                          <span className={summary.balanceRemaining > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                            ₹{summary.currentTotalDue.toLocaleString()} ({summary.paymentStatus.toUpperCase()})
                          </span>
                        </div>

                        <div className="pt-2 flex gap-1">
                          <button
                            onClick={() => onSelectVendorToCollect(vendor.id)}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-1 px-2 rounded text-[11px] text-center"
                          >
                            Collect Rent
                          </button>
                          <button
                            onClick={() => handleOpenUpdateModal(cart)}
                            className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-1 px-2 rounded text-[11px]"
                          >
                            Update GPS
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">
                        <p>Status: {cart.status.toUpperCase()}</p>
                        <p>Address: {cart.lastLocationAddress}</p>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Modal for Collector On-Site Location Update */}
      {isUpdatingLocation && selectedCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-orange-400" />
                Update GPS — {selectedCart.cartNumber}
              </h3>
              <button
                onClick={() => setIsUpdatingLocation(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-3">
              {/* Use Current Device GPS Button */}
              <button
                type="button"
                onClick={handleUseCurrentGps}
                className="w-full bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <Navigation className="w-4 h-4" />
                <span>Acquire On-Site GPS Coordinates</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={manualLat}
                    onChange={e => setManualLat(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={manualLng}
                    onChange={e => setManualLng(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Street Landmark / Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navrangpura Market, Ahmedabad"
                  value={manualAddress}
                  onChange={e => setManualAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsUpdatingLocation(false)}
                  className="flex-1 bg-slate-800 text-slate-300 font-semibold text-xs py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-orange-600/30"
                >
                  Save New Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
