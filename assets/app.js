/* ============================================================
 * EVData Box · 新能源汽车教研数据集管理与展示工作台
 * X-GAME 2026 天华学院校内赛 实战赛二 参赛作品
 * 纯前端离线应用：原生 JS + ECharts（本地）+ 真实统计数据（Python 预计算）
 * ============================================================ */
(function () {
'use strict';

/* ---------------- 工具 ---------------- */
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fmtNum(n) {
  if (n == null || n === '' || isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('zh-CN');
}
var PALETTE = ['#4f46e5', '#10b981', '#0ea5e9', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444', '#6366f1', '#84cc16'];
var charts = [];

/* 图表公共文字样式：保证轴标签/图例在任何宽度下清晰不重叠 */
var CHART_FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
function chartText(extra) {
  return Object.assign({ fontFamily: CHART_FONT, color: '#475569' }, extra || {});
}
/* 公共网格：containLabel 让轴标签自动计算占位，杜绝压字 */
function chartGrid(top, extra) {
  return Object.assign({ left: 14, right: 20, top: top || 56, bottom: 12, containLabel: true }, extra || {});
}
var TIP_STYLE = {
  backgroundColor: 'rgba(15,23,42,.92)', borderWidth: 0,
  textStyle: { color: '#f8fafc', fontSize: 12, fontFamily: CHART_FONT },
  extraCssText: 'box-shadow:0 8px 24px rgba(15,23,42,.25);border-radius:8px;padding:8px 12px;'
};
function makeChart(id, option) {
  var el = document.getElementById(id);
  if (!el || typeof echarts === 'undefined') return;
  var c = echarts.init(el, null, { renderer: 'canvas' });
  option.color = option.color || PALETTE;
  option.textStyle = { fontFamily: CHART_FONT, color: '#475569' };
  if (option.tooltip) option.tooltip = Object.assign({}, TIP_STYLE, option.tooltip, { textStyle: TIP_STYLE.textStyle });
  c.setOption(option);
  charts.push(c);
}
window.addEventListener('resize', function () { charts.forEach(function (c) { c.resize(); }); });
function disposeCharts() { charts.forEach(function (c) { c.dispose(); }); charts = []; }

function histOption(title, hist, unit, color) {
  var labels = [];
  for (var i = 0; i < hist.edges.length - 1; i++) {
    labels.push(hist.edges[i] + '~' + hist.edges[i + 1]);
  }
  var rotated = labels.length > 6;
  return {
    title: {
      text: title, left: 8, top: 6,
      textStyle: { fontSize: 13.5, fontWeight: 700, color: '#0f172a', fontFamily: CHART_FONT },
      subtext: unit ? '单位：' + unit : '',
      subtextStyle: { fontSize: 11, color: '#94a3b8' },
      itemGap: 4
    },
    grid: chartGrid(64),
    tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' } }, {}),
    xAxis: {
      type: 'category', data: labels,
      axisLabel: { rotate: rotated ? 40 : 0, fontSize: 10.5, hideOverlap: true, interval: 'auto', margin: 10 },
      axisTick: { alignWithLabel: true }, axisLine: { lineStyle: { color: '#e2e8f0' } }
    },
    yAxis: { type: 'value', name: '记录数', nameTextStyle: chartText({ fontSize: 11, padding: [0, 0, 0, 30] }), axisLabel: chartText({ fontSize: 11 }), splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [{ type: 'bar', data: hist.counts, itemStyle: { color: color || '#4f46e5', borderRadius: [4, 4, 0, 0] }, barMaxWidth: 28 }]
  };
}
function pieOption(title, items, labelKey) {
  return {
    title: {
      text: title, left: 8, top: 6,
      textStyle: { fontSize: 13.5, fontWeight: 700, color: '#0f172a', fontFamily: CHART_FONT }
    },
    tooltip: Object.assign({ trigger: 'item', formatter: '{b}: {c} 条（{d}%）' }, {}),
    legend: { bottom: 4, textStyle: chartText({ fontSize: 11.5 }), type: 'scroll', itemWidth: 12, itemHeight: 8, icon: 'roundRect' },
    series: [{
      type: 'pie', radius: ['42%', '64%'], center: ['50%', '54%'],
      label: { fontSize: 11, formatter: '{b}\n{d}%', lineHeight: 15, color: '#475569' },
      labelLine: { length: 12, length2: 8 },
      avoidLabelOverlap: true,
      itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 4 },
      data: items.map(function (it) { return { name: (labelKey && it[labelKey]) || it.label || it.k, value: it.v }; })
    }]
  };
}
function barOption(title, items, opts) {
  opts = opts || {};
  var rotated = !opts.horizontal && items.length > 7;
  return {
    title: {
      text: title, left: 8, top: 6,
      textStyle: { fontSize: 13.5, fontWeight: 700, color: '#0f172a', fontFamily: CHART_FONT }
    },
    grid: chartGrid(64, opts.horizontal ? { right: 46 } : {}),
    tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' } }, {}),
    xAxis: opts.horizontal
      ? { type: 'value', axisLabel: chartText({ fontSize: 11 }), splitLine: { lineStyle: { color: '#f1f5f9' } } }
      : {
          type: 'category', data: items.map(function (i) { return i.k; }),
          axisLabel: { rotate: rotated ? 35 : 0, fontSize: 10.5, hideOverlap: true, interval: 0, margin: 10 },
          axisLine: { lineStyle: { color: '#e2e8f0' } }
        },
    yAxis: opts.horizontal
      ? { type: 'category', data: items.map(function (i) { return i.k; }).reverse(), axisLabel: chartText({ fontSize: 11.5 }), axisLine: { lineStyle: { color: '#e2e8f0' } } }
      : { type: 'value', axisLabel: chartText({ fontSize: 11 }), splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [{
      type: 'bar',
      data: (opts.horizontal ? items.slice().reverse() : items).map(function (i, idx) {
        return { value: i.v, itemStyle: { color: PALETTE[idx % PALETTE.length], borderRadius: opts.horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] } };
      }),
      barMaxWidth: 26,
      label: opts.label ? { show: true, position: opts.horizontal ? 'right' : 'top', fontSize: 10.5, color: '#64748b', fontFamily: CHART_FONT } : undefined
    }]
  };
}

/* ---------------- 极简 Markdown 渲染器（GFM 表格） ---------------- */
function renderMarkdown(src) {
  var lines = String(src).replace(/\r\n/g, '\n').split('\n');
  var html = '', i = 0, inCode = false, listStack = [];
  function inline(t) {
    t = esc(t);
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>');
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<span class="tag">图：$1</span>');
    return t;
  }
  function closeLists() {
    while (listStack.length) { html += listStack.pop() === 'ul' ? '</ul>' : '</ol>'; }
  }
  while (i < lines.length) {
    var line = lines[i];
    if (/^```/.test(line)) {
      if (inCode) { html += '</code></pre>'; inCode = false; }
      else { closeLists(); html += '<pre><code>'; inCode = true; }
      i++; continue;
    }
    if (inCode) { html += esc(line) + '\n'; i++; continue; }
    if (/^\s*$/.test(line)) { closeLists(); i++; continue; }
    // 表格
    if (line.indexOf('|') !== -1 && i + 1 < lines.length && /^\s*\|?[\s:\-|]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].indexOf('-') !== -1) {
      closeLists();
      var header = line.replace(/^\||\|$/g, '').split('|');
      var bodyRows = [];
      i += 2;
      while (i < lines.length && lines[i].indexOf('|') !== -1 && !/^\s*$/.test(lines[i])) {
        bodyRows.push(lines[i].replace(/^\||\|$/g, '').split('|')); i++;
      }
      html += '<div class="table-wrap"><table><thead><tr>' + header.map(function (h) { return '<th>' + inline(h.trim()) + '</th>'; }).join('') + '</tr></thead><tbody>';
      bodyRows.forEach(function (r) {
        html += '<tr>' + r.map(function (c) { return '<td>' + inline(c.trim()) + '</td>'; }).join('') + '</tr>';
      });
      html += '</tbody></table></div>';
      continue;
    }
    var m;
    if ((m = line.match(/^(#{1,6})\s+(.*)/))) { closeLists(); var lv = m[1].length; html += '<h' + lv + '>' + inline(m[2]) + '</h' + lv + '>'; i++; continue; }
    if (/^\s*---+\s*$/.test(line)) { closeLists(); html += '<hr>'; i++; continue; }
    if (/^\s*>\s?/.test(line)) {
      closeLists();
      var qt = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) { qt.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
      html += '<blockquote>' + qt.map(inline).join('<br>') + '</blockquote>'; continue;
    }
    if ((m = line.match(/^\s*[-*]\s+(.*)/))) {
      if (!listStack.length || listStack[listStack.length - 1] !== 'ul') { closeLists(); html += '<ul>'; listStack.push('ul'); }
      html += '<li>' + inline(m[1]) + '</li>'; i++; continue;
    }
    if ((m = line.match(/^\s*\d+\.\s+(.*)/))) {
      if (!listStack.length || listStack[listStack.length - 1] !== 'ol') { closeLists(); html += '<ol>'; listStack.push('ol'); }
      html += '<li>' + inline(m[1]) + '</li>'; i++; continue;
    }
    closeLists();
    html += '<p>' + inline(line) + '</p>'; i++;
  }
  closeLists();
  return html;
}

/* ---------------- 数据集注册表（元数据源自官方数据手册） ---------------- */
var DATASETS = {
  beginner: {
    key: 'beginner', idx: '①',
    name: '国标32960入门数据集', en: 'EV_32960_BEGINNER_DATASET',
    level: '入门', levelTag: 'green', position: '国标认知与数据质量检测',
    version: 'v1.0', org: 'EVData Box 团队', pubdate: '2026-09-04',
    timespan: '某年 11月1日 — 11月30日（1个月）',
    scale: '约 161 万行 / 26.26 MB', format: 'PARQUET（按车辆分区）',
    tables: [
      { name: 'origin_data', desc: '车辆运行点级遥测记录（整车数据 struct + 定位数据 struct）', rows: '约 1,612,822 行' },
      { name: 'vehicle_model_info', desc: '车型静态信息维表（类型/级别/动力/储能参数）', rows: '10 行' }
    ],
    desc: '基于 10 辆具有差异性（商用种类、动力类型、采样频率 10s/30s 各不相同）的新能源车辆一个月的实际运行数据加工而成，反映 GB/T 32960 国标数据的原始形态与共性特征，覆盖整车状态、充电状态、车速、累计里程、总电压、总电流、SOC、挡位、踏板与定位字段。',
    scenes: [
      { name: 'GB/T 32960 标准数据洞察', goal: '了解数据结构、单字段含义与多字段关系，用 BI 工具可视化字段间关系，探寻车辆间共性', diff: '入门' },
      { name: '新能源汽车数据质量检测治理', goal: '参照《2022年度上海市新能源汽车数据质量检测标准》与 GB/T 36344-2018 开展规范性、完整性、准确性、一致性、时效性检测', diff: '入门+' }
    ],
    caveats: ['采样间隔 10s/30s，不适合急加速/急减速等微观行为探究', '不含三电深度字段（发动机/电机/电池极值），相关诊断请用长周期数据集', '面向群体横向分析，单车长周期衰减请用长周期数据集'],
    relations: 'origin_data.vehicle_model_seq（多）→ vehicle_model_info.vehicle_model_seq（一）；vehicledata / vehicleposition 为嵌套 struct，需展开使用；(evdata_vehicle_id, date, time) 非唯一键，同一时刻可能存在多条上报。',
    statsVar: 'DATA_BEGINNER', dictKey: 'beginner',
    demoNote: '本地 DEMO 实测：3 辆车 × 500 行 = 1,500 行切片（正式版约 161 万行）',
    qualityChecks: null, radar: [88, 95, 92, 90, 85],
    radarNote: '依据 DEMO 切片实测（定位完整率 100%、异常码 0 检出）与数据手册已知问题（同车同时刻重复、采样频率不一、时间空白）综合评定'
  },
  more_vehicle: {
    key: 'more_vehicle', idx: '②',
    name: '新能源汽车多车辆运行数据集', en: 'EV_MORE_VEHICLE_DATASET',
    level: '进阶', levelTag: 'orange', position: '群体行为与空间分析',
    version: 'v1.0', org: 'EVData Box 团队', pubdate: '2026-09-04',
    timespan: '某年 07-01 — 07-14（2 周）',
    scale: '约 4,100 万行 / 760 MB', format: 'PARQUET（按日期分区）',
    tables: [
      { name: 'origin_data', desc: '大规模车辆群体运行上报记录（整车 + 定位 struct）', rows: '约 4,100 万行' },
      { name: 'vehicle_model_info', desc: '车型信息维表', rows: '4 行' },
      { name: 'weather_info', desc: '天气信息维表（气温/天气/风向风力，一天一行）', rows: '14 行' }
    ],
    desc: '基于大规模新能源车辆群体两周的实际运行数据加工而成，聚焦多车辆横向对比与群体行为研究。除整车与定位数据外，还关联车型维表与天气维表，支持「车辆 × 日期 × 天气」的多维度下钻分析。',
    scenes: [
      { name: '车辆群体行为研究', goal: '群体 SOC 分布、充电行为、车速/里程分布等群体状态统计', diff: '进阶' },
      { name: '出行与空间特征研究', goal: '基于定位数据的空间分布、出行半径、城市热力与充电基础设施规划', diff: '进阶' },
      { name: '宏观能耗与算法研究', goal: '群体级能耗统计、区域需求预测、车辆状态识别等算法模型训练', diff: '进阶' }
    ],
    caveats: ['origin_data 按 date 分区，查询必须带分区过滤，否则全表扫描', '空间分析前必须过滤无效定位（locationstate=2 或经纬度无效码），避免轨迹飘点', 'date 为整型 MMdd、vehicle_model_seq 为 string，join 前需统一类型'],
    relations: 'vehicle_model_info（一）: origin_data（多）= 1:N（vehicle_model_seq）；weather_info（一）: origin_data（多）= 1:N（date，整型 MMdd）；vehicleposition 可为空。',
    statsVar: 'DATA_MORE_VEHICLE', dictKey: null,
    demoNote: '本地 DEMO 实测：2,216 行、3 辆车、2 个车型（正式版约 4,100 万行）；数据字典与国标32960入门数据集同构，另含 weather_info 天气维表 8 字段',
    qualityChecks: null, radar: [90, 94, 90, 93, 88],
    radarNote: '依据 DEMO 切片实测与手册校验结论（主键唯一、外键命中率 100%）综合评定'
  },
  long_period: {
    key: 'long_period', idx: '③',
    name: '新能源汽车长周期运行数据集', en: 'EV_LONG_PERIOD_DATASET',
    level: '进阶', levelTag: 'orange', position: '三电深度诊断与电池衰减',
    version: 'v1.0', org: 'EVData Box 团队', pubdate: '2026-09-04',
    timespan: '某年 1月1日 — 12月31日（1 年）',
    scale: '约 3,600 万行 / 580 MB', format: 'PARQUET（按车辆分区）',
    tables: [
      { name: 'origin_data', desc: '长周期运行记录（整车 + 发动机 + 极值 + 驱动电机 struct）', rows: '约 3,600 万行' },
      { name: 'vehicle_model_info', desc: '车型信息维表', rows: '40 行' }
    ],
    desc: '基于 100 辆新能源车辆一整年的长周期实际运行数据加工而成，聚焦单车纵向追踪与三电系统深度诊断，包含发动机数据、电池单体电压/温度极值数据与驱动电机数据等三电深度字段，覆盖 BEV / PHEV / FCEV 多种动力类型，共涉及 40 个车型。',
    scenes: [
      { name: '驾驶行为演变', goal: '探查长时间尺度上用户行驶、充电行为的演变规律及潜在影响因素', diff: '进阶' },
      { name: '动力电池衰减', goal: '探究电池衰减核心影响因素，估算电池健康度（SOH）并总结延缓衰减措施', diff: '进阶' }
    ],
    caveats: ['数据覆盖以长三角地区为主，不适合外推至极寒/极热工况', '车载传感器采集未经实车验证，不适合直接推断因果关系', 'BEV 车 enginedata 为空；充电状态下 motordatalist 为空，过滤时注意样本缩减'],
    relations: 'origin_data.vehicle_model_seq（多）→ vehicle_model_info（一）；motordatalist 为 struct 套 array（1~253 个电机），需 explode 展开；evdata_vehicle_id 为分区键，查询必须带车辆过滤。',
    statsVar: 'DATA_LONG_PERIOD', dictKey: 'long_period',
    demoNote: '本地 DEMO 实测：2,095 行、3 辆车（正式版约 3,600 万行、100 辆车）；DEMO 中发动机数据占比 34.6%（PHEV 车辆）',
    qualityChecks: null, radar: [92, 95, 91, 94, 90],
    radarNote: '依据 DEMO 切片实测与手册校验结论（车辆分区 100% 非空、引用完整性 100%）综合评定'
  },
  vehicle_model: {
    key: 'vehicle_model', idx: '④',
    name: '新能源汽车车型信息数据集', en: 'EV_VEHICLE_MODEL_DATASET',
    level: '入门', levelTag: 'green', position: '数据治理与车型研究',
    version: 'v1.0', org: 'EVData Box 团队', pubdate: '2026-09-10',
    timespan: '2019 — 2026 年',
    scale: '200 行 / 约 45 KB', format: 'Excel（.xlsx）',
    tables: [
      { name: 'vehicle_model_raw_data', desc: '车型信息原始数据表（22 字段，原样落盘，含单位混用/品牌异体等真实治理问题）', rows: '100 行' },
      { name: 'vehicle_model_correction_data', desc: '车型信息修正数据表（29 字段，经单位归一、枚举标准化、空值补全）', rows: '100 行' }
    ],
    desc: '基于工信部机动车公告与新能源厂商公开参数汇编，覆盖 100 款典型新能源车型。独特之处在于包含同一公告体系下的「原始入库」与「修正入库」两套快照，通过品牌型号一一对应，是数据治理教学（clean-before / clean-after 对比）的真实素材。',
    scenes: [
      { name: '车型参数化建模', goal: '统一字段描述车辆基础参数、动力电池与续航，用于车辆队列分析与车型聚类研究', diff: '入门' },
      { name: '公告数据清洗与质量提升', goal: '对比原始/修正两套字段，验证单位统一、枚举标准化、空值补全等治理规则的有效性', diff: '入门' },
      { name: '行业研究', goal: '车型级别、动力类型（含增程/换电）、续航工况（NEDC/CLTC/WLTC）多维对比', diff: '入门' }
    ],
    caveats: ['原始表不能直接用于统计，面向发布的分析请使用修正表', '厂商指导价 ≠ 市场终端成交价，不可推断实际购买成本', 'comprehensive_endurance 为派生字段，严格工况研究请指定 NEDC/CLTC/WLTC 字段'],
    relations: 'vehicle_model_raw_data.brand_model（一）: vehicle_model_correction_data.brand_model（一）= 1:1 修正关系；两表均可按 brand_name 聚合下钻。',
    statsVar: 'DATA_VEHICLE_MODEL', dictKey: null,
    demoNote: '本地文件即为全量：原始表 100 行 + 修正表 100 行',
    qualityChecks: null, radar: [96, 97, 95, 96, 88],
    radarNote: '修正表经单位归一与枚举标准化，一致性校验含尺寸字段 ±5mm 交叉验证、BEV 续航非空规则'
  },
  stay_charge: {
    key: 'stay_charge', idx: '⑤',
    name: '新能源汽车停留与充电行为数据集', en: 'EV_STAY_CHARGE_DATASET',
    level: '综合', levelTag: 'purple', position: '业务分析与商业决策建模',
    version: 'v1.0', org: '上海市新能源汽车（嘉定）数据创新实验室', pubdate: '2026-09',
    timespan: '1 个月（日期已偏移脱敏，保留真实星期分布与日期类型）',
    scale: '约 4.1 万条停留事件 / 约 7,300 辆车', format: 'Excel（.xlsx，4 张关联表）',
    tables: [
      { name: 'trip_stay_charge_data', desc: '停留事件主表（停留/充电起止时间、SOC、时长、最大功率等 20 字段）', rows: '约 41,000 行' },
      { name: 'charge_station_info', desc: '充电站属性表（运营商、快慢充枪数、所在网格）', rows: '4 行' },
      { name: 'vehicle_model_info', desc: '车型信息表', rows: '约 66 行' },
      { name: 'aoi_info', desc: 'AOI 属性表（周边社区/商业体兴趣面）', rows: '约 7 行' }
    ],
    desc: '面向高校教学与研究场景定制，基于天华学院周边区域一个月的车辆运行上报数据与地理空间数据融合加工，覆盖约 7,300 辆新能源车、约 4.1 万条停留事件，聚焦「人-车-场-站」四维关联的完整业务链路，Excel 或 Tableau 即可完成分析。',
    scenes: [
      { name: '社区充电需求分析', goal: '还原车辆在社区、商业体及充电站之间的停留与补能路径，识别不同场景充电需求特征', diff: '综合' },
      { name: '用户行为画像构建', goal: '结合车辆静态属性与充电行为指标，构建充电用户分群（应急补电型/日常顺便充型/夜间驻扎型）', diff: '综合' },
      { name: '场站运营诊断', goal: '基于充电站时段分布、功率特征与利用率，诊断场站运营效率，支撑分时定价与排班决策', diff: '综合' }
    ],
    caveats: ['仅覆盖选定区域与 4 个快充站，不宜外推至全市结论', '停留不足 10 分钟且未充电的记录已被过滤，周转率分析需注意口径', '日期经偏移脱敏且非整周平移，时间与 week_n/day_type 不对应，应优先使用 week_n 与 day_type'],
    relations: '主表 evdata_model_id → 车型表（多对一）；主表 cdz_id → 充电站表（停留于充电站时取值，可空）；主表 uid → AOI 表（停留于 AOI 时取值，可空）；充电站与 AOI 通过 1km 网格编码空间邻近匹配。',
    statsVar: 'DATA_STAY_CHARGE', dictKey: 'stay_charge',
    demoNote: '本地 DEMO 实测：500 条停留事件、164 辆车、66 个车型，其中含充电行为 101 条（20.2%）（正式版约 4.1 万条）',
    qualityChecks: null, radar: [94, 93, 92, 95, 86],
    radarNote: '手册校验结论：枚举值、取值范围、外键引用完整性、时间逻辑校验均通过，无已知数据质量问题'
  }
};
var DS_ORDER = ['beginner', 'more_vehicle', 'long_period', 'vehicle_model', 'stay_charge'];

/* ---------------- 通用表格组件（搜索/排序/分页） ---------------- */
function dataTable(container, columns, rows, opts) {
  opts = opts || {};
  var pageSize = opts.pageSize || 12;
  var state = { page: 1, q: '', sortCol: -1, sortAsc: true };
  var wrap = document.createElement('div');
  var toolbar = '';
  if (!opts.noSearch) {
    toolbar = '<div class="toolbar"><input type="text" placeholder="搜索任意字段内容…" class="dt-search"><span class="dt-count badge badge-gray"></span></div>';
  }
  wrap.innerHTML = toolbar + '<div class="table-wrap"><table class="tbl"><thead><tr>' +
    columns.map(function (c, i) { return '<th data-i="' + i + '" style="cursor:pointer" title="点击排序">' + esc(c) + ' ⇅</th>'; }).join('') +
    '</tr></thead><tbody></tbody></table></div>' +
    '<div class="pager"><button class="dt-prev">上一页</button><span class="dt-info"></span><button class="dt-next">下一页</button></div>';
  container.appendChild(wrap);

  function filtered() {
    var q = state.q.toLowerCase();
    var out = !q ? rows.slice() : rows.filter(function (r) {
      return columns.some(function (c) { return String(r[c] == null ? '' : r[c]).toLowerCase().indexOf(q) !== -1; });
    });
    if (state.sortCol >= 0) {
      var c = columns[state.sortCol];
      out.sort(function (a, b) {
        var x = String(a[c] == null ? '' : a[c]), y = String(b[c] == null ? '' : b[c]);
        var nx = parseFloat(x), ny = parseFloat(y);
        var cmp = (!isNaN(nx) && !isNaN(ny)) ? nx - ny : x.localeCompare(y, 'zh-CN');
        return state.sortAsc ? cmp : -cmp;
      });
    }
    return out;
  }
  function render() {
    var data = filtered();
    var pages = Math.max(1, Math.ceil(data.length / pageSize));
    if (state.page > pages) state.page = pages;
    var slice = data.slice((state.page - 1) * pageSize, state.page * pageSize);
    var tb = $('tbody', wrap);
    tb.innerHTML = slice.map(function (r) {
      return '<tr>' + columns.map(function (c) { return '<td class="mono">' + esc(r[c] == null ? '' : r[c]) + '</td>'; }).join('') + '</tr>';
    }).join('') || '<tr><td colspan="' + columns.length + '" style="text-align:center;color:#8a92a6;padding:20px">无匹配数据</td></tr>';
    $('.dt-info', wrap).textContent = '第 ' + state.page + ' / ' + pages + ' 页';
    $('.dt-prev', wrap).disabled = state.page <= 1;
    $('.dt-next', wrap).disabled = state.page >= pages;
    var cnt = $('.dt-count', wrap);
    if (cnt) cnt.textContent = '共 ' + fmtNum(data.length) + ' 行' + (state.q ? '（已筛选）' : '');
    if (opts.onRender) opts.onRender(wrap);
  }
  var si = $('.dt-search', wrap);
  if (si) si.addEventListener('input', function () { state.q = this.value; state.page = 1; render(); });
  $$('th', wrap).forEach(function (th) {
    th.addEventListener('click', function () {
      var i = Number(this.getAttribute('data-i'));
      if (state.sortCol === i) state.sortAsc = !state.sortAsc; else { state.sortCol = i; state.sortAsc = true; }
      render();
    });
  });
  $('.dt-prev', wrap).addEventListener('click', function () { state.page--; render(); });
  $('.dt-next', wrap).addEventListener('click', function () { state.page++; render(); });
  render();
}

/* ---------------- 页面：总览看板 ---------------- */
function pageOverview() {
  var v = $('#view');
  var dictFields = 0;
  if (window.DATA_DICTS) {
    Object.keys(DATA_DICTS).forEach(function (k) {
      DATA_DICTS[k].forEach(function (t) { if (t.sheet.indexOf('图例') === -1) dictFields += t.rows.length; });
    });
  }
  var cards = DS_ORDER.map(function (k) {
    var d = DATASETS[k];
    return '<div class="ds-card">' +
      '<div class="ds-head"><div><div class="ds-name">' + d.idx + ' ' + d.name + '</div><div class="ds-en">' + d.en + '</div></div>' +
      '<span class="tag ' + d.levelTag + '">' + d.level + '</span></div>' +
      '<div class="ds-desc">' + d.desc.slice(0, 86) + '…</div>' +
      '<div class="ds-meta"><span>教学定位：<b>' + d.position + '</b></span><span>时间：<b>' + d.timespan.split('（')[0] + '</b></span><span>规模：<b>' + d.scale.split('/')[0].trim() + '</b></span></div>' +
      '<div class="ds-actions"><a class="btn primary" href="#/dataset/' + k + '">进入数据集</a><a class="btn" href="#/dataset/' + k + '/explore">数据探查</a></div>' +
      '</div>';
  }).join('');

  var ICO_DB = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>';
  var ICO_TABLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="10" y1="4" x2="10" y2="20"/></svg>';
  var ICO_ROWS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h12"/></svg>';
  var ICO_FIELDS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 8.4l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l8-8"/></svg>';

  v.innerHTML =
    '<div class="hero">' +
    '<div class="hero-eyebrow">X-GAME 2026 天华学院校内赛 · 实战赛二 参赛作品</div>' +
    '<h1>新能源汽车教研数据集<br>管理与展示工作台</h1>' +
    '<p>把 5 个新能源车数据集装进一个「看得懂、查得到、能分析」的本地工作台。它像一本会动的说明书：左侧选数据集，中间看介绍、查字段、预览真实数据，图表和结论全部由真实数据计算得出，双击即用、断网可用。</p>' +
    '<div class="hero-tags"><span class="hero-tag">纯离线本地运行</span><span class="hero-tag">真实数据统计驱动</span><span class="hero-tag">GB/T 32960 · GB/T 36344 标准依据</span></div>' +
    '</div>' +

    '<div class="card"><div class="card-title">三步上手 · 零基础也能用<span class="card-sub">第一次打开？按下面三步走即可</span></div>' +
    '<div class="guide">' +
    '<div class="guide-item"><div class="guide-num">1</div><div><div class="guide-title">选一个数据集</div><div class="guide-text">在左侧菜单或下方目录卡片中，点击任意数据集进入详情页。</div></div></div>' +
    '<div class="guide-item"><div class="guide-num">2</div><div><div class="guide-title">看懂它有什么</div><div class="guide-text">详情页顶部有页签：先看「概述」了解它是干什么的，再用「数据字典」查每个字段的含义。</div></div></div>' +
    '<div class="guide-item"><div class="guide-num">3</div><div><div class="guide-title">看数据说话</div><div class="guide-text">进入「数据探查」和「质量报告」，图表下方都配了「读图指引」，一句话讲清每张图说明什么。</div></div></div>' +
    '</div></div>' +

    '<div class="grid grid-4 mt16">' +
    '<div class="stat-card"><div class="stat-top"><div class="stat-icon i-indigo">' + ICO_DB + '</div></div>' +
    '<div class="stat-num">5<small> 个</small></div><div class="stat-label">教研数据集</div><div class="stat-hint">从入门到综合，覆盖完整教学链路</div></div>' +
    '<div class="stat-card"><div class="stat-top"><div class="stat-icon i-green">' + ICO_TABLE + '</div></div>' +
    '<div class="stat-num">13<small> 张</small></div><div class="stat-label">数据表</div><div class="stat-hint">含记录真实运行的事实表与车型、天气等维表</div></div>' +
    '<div class="stat-card"><div class="stat-top"><div class="stat-icon i-sky">' + ICO_ROWS + '</div></div>' +
    '<div class="stat-num">7,869<small> 万+</small></div><div class="stat-label">正式版数据行数</div><div class="stat-hint">数据手册口径；本地 DEMO 样例另行标注</div></div>' +
    '<div class="stat-card"><div class="stat-top"><div class="stat-icon i-purple">' + ICO_FIELDS + '</div></div>' +
    '<div class="stat-num">' + dictFields + '<small> 个</small></div><div class="stat-label">可检索数据字段</div><div class="stat-hint">字段级字典在线搜索，含敏感等级标识</div></div>' +
    '</div>' +

    '<div class="card mt16"><div class="card-title">教研链路全景<span class="card-sub">5 个数据集如何构成从入门到综合的学习路径</span></div>' +
    '<div class="steps">' +
    '<div class="step"><div class="step-dot">1</div><div class="step-name">国标认知</div><div class="step-desc">国标32960入门数据集<br>字段认知 · 数据质量检测</div></div>' +
    '<div class="step"><div class="step-dot">2</div><div class="step-name">数据治理</div><div class="step-desc">车型信息数据集<br>原始/修正快照对比治理</div></div>' +
    '<div class="step"><div class="step-dot">3</div><div class="step-name">群体分析</div><div class="step-desc">多车辆运行数据集<br>群体行为 · 空间 · 天气</div></div>' +
    '<div class="step"><div class="step-dot">4</div><div class="step-name">深度诊断</div><div class="step-desc">长周期运行数据集<br>三电诊断 · 电池衰减</div></div>' +
    '<div class="step"><div class="step-dot">5</div><div class="step-name">商业实战</div><div class="step-desc">停留与充电行为数据集<br>画像分群 · 场站运营</div></div>' +
    '</div></div>' +
    '<div class="section-title mt16">数据集目录</div>' +
    '<div class="section-desc">点击卡片进入对应数据集，每个数据集都提供概述、数据字典、样本预览、交互图表与质量报告。</div>' +
    '<div class="grid grid-3">' + cards + '</div>' +
    '<div class="card"><div class="card-title">平台核心能力<span class="card-sub">这个工作台能帮你做的四件事</span></div>' +
    '<div class="grid grid-4 mb0">' +
    '<div><b>数据目录管理</b><p style="font-size:12.5px;color:var(--ink-2)">统一元数据登记：版本、机构、时间跨度、规模、格式、分区策略、敏感等级一览。</p></div>' +
    '<div><b>数据字典检索</b><p style="font-size:12.5px;color:var(--ink-2)">字段级数据字典在线检索，支持按表筛选与关键词搜索，敏感等级可视化标识。</p></div>' +
    '<div><b>数据探查可视化</b><p style="font-size:12.5px;color:var(--ink-2)">基于真实数据统计的分布直方图、状态占比、时空散点、24 小时行为节律等交互图表。</p></div>' +
    '<div><b>数据质量检测</b><p style="font-size:12.5px;color:var(--ink-2)">参照 GB/T 36344-2018 五维评价体系与 GB/T 32960 异常码规则的实测质量报告。</p></div>' +
    '</div></div>';
  $('#crumb').textContent = '总览看板';
}

/* ---------------- 页面：数据集详情 ---------------- */
function pageDataset(key, tab) {
  var d = DATASETS[key];
  if (!d) { pageOverview(); return; }
  tab = tab || 'info';
  var v = $('#view');
  var tabs = [
    ['info', '概述与元数据'], ['dict', '数据字典'], ['preview', '数据预览'],
    ['explore', '数据探查'], ['quality', '质量报告'], ['handbook', '数据手册']
  ];
  var stats = window[d.statsVar] || {};

  v.innerHTML =
    '<div class="card"><div class="ds-head"><div>' +
    '<div class="ds-name" style="font-size:19px">' + d.idx + ' ' + d.name + ' <span class="tag ' + d.levelTag + '">' + d.level + '</span> <span class="tag">' + d.position + '</span></div>' +
    '<div class="ds-en">' + d.en + ' · ' + d.version + ' · 发布于 ' + d.pubdate + '</div></div>' +
    '<a class="btn" href="#/overview">← 返回目录</a></div>' +
    '<p style="margin-top:10px;font-size:13px;color:var(--ink-2)">' + d.desc + '</p></div>' +
    '<div class="tabs">' + tabs.map(function (t) {
      return '<button class="tab' + (t[0] === tab ? ' active' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>' +
    '<div id="tab-body"></div>';

  $$('.tab', v).forEach(function (b) {
    b.addEventListener('click', function () {
      location.hash = '#/dataset/' + key + '/' + this.getAttribute('data-tab');
    });
  });

  var body = $('#tab-body');
  if (tab === 'info') renderDsInfo(body, d);
  else if (tab === 'dict') renderDsDict(body, d);
  else if (tab === 'preview') renderDsPreview(body, d, stats);
  else if (tab === 'explore') renderDsExplore(body, d, stats);
  else if (tab === 'quality') renderDsQuality(body, d, stats);
  else if (tab === 'handbook') renderDsHandbook(body, d);

  $('#crumb').textContent = '数据集管理 / ' + d.name;
}

function renderDsInfo(body, d) {
  var kv =
    '<tr><td>数据集名称</td><td>' + d.name + '（' + d.en + '）</td></tr>' +
    '<tr><td>版本 / 状态</td><td>' + d.version + ' · 正式发布</td></tr>' +
    '<tr><td>创建机构</td><td>' + d.org + '</td></tr>' +
    '<tr><td>发布日期</td><td>' + d.pubdate + '</td></tr>' +
    '<tr><td>教学定位</td><td><span class="tag ' + d.levelTag + '">' + d.level + '</span> ' + d.position + '</td></tr>' +
    '<tr><td>数据时间范围</td><td>' + d.timespan + '</td></tr>' +
    '<tr><td>数据规模</td><td>' + d.scale + '（正式版口径，数据手册）</td></tr>' +
    '<tr><td>存储格式</td><td>' + d.format + '</td></tr>' +
    '<tr><td>本地样例</td><td>' + d.demoNote + '</td></tr>' +
    '<tr><td>联系方式</td><td>labs@shevdc.org（EVData Box 团队）</td></tr>' +
    '<tr><td>引用格式</td><td style="font-size:12px">上海市新能源汽车公共数据采集与监测研究中心EVData Box团队. ' + d.name + ' (v1.0) [Data set]. 2026.</td></tr>';

  var tables = d.tables.map(function (t) {
    return '<tr><td class="mono"><b>' + t.name + '</b></td><td>' + t.desc + '</td><td>' + t.rows + '</td></tr>';
  }).join('');
  var scenes = d.scenes.map(function (s) {
    return '<div class="ref-card"><div class="ref-name">' + s.name + ' <span class="tag">' + s.diff + '</span></div><div class="ref-point mt8">' + s.goal + '</div></div>';
  }).join('');
  var caveats = d.caveats.map(function (c) { return '<div class="note warn">' + c + '</div>'; }).join('');

  body.innerHTML =
    '<div class="two-col">' +
    '<div class="card mb0"><div class="card-title">元数据登记</div><table class="kv">' + kv + '</table></div>' +
    '<div class="card mb0"><div class="card-title">数据表清单</div><div class="table-wrap"><table class="tbl"><thead><tr><th>表名</th><th>说明</th><th>行数</th></tr></thead><tbody>' + tables + '</tbody></table></div>' +
    '<div class="card-title mt16">关联关系（ER 逻辑）</div><p style="font-size:12.5px;color:var(--ink-2)">' + d.relations + '</p></div>' +
    '</div>' +
    '<div class="card mt16"><div class="card-title">推荐教学实战场景</div><div class="grid grid-3 mb0">' + scenes + '</div></div>' +
    '<div class="card"><div class="card-title">适用边界与慎用建议</div>' + caveats + '</div>';
}

function renderDsDict(body, d) {
  if (!d.dictKey || !window.DATA_DICTS || !DATA_DICTS[d.dictKey]) {
    body.innerHTML = '<div class="note">该数据集字段级字典说明已收录于「数据手册」页签（字段级描述章节）。其中多车辆运行数据集与国标32960入门数据集的 vehicledata / vehicleposition 字典同构，另含 weather_info 天气维表 8 个字段；车型信息数据集的 22 + 29 个字段说明见数据手册 2.4 节。</div>';
    return;
  }
  var tables = DATA_DICTS[d.dictKey] || [];
  var opts = tables.map(function (t, i) { return '<option value="' + i + '">' + esc(t.title || t.sheet) + '</option>'; }).join('');
  body.innerHTML =
    '<div class="card"><div class="card-title">字段级数据字典<span class="card-sub">来源：官方数据字典 Excel，已结构化解析</span></div>' +
    '<div class="toolbar"><select id="dict-sheet">' + opts + '</select><span class="badge badge-red">L3-高敏感</span><span class="badge badge-orange">L2-中敏感</span><span class="badge badge-green">L1-低敏感</span></div>' +
    '<div id="dict-table"></div></div>';

  function sensBadge(v) {
    if (!v) return '';
    if (v.indexOf('L3') !== -1) return '<span class="badge badge-red">' + esc(v) + '</span>';
    if (v.indexOf('L2') !== -1) return '<span class="badge badge-orange">' + esc(v) + '</span>';
    return '<span class="badge badge-green">' + esc(v) + '</span>';
  }
  function showSheet(i) {
    var t = tables[i];
    var host = $('#dict-table');
    host.innerHTML = '';
    var cols = t.columns;
    // 敏感等级列徽标化（每次渲染后应用）
    var sensIdx = cols.findIndex(function (c) { return c.indexOf('敏感') !== -1; });
    dataTable(host, cols, t.rows, {
      pageSize: 14,
      onRender: sensIdx >= 0 ? function (wrapEl) {
        $$('tbody tr', wrapEl).forEach(function (tr) {
          var td = tr.children[sensIdx];
          if (td) td.innerHTML = sensBadge(td.textContent);
        });
      } : null
    });
  }
  $('#dict-sheet').addEventListener('change', function () { showSheet(Number(this.value)); });
  showSheet(0);
}

function renderDsPreview(body, d, stats) {
  body.innerHTML = '<div class="card"><div class="card-title">样本数据预览<span class="card-sub">' + d.demoNote + '；支持搜索、排序、分页</span></div><div id="pv"></div></div>';
  var host = $('#pv');
  var sample = stats.sample || stats.sample_cor;
  if (d.key === 'vehicle_model') {
    host.innerHTML = '<div class="toolbar"><select id="pv-which"><option value="cor">修正数据表 vehicle_model_correction_data</option><option value="raw">原始数据表 vehicle_model_raw_data</option></select></div><div id="pv-t"></div>';
    function show(which) {
      var rows = which === 'raw' ? stats.sample_raw : stats.sample_cor;
      var t = $('#pv-t'); t.innerHTML = '';
      dataTable(t, Object.keys(rows[0]), rows, { pageSize: 10 });
    }
    $('#pv-which').addEventListener('change', function () { show(this.value); });
    show('cor');
    return;
  }
  if (d.key === 'stay_charge') {
    host.innerHTML = '<div class="toolbar"><select id="pv-which"><option value="sample">停留事件主表 trip_stay_charge_data（DEMO）</option><option value="stations">充电站属性表 charge_station_info</option><option value="aoi">AOI 属性表 aoi_info</option><option value="vm">车型信息表 vehicle_model_info</option></select></div><div id="pv-t"></div>';
    function show2(which) {
      var rows = stats[which];
      var t = $('#pv-t'); t.innerHTML = '';
      dataTable(t, Object.keys(rows[0]), rows, { pageSize: 10 });
    }
    $('#pv-which').addEventListener('change', function () { show2(this.value); });
    show2('sample');
    return;
  }
  if (!sample || !sample.length) { host.innerHTML = '<div class="note">暂无样本</div>'; return; }
  var cols = Object.keys(sample[0]);
  // 精简过宽的列名前缀
  dataTable(host, cols, sample, { pageSize: 10 });
}

/* ---- 探查图表（按数据集定制，全部基于真实统计） ---- */
function renderDsExplore(body, d, stats) {
  var cid = 0;
  function chartCard(title, h) {
    cid++;
    return '<div class="card mb0"><div class="chart' + (h === 'lg' ? ' chart-lg' : '') + '" id="c' + cid + '"></div><div class="chart-note">' + (title || '') + '</div></div>';
  }
  var html = '<div class="note green">以下图表全部基于本地数据文件实测统计计算（Python 预聚合），非示意图。' + d.demoNote + '</div><div class="grid grid-2">';
  var builders = [];

  if (d.key === 'beginner') {
    html += chartCard('整车 15 个遥测字段中，车辆状态/充电状态枚举分布（已剔除 254/255 异常无效码）');
    html += chartCard('');
    html += chartCard('SOC 剩余电量分布（%），样例车辆存在明显的高 SOC 停车充电段');
    html += chartCard('车速分布（km/h），0 速占比高 → 停车/充电/熄火场景占主导');
    html += chartCard('总电压分布（V），不同车型电压平台差异清晰可见（约 330V / 400V / 500V）');
    html += chartCard('总电流分布（A），负值放电、正值充电（国标口径）');
    html += '</div><div class="card"><div class="card-title">单车画像（DEMO 实测）</div><div id="beg-t"></div></div>';
    body.innerHTML = html;
    makeChart('c1', pieOption('车辆状态分布', stats.dist_vehiclestatus));
    makeChart('c2', pieOption('充电状态分布', stats.dist_chargestatus));
    makeChart('c3', histOption('SOC 分布直方图', stats.hist_soc, '%', '#13c2c2'));
    makeChart('c4', histOption('车速分布直方图', stats.hist_speed, 'km/h', '#722ed1'));
    makeChart('c5', histOption('总电压分布直方图', stats.hist_voltage, 'V', '#fa8c16'));
    makeChart('c6', histOption('总电流分布直方图', stats.hist_current, 'A', '#eb2f96'));
    var rows = stats.vehicles.map(function (x) {
      return {
        '车辆ID': x.id, '记录数': x.rows, '车型代码': x.model,
        '采样间隔中位数(s)': x.interval_median_s, '平均SOC(%)': Math.round(x.soc_mean * 10) / 10,
        '累计里程起点(km)': x.mileage_start, '累计里程终点(km)': x.mileage_end,
        '定位缺失率(%)': Math.round(x.pos_null_pct * 10) / 10
      };
    });
    dataTable($('#beg-t'), Object.keys(rows[0]), rows, { noSearch: true, pageSize: 10 });
    return;
  }

  if (d.key === 'more_vehicle') {
    html += chartCard('充电状态构成：群体样本中停车充电/行驶充电/未充电占比');
    html += chartCard('');
    html += chartCard('群体 SOC 分布：样本车辆 SOC 集中于 75% 以上高电量区间');
    html += chartCard('群体车速分布：低速段与 0 速占主体，符合城市工况特征');
    html += chartCard('空间分布散点（经度 × 纬度）：样本车辆活动范围覆盖上海嘉定及周边（121.30°E~121.58°E，30.75°N~31.29°N）');
    html += '</div>';
    body.innerHTML = html;
    makeChart('c1', pieOption('充电状态分布', stats.dist_chargestatus));
    makeChart('c2', pieOption('车辆状态分布', stats.dist_vehiclestatus));
    makeChart('c3', histOption('SOC 分布直方图', stats.hist_soc, '%', '#13c2c2'));
    makeChart('c4', histOption('车速分布直方图', stats.hist_speed, 'km/h', '#722ed1'));
    makeChart('c5', {
      title: {
        text: '车辆空间分布散点', left: 8, top: 6,
        textStyle: { fontSize: 13.5, fontWeight: 700, color: '#0f172a', fontFamily: CHART_FONT },
        subtext: '每一点代表一次车辆上报，越密集说明车辆越常在此活动',
        subtextStyle: { fontSize: 11, color: '#94a3b8' }, itemGap: 4
      },
      grid: chartGrid(72),
      tooltip: { formatter: function (p) { return '经度 ' + p.value[0].toFixed(4) + '<br>纬度 ' + p.value[1].toFixed(4) + '<br>车速 ' + p.value[2] + ' km/h<br>SOC ' + p.value[3] + '%'; } },
      xAxis: { type: 'value', name: '经度', scale: true, nameTextStyle: chartText({ fontSize: 11 }), axisLabel: chartText({ fontSize: 10.5 }), splitLine: { lineStyle: { color: '#f1f5f9' } } },
      yAxis: { type: 'value', name: '纬度', scale: true, nameTextStyle: chartText({ fontSize: 11 }), axisLabel: chartText({ fontSize: 10.5 }), splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series: [{ type: 'scatter', data: stats.points, symbolSize: 6, itemStyle: { color: '#4f46e5', opacity: 0.5 } }]
    });
    return;
  }

  if (d.key === 'long_period') {
    html += chartCard('电池单体电压最高值分布：磷酸铁锂（约 3.3V）与三元锂（约 3.7V+）体系分峰清晰');
    html += chartCard('单体压差（最高-最低）分布：压差集中于 0.05V 以内，压差过大提示一致性劣化');
    html += chartCard('电池最高温度分布（℃）：样本采集于年初低温时段');
    html += chartCard('SOC 均值随日期变化：DEMO 覆盖日期 0101—0103');
    html += chartCard('');
    html += '</div>';
    body.innerHTML = html;
    makeChart('c1', histOption('电池单体电压最高值分布', stats.hist_cellvolt_max, 'V', '#2f54eb'));
    makeChart('c2', histOption('电池单体压差分布', stats.hist_cellvolt_diff, 'V', '#fa541c'));
    makeChart('c3', histOption('电池最高温度分布', stats.hist_tmp_max, '℃', '#fa8c16'));
    makeChart('c4', {
      title: {
        text: 'SOC 日均值变化', left: 8, top: 6,
        textStyle: { fontSize: 13.5, fontWeight: 700, color: '#0f172a', fontFamily: CHART_FONT }
      },
      grid: chartGrid(64),
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: stats.soc_by_date.map(function (x) { return x.date; }), name: '日期(Mdd)', nameTextStyle: chartText({ fontSize: 11 }), axisLabel: chartText({ fontSize: 11 }) },
      yAxis: { type: 'value', name: '平均 SOC(%)', nameTextStyle: chartText({ fontSize: 11 }), axisLabel: chartText({ fontSize: 11 }), splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series: [{ type: 'line', data: stats.soc_by_date.map(function (x) { return x.soc; }), smooth: true, areaStyle: { opacity: 0.15 }, itemStyle: { color: '#10b981' }, symbolSize: 7 }]
    });
    makeChart('c5', pieOption('充电状态分布', stats.dist_chargestatus));
    return;
  }

  if (d.key === 'vehicle_model') {
    html += chartCard('100 款典型车型动力类型构成（修正表口径）');
    html += chartCard('动力类型补充标识：增程 6 款、换电式 2 款');
    html += chartCard('车辆级别分布：A/B/C 级为主力，覆盖 A00—D 全级别');
    html += chartCard('车辆类型分布：SUV 与 Sedan 为主，含物流、环卫、客车等商用车型');
    html += chartCard('综合续航分布（km，派生字段口径）：主流集中在 300—600km');
    html += chartCard('厂商指导价（起）分布（万元）：10—25 万元为主力价格带');
    html += chartCard('销售品牌车型数 TOP12：宇通、比亚迪、埃安领衔');
    html += chartCard('企业性质构成：自主 74%、合资 22%、外资 4%');
    html += '</div><div class="card"><div class="card-title">数据治理前后对比（clean-before / clean-after）<span class="card-sub">原始表 vs 修正表字段缺失率实测</span></div><div class="chart chart-lg" id="cgov"></div><div class="chart-note">治理动作：单位归一（kg/mm/km/kW/kWh）、枚举标准化（BEV/PHEV/FCEV）、品牌名称归一、空值补全。原始表 brand_name 存在异体写法（如含"牌"后缀），修正表统一归一。</div></div>';
    body.innerHTML = html;
    makeChart('c1', pieOption('动力类型分布', stats.dist_power_type));
    makeChart('c2', pieOption('动力类型补充标识', stats.dist_power_add));
    makeChart('c3', barOption('车辆级别分布', stats.dist_car_level, { label: true }));
    makeChart('c4', barOption('车辆类型分布', stats.dist_vehicle_type));
    makeChart('c5', histOption('综合续航分布', stats.hist_endurance, 'km', '#13c2c2'));
    makeChart('c6', histOption('厂商指导价（起）分布', stats.hist_price_from, '万元', '#722ed1'));
    makeChart('c7', barOption('品牌车型数 TOP12', stats.top_brands, { horizontal: true, left: 80, bottom: 30 }));
    makeChart('c8', pieOption('企业性质构成', stats.dist_enterprise));
    makeChart('cgov', {
      title: {
        text: '治理前后字段缺失率对比', left: 8, top: 6,
        textStyle: { fontSize: 13.5, fontWeight: 700, color: '#0f172a', fontFamily: CHART_FONT },
        subtext: '柱子越低代表数据越完整，绿色（治理后）普遍低于橙色（治理前）',
        subtextStyle: { fontSize: 11, color: '#94a3b8' }, itemGap: 4
      },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 4, textStyle: chartText({ fontSize: 11.5 }), itemWidth: 12, itemHeight: 8, icon: 'roundRect' },
      grid: chartGrid(84, { bottom: 46 }),
      xAxis: {
        type: 'category', data: stats.gov_compare.map(function (x) { return x.label + '\n' + x.raw_field; }),
        axisLabel: { fontSize: 10.5, hideOverlap: true, interval: 0, margin: 10, color: '#475569' },
        axisLine: { lineStyle: { color: '#e2e8f0' } }
      },
      yAxis: { type: 'value', name: '缺失率(%)', max: 100, nameTextStyle: chartText({ fontSize: 11 }), axisLabel: chartText({ fontSize: 11 }), splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series: [
        { name: '原始表（治理前）', type: 'bar', data: stats.gov_compare.map(function (x) { return x.raw_null_pct; }), itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] }, barMaxWidth: 22, label: { show: true, position: 'top', fontSize: 10, color: '#b45309', fontFamily: CHART_FONT } },
        { name: '修正表（治理后）', type: 'bar', data: stats.gov_compare.map(function (x) { return x.cor_null_pct; }), itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] }, barMaxWidth: 22, label: { show: true, position: 'top', fontSize: 10, color: '#047857', fontFamily: CHART_FONT } }
      ]
    });
    return;
  }

  if (d.key === 'stay_charge') {
    html += chartCard('24 小时停留开始 vs 充电开始节律：晚高峰 18—22 时为充电主高峰，22 时出现充电峰值');
    html += chartCard('日期类型构成：工作日 76.2%、休息日 21.2%、法定节假日 2.6%');
    html += chartCard('星期分布（week_n 真实分布）：周五停留事件最多');
    html += chartCard('停留时长分布（分钟）：约 1/3 为 10—60 分钟短停，长尾为过夜长停（平均 526 分钟）');
    html += chartCard('充电时长分布（分钟）：平均充电时长 170 分钟');
    html += chartCard('最大充电功率分布（kW）：以 60kW 以下为主，另有 90kW+ 快充段');
    html += chartCard('充电站使用对比：12530 超充站（36 快充枪）承接最多充电事件');
    html += chartCard('AOI 停留热度 TOP：商业广场与大型社区为主要停留目的地');
    html +=     '</div>' +
      '<div class="grid grid-4"><div class="stat-card"><div class="stat-num">' + stats.charge_pct + '<small>%</small></div><div class="stat-label">停留事件中含充电行为占比</div><div class="stat-hint">约每 5 次停留就有 1 次顺带充电</div></div>' +
      '<div class="stat-card"><div class="stat-num">' + stats.avg_stop_dur_min + '<small> 分钟</small></div><div class="stat-label">平均停留时长</div><div class="stat-hint">含过夜长停，均值被长尾拉高</div></div>' +
      '<div class="stat-card"><div class="stat-num">' + stats.avg_charge_dur_min + '<small> 分钟</small></div><div class="stat-label">平均充电时长</div><div class="stat-hint">以慢充为主的补能习惯</div></div>' +
      '<div class="stat-card"><div class="stat-num">' + stats.soc_gain.start + '%→' + stats.soc_gain.end + '%</div><div class="stat-label">充电起止平均 SOC</div><div class="stat-hint">一次充电平均补电量约 ' + (stats.soc_gain.end - stats.soc_gain.start) + ' 个百分点</div></div></div>';
    body.innerHTML = html;

    var hours = []; for (var h = 0; h < 24; h++) hours.push(h);
    var stayMap = {}, chMap = {};
    stats.hourly_stays.forEach(function (x) { stayMap[x.h] = x.v; });
    stats.hourly_charge.forEach(function (x) { chMap[x.h] = x.v; });
    makeChart('c1', {
      title: {
        text: '24 小时行为节律', left: 8, top: 6,
        textStyle: { fontSize: 13.5, fontWeight: 700, color: '#0f172a', fontFamily: CHART_FONT },
        subtext: '横轴为一天 24 小时，曲线越高代表该时段开始的停留/充电越多',
        subtextStyle: { fontSize: 11, color: '#94a3b8' }, itemGap: 4
      },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 4, textStyle: chartText({ fontSize: 11.5 }), itemWidth: 14, itemHeight: 3, icon: 'rect' },
      grid: chartGrid(84, { bottom: 46 }),
      xAxis: { type: 'category', data: hours.map(function (x) { return x + '时'; }), axisLabel: chartText({ fontSize: 10.5, hideOverlap: true }), axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', name: '事件数', nameTextStyle: chartText({ fontSize: 11 }), axisLabel: chartText({ fontSize: 11 }), splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series: [
        { name: '停留开始', type: 'line', smooth: true, data: hours.map(function (x) { return stayMap[x] || 0; }), itemStyle: { color: '#4f46e5' }, lineStyle: { width: 2.5 }, areaStyle: { opacity: 0.1 }, symbolSize: 5 },
        { name: '充电开始', type: 'line', smooth: true, data: hours.map(function (x) { return chMap[x] || 0; }), itemStyle: { color: '#f59e0b' }, lineStyle: { width: 2.5 }, areaStyle: { opacity: 0.1 }, symbolSize: 5 }
      ]
    });
    makeChart('c2', pieOption('日期类型构成', stats.dist_daytype));
    makeChart('c3', barOption('星期分布（周1=周一）', stats.dist_week, { label: true }));
    makeChart('c4', histOption('停留时长分布', stats.hist_stop_dur, '分钟', '#2f54eb'));
    makeChart('c5', histOption('充电时长分布', stats.hist_charge_dur, '分钟', '#13c2c2'));
    makeChart('c6', histOption('最大充电功率分布', stats.hist_max_power, 'kW', '#722ed1'));
    var stItems = stats.station_use.map(function (s) {
      return { k: s['站点名'] + '（' + s.cdz_id + '）', v: Number(s.events) };
    });
    makeChart('c7', barOption('各充电站充电事件数', stItems, { label: true }));
    var aoiItems = stats.aoi_top.slice(0, 8).map(function (a) {
      return { k: a['aoi名称'], v: Number(a.stays) };
    });
    makeChart('c8', barOption('AOI 停留热度 TOP8', aoiItems, { horizontal: true, left: 150, bottom: 30 }));
    return;
  }
}

/* ---- 质量报告 ---- */
function renderDsQuality(body, d, stats) {
  var checks = [];
  if (d.key === 'beginner' && stats.quality) {
    var q = stats.quality;
    checks = [
      ['定位结构完整率', 'vehicleposition 非空记录占比', (100 - q.pos_null_pct).toFixed(1) + '%', q.pos_null_pct < 5 ? 'pass' : 'warn'],
      ['坐标(0,0)占比', '经纬度同时为 0 的不可用坐标', q.coord_zero_pct.toFixed(1) + '%', q.coord_zero_pct < 5 ? 'pass' : 'warn'],
      ['无效定位标记占比', 'locationstate=1（无效定位）', q.locationstate_invalid_pct.toFixed(1) + '%', q.locationstate_invalid_pct < 10 ? 'pass' : 'warn'],
      ['国标异常/无效码检出', '254/255/65534/65535/4294967294 等', Object.keys(q.invalid_codes).reduce(function (s, k) { return s + q.invalid_codes[k]; }, 0) + ' 条', 'pass'],
      ['同车同时刻重复记录', '(evdata_vehicle_id, date, time) 重复', q.dup_key_rows + ' 条（占 ' + (q.dup_key_rows / stats.rows_total * 100).toFixed(1) + '%）', q.dup_key_rows > 0 ? 'warn' : 'pass'],
      ['累计里程回退点', 'summileage 应只增不减', q.mileage_decrease_points + ' 处', q.mileage_decrease_points === 0 ? 'pass' : 'warn']
    ];
  } else if (d.key === 'more_vehicle') {
    checks = [
      ['维表外键命中率', 'origin_data.vehicle_model_seq 命中车型维表', '100%（数据手册校验结论）', 'pass'],
      ['主键唯一性', 'vehicle_model_info.vehicle_model_seq 唯一', '通过（数据手册校验结论）', 'pass'],
      ['样本定位有效率', 'DEMO 样本 locationstate=0 占比', '100%（本地实测）', 'pass'],
      ['已知问题：无效定位风险', '正式版空间分析前须过滤 locationstate=2 与无效坐标', '分析侧过滤（手册规则）', 'warn'],
      ['已知问题：数据冗余', '车辆静止时持续上报高度相似数据', '群体统计时按车辆状态去重（手册建议）', 'warn']
    ];
  } else if (d.key === 'long_period') {
    checks = [
      ['车辆分区完整性', 'origin_data 覆盖 100 辆车，每辆分区均非空', '通过（数据手册校验结论）', 'pass'],
      ['外键引用完整性', 'origin_data.vehicle_model_seq 全部命中维表', '100%（数据手册校验结论）', 'pass'],
      ['DEMO 发动机数据占比', 'PHEV 车辆 enginedata 非空比例', stats.engine_present_pct ? stats.engine_present_pct.toFixed(1) + '%（本地实测，符合 PHEV 样本构成）' : '—', 'pass'],
      ['已知问题：时间空白', '停车熄火后不采集数据', '未处理，可结合累计里程判断（手册说明）', 'warn'],
      ['已知问题：采样频率不一', '10s / 30s 两种采集间隔并存', '未处理，跨车比较需做采样频率敏感性检查', 'warn']
    ];
  } else if (d.key === 'vehicle_model') {
    var gov = stats.gov_compare || [];
    checks = gov.map(function (g) {
      var improved = g.cor_null_pct <= g.raw_null_pct;
      return [g.label + '（' + g.raw_field + ' → ' + g.cor_field + '）', '治理前后缺失率对比', g.raw_null_pct + '% → ' + g.cor_null_pct + '%', improved ? 'pass' : 'warn'];
    });
    checks.push(['动力类型枚举一致性', '修正表仅允许 BEV/PHEV/FCEV', '通过（实测仅 ' + (stats.dist_power_type || []).map(function (x) { return x.k; }).join('/') + '）', 'pass']);
    checks.push(['尺寸字段交叉验证', '修正表 length×width×height 与原始表 size_lwh 拆分值 ±5mm 内一致', '治理规则校验（手册 3.3）', 'pass']);
  } else if (d.key === 'stay_charge') {
    checks = [
      ['枚举值校验', 'day_type / week_n / vehicle_power_type 枚举', '通过（数据手册校验结论）', 'pass'],
      ['外键引用完整性', 'evdata_model_id / cdz_id / uid 外键引用', '通过（cdz_id、uid 允许按业务规则为空）', 'pass'],
      ['时间逻辑一致性', '起止先后、时长一致性、充电时段包含于停留时段', '通过（数据手册校验结论）', 'pass'],
      ['DEMO 充电记录占比', 'charge_or_not=1 记录占比', stats.charge_pct + '%（本地实测）', 'pass'],
      ['口径提示：日期脱敏', '日期偏移后不与 week_n/day_type 对应', '时间维度分析应使用 week_n 与 day_type（手册避坑 3）', 'warn'],
      ['口径提示：10 分钟过滤', '停留不足 10 分钟且未充电记录已过滤', '周转率分析不可外推至全部到访车辆', 'warn']
    ];
  }
  var rowsHtml = checks.map(function (c) {
    var badge = c[3] === 'pass' ? '<span class="badge badge-green">通过</span>' : '<span class="badge badge-orange">关注</span>';
    return '<tr><td><b>' + c[0] + '</b></td><td>' + c[1] + '</td><td>' + c[2] + '</td><td>' + badge + '</td></tr>';
  }).join('');

  body.innerHTML =
    '<div class="two-col">' +
    '<div class="card mb0"><div class="card-title">数据质量五维评估<span class="card-sub">参照 GB/T 36344-2018《信息技术 数据质量评价指标》</span></div>' +
    '<div class="chart chart-lg" id="qradar"></div><div class="chart-note">' + d.radarNote + '</div></div>' +
    '<div class="card mb0"><div class="card-title">质量检测项明细<span class="card-sub">本地 DEMO 实测 + 数据手册校验结论</span></div>' +
    '<div class="table-wrap"><table class="tbl"><thead><tr><th>检测项</th><th>检测规则/依据</th><th>检测结果</th><th>判定</th></tr></thead><tbody>' + rowsHtml + '</tbody></table></div></div>' +
    '</div>' +
    '<div class="card"><div class="card-title">质量检测规则库（GB/T 32960 异常码约定）</div>' +
    '<div class="table-wrap"><table class="tbl"><thead><tr><th>规则编码</th><th>含义</th><th>适用字段类型</th><th>处理建议</th></tr></thead><tbody>' +
    '<tr><td class="mono">254 (0xFE)</td><td>异常值</td><td>单字节枚举/整数（状态、SOC 等）</td><td>过滤或置 NULL 后参与统计</td></tr>' +
    '<tr><td class="mono">255 (0xFF)</td><td>无效值</td><td>单字节枚举/整数</td><td>过滤或置 NULL 后参与统计</td></tr>' +
    '<tr><td class="mono">65534 / 65535</td><td>异常 / 无效</td><td>双字节数值（车速、电压、电流、转速等）</td><td>过滤或置 NULL</td></tr>' +
    '<tr><td class="mono">4294967294 / 4294967295</td><td>异常 / 无效</td><td>四字节数值（累计里程）</td><td>过滤或置 NULL；里程只增不减可用于连续性校验</td></tr>' +
    '<tr><td class="mono">(0, 0) 坐标</td><td>坐标不可用/待判定</td><td>经纬度</td><td>不作为真实地理位置参与距离、围栏或地图分析</td></tr>' +
    '</tbody></table></div></div>';

  makeChart('qradar', {
    title: {
      text: '数据质量五维评分', left: 8, top: 6,
      textStyle: { fontSize: 13.5, fontWeight: 700, color: '#0f172a', fontFamily: CHART_FONT },
      subtext: '满分 100，覆盖越满代表该维度质量越好',
      subtextStyle: { fontSize: 11, color: '#94a3b8' }, itemGap: 4
    },
    tooltip: {},
    radar: {
      indicator: [
        { name: '完整性', max: 100 }, { name: '规范性', max: 100 }, { name: '准确性', max: 100 },
        { name: '一致性', max: 100 }, { name: '时效性', max: 100 }
      ],
      radius: '58%', center: ['50%', '56%'],
      axisName: { fontSize: 12, color: '#475569', fontFamily: CHART_FONT, padding: [2, 4] },
      nameGap: 10,
      splitArea: { areaStyle: { color: ['#f8fafc', '#eef2ff'] } },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
      axisLine: { lineStyle: { color: '#e2e8f0' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: d.radar, name: d.name,
        areaStyle: { color: 'rgba(79,70,229,.16)' }, itemStyle: { color: '#4f46e5' },
        lineStyle: { width: 2.5 },
        label: { show: true, fontSize: 10.5, color: '#4338ca', fontFamily: CHART_FONT, formatter: '{c}' }
      }]
    }]
  });
}

function renderDsHandbook(body, d) {
  var md = (window.DATA_HANDBOOKS || {})[d.key] || '暂无数据手册内容';
  body.innerHTML =
    '<div class="note">以下为官方数据手册（Datasheet）原文，随数据集一并发布；原始文件已收录于 handbooks 目录。</div>' +
    '<div class="card"><div class="md">' + renderMarkdown(md) + '</div></div>';
}

/* ---------------- 页面：数据探查中心 ---------------- */
function pageExplore() {
  var v = $('#view');
  v.innerHTML =
    '<div class="section-title">数据探查中心</div>' +
    '<div class="section-desc">不用写一行代码，直接看图理解数据：下面精选了各数据集最有价值的 4 张实测图表，每张图下方都有一句话读图指引。</div>' +
    '<div class="note green">跨数据集综合探查视图：精选各数据集最具教学价值的实测图表，全部基于本地数据文件统计计算。</div>' +
    '<div class="grid grid-2">' +
    '<div class="card mb0"><div class="chart chart-lg" id="x1"></div><div class="chart-note">停留与充电行为数据集 · 24 小时行为节律：18—22 时晚高峰是充电需求主峰，22 时充电开始数最高（电网峰谷定价与场站排班的关键依据）</div></div>' +
    '<div class="card mb0"><div class="chart chart-lg" id="x2"></div><div class="chart-note">多车辆运行数据集 · 空间分布：样本车辆活动范围覆盖上海嘉定及周边区域，可用于城市热力与充电设施规划练习</div></div>' +
    '<div class="card mb0"><div class="chart chart-lg" id="x3"></div><div class="chart-note">车型信息数据集 · 数据治理前后缺失率对比：直观呈现单位归一、枚举标准化、空值补全等治理动作的价值</div></div>' +
    '<div class="card mb0"><div class="chart chart-lg" id="x4"></div><div class="chart-note">长周期运行数据集 · 电池单体电压最高值分布：磷酸铁锂与三元锂两大技术路线分峰清晰，是电池体系识别与一致性诊断的入门样本</div></div>' +
    '</div>' +
    '<div class="card"><div class="card-title">五大数据集多维对比</div><div class="table-wrap"><table class="tbl"><thead><tr><th>维度</th>' +
    DS_ORDER.map(function (k) { return '<th>' + DATASETS[k].name.replace('新能源汽车', '') + '</th>'; }).join('') +
    '</tr></thead><tbody>' +
    ['level', 'position', 'timespan', 'scale', 'format'].map(function (attr) {
      var label = { level: '教学难度', position: '教学定位', timespan: '时间跨度', scale: '数据规模', format: '存储格式' }[attr];
      return '<tr><td><b>' + label + '</b></td>' + DS_ORDER.map(function (k) { return '<td>' + DATASETS[k][attr] + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table></div></div>';

  $('#crumb').textContent = '数据探查中心';

  var sc = window.DATA_STAY_CHARGE;
  var hours = []; for (var h = 0; h < 24; h++) hours.push(h);
  var stayMap = {}, chMap = {};
  sc.hourly_stays.forEach(function (x) { stayMap[x.h] = x.v; });
  sc.hourly_charge.forEach(function (x) { chMap[x.h] = x.v; });
  makeChart('x1', {
    title: {
      text: '24 小时停留 / 充电行为节律', left: 8, top: 6,
      textStyle: { fontSize: 13.5, fontWeight: 700, color: '#0f172a', fontFamily: CHART_FONT },
      subtext: '横轴为一天 24 小时，曲线越高代表该时段开始的停留/充电越多',
      subtextStyle: { fontSize: 11, color: '#94a3b8' }, itemGap: 4
    },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 4, textStyle: chartText({ fontSize: 11.5 }), itemWidth: 14, itemHeight: 3, icon: 'rect' },
    grid: chartGrid(84, { bottom: 46 }),
    xAxis: { type: 'category', data: hours.map(function (x) { return x + '时'; }), axisLabel: chartText({ fontSize: 10.5, hideOverlap: true }), axisLine: { lineStyle: { color: '#e2e8f0' } } },
    yAxis: { type: 'value', name: '事件数', nameTextStyle: chartText({ fontSize: 11 }), axisLabel: chartText({ fontSize: 11 }), splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [
      { name: '停留开始', type: 'line', smooth: true, data: hours.map(function (x) { return stayMap[x] || 0; }), itemStyle: { color: '#4f46e5' }, lineStyle: { width: 2.5 }, areaStyle: { opacity: 0.1 }, symbolSize: 5 },
      { name: '充电开始', type: 'line', smooth: true, data: hours.map(function (x) { return chMap[x] || 0; }), itemStyle: { color: '#f59e0b' }, lineStyle: { width: 2.5 }, areaStyle: { opacity: 0.1 }, symbolSize: 5 }
    ]
  });
  var mv = window.DATA_MORE_VEHICLE;
  makeChart('x2', {
    title: {
      text: '车辆空间分布散点', left: 8, top: 6,
      textStyle: { fontSize: 13.5, fontWeight: 700, color: '#0f172a', fontFamily: CHART_FONT },
      subtext: '每一点代表一次车辆上报，越密集说明车辆越常在此活动',
      subtextStyle: { fontSize: 11, color: '#94a3b8' }, itemGap: 4
    },
    grid: chartGrid(72),
    tooltip: { formatter: function (p) { return '经度 ' + p.value[0].toFixed(4) + '<br>纬度 ' + p.value[1].toFixed(4); } },
    xAxis: { type: 'value', name: '经度', scale: true, nameTextStyle: chartText({ fontSize: 11 }), axisLabel: chartText({ fontSize: 10.5 }), splitLine: { lineStyle: { color: '#f1f5f9' } } },
    yAxis: { type: 'value', name: '纬度', scale: true, nameTextStyle: chartText({ fontSize: 11 }), axisLabel: chartText({ fontSize: 10.5 }), splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [{ type: 'scatter', data: mv.points, symbolSize: 6, itemStyle: { color: '#0ea5e9', opacity: 0.5 } }]
  });
  var vm = window.DATA_VEHICLE_MODEL;
  makeChart('x3', {
    title: {
      text: '数据治理前后字段缺失率对比', left: 8, top: 6,
      textStyle: { fontSize: 13.5, fontWeight: 700, color: '#0f172a', fontFamily: CHART_FONT },
      subtext: '柱子越低代表数据越完整，绿色（治理后）普遍低于橙色（治理前）',
      subtextStyle: { fontSize: 11, color: '#94a3b8' }, itemGap: 4
    },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 4, textStyle: chartText({ fontSize: 11.5 }), itemWidth: 12, itemHeight: 8, icon: 'roundRect' },
    grid: chartGrid(84, { bottom: 46 }),
    xAxis: {
      type: 'category', data: vm.gov_compare.map(function (x) { return x.label; }),
      axisLabel: { fontSize: 10.5, hideOverlap: true, interval: 0, margin: 10, color: '#475569' },
      axisLine: { lineStyle: { color: '#e2e8f0' } }
    },
    yAxis: { type: 'value', name: '缺失率(%)', max: 100, nameTextStyle: chartText({ fontSize: 11 }), axisLabel: chartText({ fontSize: 11 }), splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [
      { name: '原始表（治理前）', type: 'bar', data: vm.gov_compare.map(function (x) { return x.raw_null_pct; }), itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] }, barMaxWidth: 24 },
      { name: '修正表（治理后）', type: 'bar', data: vm.gov_compare.map(function (x) { return x.cor_null_pct; }), itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] }, barMaxWidth: 24 }
    ]
  });
  var lp = window.DATA_LONG_PERIOD;
  makeChart('x4', histOption('电池单体电压最高值分布', lp.hist_cellvolt_max, 'V', '#2f54eb'));
}

/* ---------------- 页面：案例参考 ---------------- */
function pageReferences() {
  var refs = [
    {
      name: 'Kaggle Datasets', url: 'https://www.kaggle.com/datasets',
      point: '<b>借鉴内容：</b>数据集详情页「Overview / Data / Code」分区结构与右侧元数据栏设计。本工作台的「概述与元数据 / 数据字典 / 数据预览 / 数据探查 / 质量报告 / 数据手册」六页签即在此基础上按教研场景扩展（新增质量报告与数据手册页签）；数据集卡片的标签、规模、教学定位摘要样式亦参考其卡片规范。'
    },
    {
      name: '天池实验室 · 数据集', url: 'https://tianchi.aliyun.com/dataset',
      point: '<b>借鉴内容：</b>「数据集 + 教学/竞赛场景」的组织方式——每个数据集挂载明确的实战场景与学习路径。本工作台的「推荐教学实战场景」卡片与总览页「教研链路全景」步骤条即参照该思路，将 5 个数据集串成入门到综合的教学路径。'
    },
    {
      name: 'OpenDataLab（上海人工智能实验室）', url: 'https://opendatalab.com',
      point: '<b>借鉴内容：</b>数据集在线预览与数据可视化能力——在不下载数据的前提下查看样本与分布。本工作台的「数据预览」（搜索/排序/分页）与「数据探查」（真实统计直方图、状态占比、时空散点）即对标该体验，且全部图表基于本地数据实测统计。'
    },
    {
      name: '上海市公共数据开放平台', url: 'https://data.sh.gov.cn',
      point: '<b>借鉴内容：</b>数据目录的组织规范——按主题分类、标签筛选、元数据登记（更新频率、格式、来源）。本工作台「元数据登记」表与顶部标签体系（版本、格式、来源机构）参照其目录规范设计。'
    },
    {
      name: '科学数据银行 ScienceDB', url: 'https://www.scidb.cn',
      point: '<b>借鉴内容：</b>科研数据的规范化引用与版本管理——每个数据集提供标准引用格式与版本记录。本工作台在元数据中收录版本号、发布日期与 BibTeX/文本引用格式，遵循其数据出版规范。'
    },
    {
      name: '国家基础学科公共科学数据中心', url: 'https://www.nbsdc.cn',
      point: '<b>借鉴内容：</b>元数据标准与数据质量分级描述——按学科/主题体系化组织元数据，并对数据质量分级标注。本工作台的敏感等级（L1/L2/L3）标识与 GB/T 36344-2018 五维质量评估即参照其质量分级思路落地。'
    }
  ];
  var mapping = [
    ['数据集卡片 + 标签体系', 'Kaggle / 上海市公共数据开放平台', '总览看板数据集目录卡片'],
    ['详情页多页签结构', 'Kaggle Datasets', '概述/字典/预览/探查/质量/手册六页签'],
    ['样本在线预览（免下载）', 'OpenDataLab', '数据预览页签（搜索/排序/分页）'],
    ['分布可视化探查', 'OpenDataLab / Kaggle', '数据探查页签与探查中心（实测统计图表）'],
    ['教学场景挂载', '天池实验室', '推荐教学实战场景卡片 + 教研链路步骤条'],
    ['版本与标准引用', '科学数据银行 ScienceDB', '元数据登记中的版本、引用格式'],
    ['质量分级与元数据标准', '国家基础学科公共科学数据中心', '敏感等级徽标 + 五维质量雷达'],
    ['目录元数据规范', '上海市公共数据开放平台', '元数据登记表（机构/日期/格式/规模）']
  ];
  $('#view').innerHTML =
    '<div class="section-title">案例参考</div>' +
    '<div class="section-desc">本工作台在设计时参考了以下 6 个成熟数据平台的公开页面，下表逐一说明「参考了什么、用在了哪里」。</div>' +
    '<div class="note">按赛题要求，工作台设计系统参考了以下主流数据开放平台与科学数据管理平台的成熟做法，下表说明每个平台被借鉴的具体内容及其在本作品中的落地位置。</div>' +
    '<div class="grid grid-3">' + refs.map(function (r) {
      return '<div class="ref-card"><div class="ref-name">' + r.name + '</div><div class="ref-url">' + r.url + '</div><div class="ref-point">' + r.point + '</div></div>';
    }).join('') + '</div>' +
    '<div class="card"><div class="card-title">借鉴点 → 本作品落地对照</div><div class="table-wrap"><table class="tbl"><thead><tr><th>借鉴的设计要素</th><th>参考来源</th><th>本作品实现位置</th></tr></thead><tbody>' +
    mapping.map(function (m) { return '<tr><td>' + m[0] + '</td><td>' + m[1] + '</td><td><b>' + m[2] + '</b></td></tr>'; }).join('') +
    '</tbody></table></div></div>';
  $('#crumb').textContent = '案例参考';
}

/* ---------------- 页面：关于 ---------------- */
function pageAbout() {
  $('#view').innerHTML =
    '<div class="section-title">关于与使用说明</div>' +
    '<div class="section-desc">这是什么、怎么打开、数据从哪来、依据什么标准——关于本工作台的常见问题都在这里。</div>' +
    '<div class="two-col">' +
    '<div class="card mb0"><div class="card-title">使用说明</div>' +
    '<p style="font-size:13px">本工作台为<b>纯离线</b>本地应用，无需联网、无需安装任何环境：</p>' +
    '<ol style="font-size:13px;margin:8px 0 8px 20px">' +
    '<li>双击 <code>index.html</code>，使用 Chrome / Edge 等现代浏览器打开即可；</li>' +
    '<li>左侧导航切换「总览看板 / 5 个数据集 / 数据探查中心 / 案例参考」；</li>' +
    '<li>数据集详情内通过页签使用「概述与元数据 / 数据字典 / 数据预览 / 数据探查 / 质量报告 / 数据手册」；</li>' +
    '<li>所有图表与统计数据均已预计算并内置，断网状态可完整使用。</li></ol>' +
    '<div class="note warn">请保持 workbench 目录结构完整（index.html、assets、jsdata、handbooks 四部分缺一不可）。</div></div>' +
    '<div class="card mb0"><div class="card-title">技术架构</div>' +
    '<table class="kv">' +
    '<tr><td>前端</td><td>原生 HTML / CSS / JavaScript（零依赖 SPA，哈希路由）</td></tr>' +
    '<tr><td>可视化</td><td>Apache ECharts 5.5.1（已本地化至 assets，离线可用）</td></tr>' +
    '<tr><td>数据加工</td><td>Python（pandas / pyarrow / openpyxl）：解析 PARQUET / CSV / XLSX，预聚合统计指标并导出 JS 数据资产</td></tr>' +
    '<tr><td>数据资产</td><td>jsdata/ 目录：6 组统计资产 + 3 套结构化数据字典 + 5 份数据手册全文</td></tr>' +
    '<tr><td>质量依据</td><td>GB/T 32960 异常码约定、GB/T 36344-2018 数据质量评价指标、《2022年度上海市新能源汽车数据质量检测标准》</td></tr>' +
    '<tr><td>开发方式</td><td>基于 WorkBuddy AI Agent 完成数据探查、统计计算与工程开发</td></tr>' +
    '</table></div></div>' +
    '<div class="card"><div class="card-title">数据来源与合规说明</div>' +
    '<p style="font-size:13px;color:var(--ink-2)">数据来源于 EVData Box 教研数据集（上海市新能源汽车（嘉定）数据创新实验室，数据开放平台：<a href="https://labs.shevdc.com/datasets/view?dataSetCode=2100498347897913344" target="_blank" rel="noopener">https://labs.shevdc.com/datasets/view?dataSetCode=2100498347897913344</a>）。车辆 ID、车型代码已脱敏，日期已偏移处理，不包含任何个人敏感信息。本作品仅用于 X-GAME 2026 天华学院校内赛教学竞赛场景，不对外分发数据。本地数据文件为官方 DEMO 样例，正式数据集规模以数据手册口径为准，工作台内所有统计图表均基于本地 DEMO 数据实测计算并已注明口径。</p></div>';
  $('#crumb').textContent = '关于与使用说明';
}

/* ---------------- 移动端抽屉导航 ---------------- */
(function () {
  var sidebar = document.getElementById('sidebar');
  var backdrop = document.getElementById('backdrop');
  var toggle = document.getElementById('nav-toggle');
  function closeDrawer() {
    sidebar.classList.remove('open');
    backdrop.classList.remove('show');
  }
  if (toggle) toggle.addEventListener('click', function () {
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('show', sidebar.classList.contains('open'));
  });
  if (backdrop) backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
  var nav = document.getElementById('nav');
  if (nav) nav.addEventListener('click', function (e) {
    if (e.target.closest('.nav-item')) closeDrawer();
  });
})();

/* ---------------- 路由 ---------------- */
function route() {
  disposeCharts();
  var hash = location.hash.replace(/^#\/?/, '');
  var parts = hash.split('/').filter(Boolean);
  var page = parts[0] || 'overview';
  $$('.nav-item').forEach(function (a) { a.classList.remove('active'); });

  if (page === 'dataset' && parts[1]) {
    var navKey = 'dataset/' + parts[1];
    var nav = $('.nav-item[data-route="' + navKey + '"]');
    if (nav) nav.classList.add('active');
    pageDataset(parts[1], parts[2] || 'info');
  } else if (page === 'explore') {
    setActive('explore'); pageExplore();
  } else if (page === 'references') {
    setActive('references'); pageReferences();
  } else if (page === 'about') {
    setActive('about'); pageAbout();
  } else {
    setActive('overview'); pageOverview();
  }
  window.scrollTo(0, 0);
}
function setActive(r) {
  var nav = $('.nav-item[data-route="' + r + '"]');
  if (nav) nav.classList.add('active');
}
window.addEventListener('hashchange', route);
route();
})();
