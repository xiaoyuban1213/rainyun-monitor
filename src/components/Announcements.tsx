import { useState } from 'react';
import type { ServiceEvent } from '../types';
import {
  eventTypeLabel,
  formatClock,
  formatElapsed,
  formatEventRange,
  isEventOverdue,
  productLabel,
  stripHtml,
} from '../utils/format';

interface AnnouncementsProps {
  events: ServiceEvent[];
  /** 当前时间（毫秒），用于判定事件是否已超出计划结束时间 */
  now: number;
}

export function Announcements({ events, now }: AnnouncementsProps) {
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
          const overdue = isEventOverdue(event.end_date, now);
          const overdueSince = formatElapsed(
            (now - event.end_date * 1000) / 1000,
          );
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
                  {formatEventRange(event.start_date, event.end_date)}
                </span>
                {overdue ? (
                  <span
                    className="pill pill--overdue"
                    title={`计划于 ${formatClock(event.end_date * 1000)} 结束，已超出 ${overdueSince}。官方尚未更新事件状态，可能遇到了其他情况，请留意后续公告。`}
                  >
                    已超出计划结束时间
                  </span>
                ) : null}
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
