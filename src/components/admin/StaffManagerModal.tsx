import React, { useState } from 'react';
import { User, Vendor } from '../../types';
import { StorageService } from '../../services/storage';
import { AdminApiService } from '../../services/adminApi';
import { X, UserCheck, Plus, Trash2, Smartphone, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';

interface StaffManagerModalProps {
    currentUser: User;
    vendors: Vendor[];
    onClose: () => void;
    onRefresh: () => void;
}

export const StaffManagerModal: React.FC<StaffManagerModalProps> = ({
    currentUser,
    vendors,
    onClose,
    onRefresh
}) => {
    const users = StorageService.getUsers();
    const staffList = users.filter(u => u.role === 'collector');

    const [isAddingNew, setIsAddingNew] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('+91 ');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);

    const handleToggleVendorSelect = (vId: string) => {
        if (selectedVendorIds.includes(vId)) {
            setSelectedVendorIds(selectedVendorIds.filter(id => id !== vId));
        } else {
            setSelectedVendorIds([...selectedVendorIds, vId]);
        }
    };

    const handleAddStaffSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone || !password) return;

        setIsSaving(true);
        try {
            const result = await AdminApiService.createStaff({
                name,
                phone,
                email: email || `${name.toLowerCase().replace(/\s+/g, '')}@cartkhata.com`,
                password,
                role: 'collector',
                assignedVendorIds: selectedVendorIds,
                companyId: currentUser.companyId || ''
            });

            if (!result.success) {
                throw new Error(result.error || 'Admin API unavailable, saving locally only');
            }


            // localStorage (offline cache fallback)
            StorageService.saveUser({
                id: result.data?.uid || `usr_collector_${Date.now()}`,
                name,
                phone,
                email: email || `${name.toLowerCase().replace(/\s+/g, '')}@cartkhata.com`,
                role: 'collector',
                active: true,
                assignedVendorIds: selectedVendorIds
            }, currentUser);

            setIsAddingNew(false);
            setName('');
            setPhone('+91 ');
            setPassword('');
            setSelectedVendorIds([]);
            onRefresh();
        } catch (err) {
            console.error('Staff creation failed, saved locally only:', err);

            // Fallback: save locally even if Admin API is unavailable
            StorageService.saveUser({
                id: `usr_collector_${Date.now()}`,
                name,
                phone,
                email: email || `${name.toLowerCase().replace(/\s+/g, '')}@cartkhata.com`,
                role: 'collector',
                active: true,
                assignedVendorIds: selectedVendorIds
            }, currentUser);

            setIsAddingNew(false);
            setName('');
            setPhone('+91 ');
            setPassword('');
            setSelectedVendorIds([]);
            onRefresh();
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteStaff = async (staffId: string) => {
        if (window.confirm('Are you sure you want to delete this Field Staff account?')) {
            try {
                await AdminApiService.disableStaff(staffId);
            } catch (err) {
                console.error('Admin API unavailable, disabling locally:', err);
            }
            StorageService.deleteUser(staffId, currentUser);
            onRefresh();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-4 flex items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5" />
                        <h2 className="text-lg font-black font-outfit">Field Staff Accounts Management</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                    {/* Header Action: Add Staff */}
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-sm">Active Field Staff ({staffList.length})</h3>
                        <div className="flex items-center gap-2">
                            <a
                                href="https://cartkhata-admin.vercel.app"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold flex items-center gap-1 underline"
                            >
                                <ExternalLink className="w-3 h-3" />
                                Admin Panel
                            </a>
                            <button
                                onClick={() => setIsAddingNew(!isAddingNew)}
                                className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 transition"
                            >
                                <Plus className="w-4 h-4" />
                                <span>{isAddingNew ? 'Cancel' : 'Create Staff Login'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Form to Add New Staff */}
                    {isAddingNew && (
                        <form onSubmit={handleAddStaffSubmit} className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
                            <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider">New Staff Credentials</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block font-semibold text-slate-300 mb-1">Staff Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Anil Kumar"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white text-xs px-2.5 py-2 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-300 mb-1">Mobile Phone *</label>
                                    <input
                                        type="text"
                                        required
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white text-xs px-2.5 py-2 rounded-xl font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-300 mb-1">Login Password / PIN *</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="e.g. staff123"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs px-2.5 py-2 rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-300 mb-1">Assign Food Carts / Vendors</label>
                                <div className="space-y-1 max-h-28 overflow-y-auto bg-slate-900 p-2 rounded-xl border border-slate-800">
                                    {vendors.map(v => (
                                        <label key={v.id} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedVendorIds.includes(v.id)}
                                                onChange={() => handleToggleVendorSelect(v.id)}
                                                className="rounded text-orange-600 bg-slate-800 border-slate-700"
                                            />
                                            <span>{v.fullName} ({v.phone})</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Save &amp; Generate Credentials</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* List of Existing Field Staff */}
                    <div className="space-y-2">
                        {staffList.map(staff => (
                            <div key={staff.id} className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-sky-400" />
                                        <h4 className="font-bold text-white text-xs">{staff.name}</h4>
                                    </div>
                                    <p className="text-slate-400 font-mono text-[11px] mt-0.5">📱 {staff.phone}</p>
                                    <p className="text-slate-500 text-[10px] mt-0.5">
                                        Assigned: {staff.assignedVendorIds.length} Carts
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleDeleteStaff(staff.id)}
                                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
