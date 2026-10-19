import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string | number> {
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  /** 无障碍名称，同时用于 aria-labelledby */
  label: string;
  /** 菜单靠右对齐，适合放在页面右侧的控件 */
  align?: 'left' | 'right';
}

/**
 * 自绘下拉选择器。
 * 原生 <select> 的弹出层由系统绘制，无法保证与深色主题一致，
 * 这里用 button + listbox 实现，样式完全可控。
 */
export function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  label,
  align = 'left',
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selected = options[selectedIndex];
  const active = options[Math.min(activeIndex, options.length - 1)];
  // 焦点始终留在 trigger 上，用 aria-activedescendant 告知读屏软件当前高亮项
  const activeOptionId = open
    ? `${menuId}-option-${Math.min(activeIndex, options.length - 1)}`
    : undefined;

  // 打开时把高亮定位到当前选中项
  useEffect(() => {
    if (open) setActiveIndex(selectedIndex);
  }, [open, selectedIndex]);

  // 点击外部或滚动页面时收起
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const commit = (next: T) => {
    onChange(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (
        event.key === 'Enter' ||
        event.key === ' ' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp'
      ) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commit(active.value);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div
      className={`dropdown ${align === 'right' ? 'dropdown--right' : ''}`}
      ref={rootRef}
    >
      <button
        type="button"
        ref={triggerRef}
        className={`dropdown__trigger ${open ? 'is-open' : ''}`}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-activedescendant={activeOptionId}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="dropdown__value">{selected?.label ?? ''}</span>
        <span className="dropdown__caret" aria-hidden="true" />
      </button>

      {open ? (
        <ul
          className="dropdown__menu"
          id={menuId}
          role="listbox"
          aria-label={label}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={String(option.value)}
                id={`${menuId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                className={`dropdown__option ${isSelected ? 'is-selected' : ''} ${
                  isActive ? 'is-active' : ''
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(option.value)}
              >
                <span>{option.label}</span>
                {isSelected ? (
                  <span className="dropdown__check" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
