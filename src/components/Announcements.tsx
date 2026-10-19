import { useState } from 'react';
import type { ServiceEvent } from '../types';
import {
  eventTypeLabel,
  formatClock,
  productLabel,
  stripHtml,
} from '../utils/format';

interface AnnouncementsProps {
  events: ServiceEvent[];
}

export function Announcements({ events }: AnnouncementsProps) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (events.length === 0) return null;

  return (
    <section className="announcements" aria-label="进行中的服务事件">
      <header className="announcements__head">
        <span className="announcements__dot" aria-hidden="true" />
        进行中的服务事件
        <span className="announcements__count">{events.length}</span>
      </header>

      <ul className="announcements__list">
        {events.map((event) => {
          const open = openId === event.id;
          const text = stripHtml(event.description || '');
          return (
            <li key={event.id} className="announcement">
              <button
                type="button"
                className="announcement__summary"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : event.id)}
              >
                <span className={`tag tag--${event.type}`}>
                  {eventTypeLabel(event.type)}
                </span>
                <span className="announcement__title">{event.title}</span>
                <span className="announcement__meta">
                  {event.affect_product
                    ? productLabel(event.affect_product)
                    : '全平台'}
                  <span className="announcement__sep">·</span>
                  {formatClock(event.start_date * 1000)} 起
                </span>
                <span
                  className={`announcement__chevron ${open ? 'is-open' : ''}`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              {open && text ? (
                <div className="announcement__body">{text}</div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
