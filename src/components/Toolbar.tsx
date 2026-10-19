import type { SortKey, StatusFilter } from '../types';
import { productLabel } from '../utils/format';

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
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
            aria-label="按状态筛选"
          >
            <option value="all">全部状态</option>
            <option value="ok">运行正常</option>
            <option value="down">服务中断</option>
          </select>

          <select
            className="select"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            aria-label="排序方式"
          >
            <option value="cpu">按 CPU 降序</option>
            <option value="memory">按内存降序</option>
            <option value="updated">按更新时间</option>
            <option value="name">按名称</option>
          </select>
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
