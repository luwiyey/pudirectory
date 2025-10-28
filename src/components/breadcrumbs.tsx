import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

type Breadcrumb = {
  label: string;
  href: string;
  active?: boolean;
};

export default function Breadcrumbs({ breadcrumbs }: { breadcrumbs: Breadcrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 block">
      <ol className={cn('flex text-sm')}>
        {breadcrumbs.map((breadcrumb, index) => (
          <li
            key={breadcrumb.href}
            aria-current={breadcrumb.active}
            className={cn('flex items-center', breadcrumb.active ? 'text-foreground' : 'text-muted-foreground')}
          >
            <Link href={breadcrumb.href} className="hover:text-primary transition-colors">
              {breadcrumb.label}
            </Link>
            {index < breadcrumbs.length - 1 ? (
              <ChevronRight className="mx-2 h-4 w-4" />
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
