import React from 'react';
import { History, Check, X } from 'lucide-react';
import { PackagingProjectData } from '../../core/storage/projectStorage';
import { getTemplateById } from '../../core/dieline';

interface DraftRecoveryBannerProps {
  draft: PackagingProjectData;
  onRestore: () => void;
  onDismiss: () => void;
}

export const DraftRecoveryBanner: React.FC<DraftRecoveryBannerProps> = ({
  draft,
  onRestore,
  onDismiss,
}) => {
  const template = getTemplateById(draft.templateId);
  const timeAgo = Math.max(1, Math.round((Date.now() - draft.metadata.updatedAt) / 60000));
  const timeStr = timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo / 60)}h ago`;

  return (
    <aside className="draft-recovery-banner" role="status" aria-label="Unsaved draft recovery">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--border-focus)',
          }}
        >
          <History size={16} />
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Unsaved draft detected
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {template.name} ({draft.dimensions.length}×{draft.dimensions.width}×{draft.dimensions.depth}mm) • Saved {timeStr}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className="header-action-btn primary"
          style={{ padding: '5px 12px', fontSize: '11px' }}
          onClick={onRestore}
        >
          <Check size={13} />
          Restore Draft
        </button>
        <button
          className="header-action-btn"
          style={{ padding: '5px 8px', fontSize: '11px' }}
          onClick={onDismiss}
          title="Dismiss and discard draft"
        >
          <X size={13} />
          Dismiss
        </button>
      </div>
    </aside>
  );
};
