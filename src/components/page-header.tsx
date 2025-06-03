import type { LucideIcon } from 'lucide-react';
import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 md:flex md:items-center md:justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          {Icon && <Icon className="h-8 w-8 text-primary mr-3" />}
          <h1 className="text-3xl font-bold leading-tight text-foreground font-headline sm:truncate">
            {title}
          </h1>
        </div>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="mt-4 flex md:mt-0 md:ml-4">{actions}</div>}
    </div>
  );
}
