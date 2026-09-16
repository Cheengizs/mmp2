import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export function Toast({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let className = 'toast-success';
        if (toast.type === 'error') {
          Icon = AlertCircle;
          className = 'toast-error';
        } else if (toast.type === 'info') {
          Icon = Info;
          className = 'toast-info';
        }

        return (
          <div
            key={toast.id}
            className={`toast ${className}`}
            onClick={() => onRemove(toast.id)}
            role="alert"
          >
            <Icon size={18} />
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
