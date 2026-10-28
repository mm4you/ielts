import type { ReactNode } from 'react';

export default function PageHeader({ title, description, actions, icon }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; icon?: ReactNode }) {
  return <header className="page-heading"><div className="page-heading-content">{icon && <span className="page-title-icon" aria-hidden="true">{icon}</span>}<div><h1>{title}</h1>{description && <p>{description}</p>}</div></div>{actions && <div className="page-heading-actions">{actions}</div>}</header>;
}
