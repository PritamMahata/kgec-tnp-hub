'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Rail({ groupLabel, items }) {
  const pathname = usePathname();
  return (
    <div id="rail">
      <div className="rail-group-label">{groupLabel}</div>
      {items.map((item, i) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link key={item.href} href={item.href} className={`rail-item ${active ? 'active' : ''}`}>
            <span className="num mono">{String(i + 1).padStart(2, '0')}</span>
            <span>{item.label}</span>
            {item.badge ? <span className="badge">{item.badge}</span> : null}
          </Link>
        );
      })}
    </div>
  );
}
