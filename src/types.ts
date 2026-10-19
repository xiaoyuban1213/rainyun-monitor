/** 雨云状态接口的原始返回结构 */

export interface RawNode {
  UUID: string;
  ChineseName: string;
  Product: string;
  CPU: number;
  Memory: number;
  NetOut: number;
  /** Unix 秒，字符串形式 */
  UpdateTime: string;
  Status: string;
  Data: string;
}

export interface ServiceEvent {
  id: number;
  uid: number;
  title: string;
  /** HTML 片段 */
  description: string;
  create_date: number;
  start_date: number;
  end_date: number;
  type: string;
  affect_product: string;
  affect_nodes: string;
  status: string;
}

export interface StatusPageData {
  TotalRecords: number;
  OngoingServiceEvents: ServiceEvent[] | null;
  Records: RawNode[] | null;
}

export interface StatusResponse {
  code: number;
  message?: string;
  data: StatusPageData;
}

/** 前端使用的规范化节点 */
export interface NodeItem {
  id: string;
  name: string;
  product: string;
  cpu: number;
  memory: number;
  netOut: number;
  /** Unix 毫秒 */
  updatedAt: number;
  status: string;
  healthy: boolean;
}

export type SortKey = 'cpu' | 'memory' | 'name' | 'updated';
export type StatusFilter = 'all' | 'ok' | 'down';
