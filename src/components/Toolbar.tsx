import type { SortKey, StatusFilter } from '../types';
import { productLabel } from '../utils/format';
import { Dropdown } from './Dropdown';

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'ok', label: '运行正常' },
  { value: 'overload', label: '运行阻塞' },
  { value: 'down', label: '服务中断' },
] as const satisfies readonly { value: StatusFilter; label: string }[];

const SORT_OPTIONS = [
  { value: 'cpu', label: '按 CPU 降序' },
  { value: 'memory', label: '按内存降序' },
  { value: 'updated', label: '按更新时间' },
  { value: 'name', label: '按名称' },
] as const satisfies readonly { value: SortKey; label: string }[];

interface ProductOption {
  code: string;
  count: number;
}

interface ToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  products: ProductOption[];
  product: string;
  onProductChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  resultCount: number;
}

export function Toolbar({
  query,
  onQueryChange,
  products,
  product,
  onProductChange,
  statusFilter,
  onStatusChange,
  sort,
  onSortChange,
  resultCount,
}: ToolbarProps) {
  return (
    <section className="toolbar" aria-label="节点筛选">
      <div className="toolbar__row">
        <label className="search">
          <span className="search__icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            value={query}
            placeholder="搜索节点名称或 UUID"
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label="搜索节点"
          />
        </label>

        <div className="toolbar__controls">
          <Dropdown
            label="按状态筛选"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={onStatusChange}
          />

          <Dropdown
            label="排序方式"
            value={sort}
            options={SORT_OPTIONS}
            onChange={onSortChange}
          />
        </div>
      </div>

      <div className="chips" role="group" aria-label="按产品筛选">
        <button
          type="button"
          className={`chip ${product === 'all' ? 'is-active' : ''}`}
          onClick={() => onProductChange('all')}
        >
          全部
        </button>
        {products.map((item) => (
          <button
            key={item.code}
            type="button"
            className={`chip ${product === item.code ? 'is-active' : ''}`}
            onClick={() => onProductChange(item.code)}
          >
            {productLabel(item.code)}
            <span className="chip__count">{item.count}</span>
          </button>
        ))}
        <span className="chips__total">匹配 {resultCount} 个节点</span>
      </div>
    </section>
  );
}
