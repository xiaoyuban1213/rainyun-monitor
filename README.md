# 雨云节点监控

一个实时展示[雨云](https://www.rainyun.com/status)节点运行状态的监控面板。

数据来自雨云官方公开接口，**无需 API Key、无需后端代理**（接口已开启 CORS）。

## 功能

- 总览统计：节点总数、运行正常、服务中断、平均 CPU / 内存
- 进行中的服务事件（维护 / 故障公告），可展开查看详情
- 按产品（云服务器 / 游戏云 / 路由器 / 对象存储 / 虚拟主机 / 存储）筛选
- 关键字搜索（节点名、UUID）、状态筛选、多维度排序
- CPU / 内存占用可视化，超阈值变色；数据陈旧节点高亮
- 自动刷新（关闭 / 30 秒 / 1 分钟 / 5 分钟），带刷新倒计时
- 深色主题，桌面与移动端自适应

## 技术栈

React 19 + TypeScript + Vite 7，无额外 UI / 图表依赖。

## 本地运行

```bash
npm install
npm run dev       # http://localhost:5173
```

构建与预览：

```bash
npm run build
npm run preview
```

## 数据接口

```
GET https://api.v2.rainyun.com/status?options=<URL 编码的 JSON>
```

`options` 支持：

| 字段      | 说明            | 备注              |
| --------- | --------------- | ----------------- |
| `page`    | 页码，从 1 开始 | 默认 1            |
| `perpage` | 每页条数        | 默认 10，上限 100 |

示例：

```js
fetch(
  'https://api.v2.rainyun.com/status?options=' +
    encodeURIComponent(JSON.stringify({ page: 1, perpage: 100 })),
);
```

返回结构：

```jsonc
{
  "code": 200,
  "data": {
    "TotalRecords": 396,
    "OngoingServiceEvents": [
      {
        "id": 528,
        "title": "游戏云MCSM凌晨维护通知",
        "description": "<p>...</p>",
        "start_date": 1792339200,
        "end_date": 1792353600,
        "type": "maintain",
        "affect_product": "rgs",
        "affect_nodes": "uuid,uuid,...",
        "status": "inprogress"
      }
    ],
    "Records": [
      {
        "UUID": "00421b35-...",
        "ChineseName": "宿迁游戏云14900K-MCSM面板节点17",
        "Product": "rgs",
        "CPU": 0.04,
        "Memory": 1.74,
        "NetOut": 0,
        "UpdateTime": "1792369056", // Unix 秒
        "Status": "ok",
        "Data": ""
      }
    ]
  }
}
```

说明：

- 节点总量约 396 个，前端按 `perpage=100` 并发拉取所有分页。
- `CPU`、`Memory` 为百分比数值。
- `Status` 目前观测到 `ok`；非 `ok` 的值统一按「服务中断」展示。
- `NetOut` 语义未确认，界面暂不展示。
- 接口为公开只读接口，请勿高频轮询，默认刷新间隔为 1 分钟。

## 目录结构

```
src/
├── api/rainyun.ts          # 接口请求与数据规范化（分页、去重）
├── components/
│   ├── Announcements.tsx   # 服务事件公告
│   ├── Meter.tsx           # CPU / 内存进度条
│   ├── NodeTable.tsx       # 节点表格
│   ├── StatCards.tsx       # 总览卡片
│   └── Toolbar.tsx         # 搜索 / 筛选 / 排序
├── hooks/useStatusData.ts  # 数据加载、自动刷新、倒计时
├── utils/format.ts         # 格式化与文案映射
├── App.tsx
├── main.tsx
├── styles.css
└── types.ts
```

## 配置

可通过环境变量覆盖接口地址（见 `.env.example`）：

```
VITE_RAINYUN_API_BASE=https://api.v2.rainyun.com
```
