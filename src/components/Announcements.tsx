import { useState } from 'react';
import type { ServiceEvent } from '../types';
import {
  eventBodyLabel,
  eventTypeLabel,
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
            <li
              key={event.id}
              className={`announcement ${open ? 'is-open' : ''}`}
            >
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
                  {overdue ? (
                    <span className="announcement__flag">已超时</span>
                  ) : null}
                </span>
                <span
                  className={`announcement__chevron ${open ? 'is-open' : ''}`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              <div
                className={`announcement__drawer ${open ? 'is-open' : ''}`}
                aria-hidden={!open}
              >
                <div className="announcement__drawer-inner">
                  {overdue ? (
                    <p className="announcement__overdue">
                      <span className="announcement__overdue-title">
                        已超出计划结束时间 {overdueSince}
                      </span>
                      官方尚未更新事件状态，可能遇到了其他情况，请留意后续公告。
                    </p>
                  ) : null}
                  {text ? (
                    <p className="announcement__body">
                      <span className="announcement__label">
                        {eventBodyLabel(event.type)}：
                      </span>
                      {text}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
