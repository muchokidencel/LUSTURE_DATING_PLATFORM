import React from 'react';

interface SectionLabelProps {
  icon?: React.ComponentType<any>;
  children: React.ReactNode;
}

const SectionLabel = ({ icon: Icon, children }: SectionLabelProps) => (
  <div className="flex items-center gap-2 mb-4">
    {Icon && <Icon size={13} strokeWidth={1.5} className="text-lustre-purple" />}
    <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-lustre-faint">
      {children}
    </span>
    <div className="flex-1 h-px bg-border opacity-60" />
  </div>
);

export default SectionLabel;
