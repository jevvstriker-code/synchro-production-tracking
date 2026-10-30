'use client';

import React, { useState } from 'react';
import { assemblyLineService } from '@/services/assemblyLineService';
import { useAuth } from '@/components/AuthContext';
import { X, Plus, ShieldCheck, Factory } from 'lucide-react';

interface AddAssemblyLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingCount: number;
}

export function AddAssemblyLineModal({
  isOpen,
  onClose,
  onSuccess,
  existingCount,
}: AddAssemblyLineModalProps) {
  const { currentUser } = useAuth();
  const nextLineNumber = existingCount + 1;

  const [name, setName] = useState<string>(`Assembly Line ${nextLineNumber}`);
  const [lineCode, setLineCode] = useState<string>(`AL-${String(nextLineNumber).padStart(2, '0')}`);
  const [description, setDescription] = useState<string>('Electrical Control & Distribution Panels');
  const [supervisorName, setSupervisorName] = useState<string>('Amit Sharma');
  const [capacity, setCapacity] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please specify an Assembly Line Name');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await assemblyLineService.createLine({
      name: name.trim(),
      line_code: lineCode.trim(),
      description: description.trim(),
      supervisor_name: supervisorName.trim(),
      capacity: Number(capacity) || 10,
      actor_name: currentUser?.full_name || 'Admin',
    });

    setIsSubmitting(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to create assembly line');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Factory className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Add New Assembly Line</h3>
              <p className="text-[11px] text-slate-400">Expand factory floor production lines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Assembly Line Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Assembly Line 8 or High Voltage PCC Line"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Line Code</label>
              <input
                type="text"
                value={lineCode}
                onChange={(e) => setLineCode(e.target.value)}
                placeholder="e.g. AL-08"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Max Panel Capacity</label>
              <input
                type="number"
                min="1"
                max="50"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Assigned Floor Supervisor</label>
            <input
              type="text"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              placeholder="e.g. Amit Sharma or Sandeep Verma"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Process / Scope Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Motor Control, Drive Panels, APFC"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Assembly Line'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
