
import React from 'react';
import type { ProgressStep } from '../types';
import { IconComponents } from './IconComponents';

interface ProgressTrackerProps {
  steps: ProgressStep[];
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ steps }) => {
  const getStatusIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'running':
        return <IconComponents.LoaderIcon className="w-5 h-5 text-cyan-400 animate-spin" />;
      case 'complete':
        return <IconComponents.CheckIcon className="w-5 h-5 text-green-400" />;
      case 'error':
        return <IconComponents.ErrorIcon className="w-5 h-5 text-red-400" />;
      case 'pending':
        return <div className="w-5 h-5 border-2 border-slate-500 rounded-full" />;
    }
  };

  const getStatusColor = (status: ProgressStep['status']) => {
     switch (status) {
      case 'running': return 'text-cyan-300';
      case 'complete': return 'text-green-300';
      case 'error': return 'text-red-300';
      case 'pending': return 'text-slate-500';
    }
  }

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-slate-300">Yaratish Jarayoni</h3>
      <div className="flex flex-col sm:flex-row sm:justify-around gap-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-3">
            <div className="flex-shrink-0">
                {getStatusIcon(step.status)}
            </div>
            <span className={`font-medium ${getStatusColor(step.status)}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};