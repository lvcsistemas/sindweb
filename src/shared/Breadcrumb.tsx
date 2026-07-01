import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="breadcrumb" aria-label="Caminho da página">
      <Link to="/" className="breadcrumb-home"><Home size={15} /> Painel Principal</Link>
      {items.map((item) => (
        <span className="breadcrumb-item" key={item.label}>
          <ChevronRight size={14} />
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
