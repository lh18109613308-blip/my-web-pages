import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleHelp, Compass, Lightbulb, MousePointer2, RotateCcw, Sparkles, Square, Target } from 'lucide-react';
import EquationBuilder from './EquationBuilder';
import GeometryPlayground from './GeometryPlayground';
import FunctionGraph from './FunctionGraph';

type Lesson = { title: string; short: string; tag: string; intro: string; points: string[]; question: string; options: string[]; answer: number; explain: string; graphic: 'point' | 'axis' | 'line' | 'region' | 'equation' | 'system' | 'balance-add' | 'balance-multiply' };
const lessons: Lesson[] = [
  { title: '坐标：给位置写地址', short: '认识坐标', tag: '起点', intro: '想象一张地图：先向左右走，再向上下走。一个点的位置就用两个数一起说明，写作 (x，y)。', points: ['第一个数 x：向右为正，向左为负。', '第二个数 y：向上为正，向下为负。', '例如 (2，3)：从原点向右 2 格，再向上 3 格。'], question: '点 (−2，1) 应该从原点怎么走？', options: ['向右 2 格，再向上 1 格', '向左 2 格，再向上 1 格', '向左 1 格，再向下 2 格'], answer: 1, explain: '先看第一个数 −2，向左 2 格；再看第二个数 1，向上 1 格。', graphic: 'point' },
  { title: 'x=1 和 y=0 是哪条线？', short: '看懂特殊直线', tag: '坐标轴', intro: '等式 x=1 的意思是：所有点的横坐标都等于 1。这样的点排成一条竖直线。y=0 则是所有纵坐标为 0 的点，正好是横轴。', points: ['x=1：过 (1，0) 的竖直线。', 'y=0：横轴上的所有点。', 'x=0：纵轴上的所有点。'], question: '方程 y=0 表示哪条线？', options: ['纵轴', '横轴', '经过 (0，1) 的竖直线'], answer: 1, explain: 'y=0 表示纵坐标为 0 的所有点，它们都在横轴上。', graphic: 'axis' },
  { title: '一条直线的秘密：y=kx+b', short: '一次函数参数', tag: '斜率与截距', intro: 'k 决定直线倾斜的方向和程度，b 决定直线与纵轴相交的位置。试着拖动滑块，观察公式和图像一起变化。', points: ['b 是起点：x=0 时，y=b。', 'k 是每向右走 1 格，y 改变多少。', 'k>0 向右上升；k<0 向右下降；k=0 是水平线。'], question: '在 y=2x+1 中，x=0 时 y 等于多少？', options: ['0', '1', '2'], answer: 1, explain: '把 x=0 代入：y=2×0+1=1，所以直线在纵轴上的交点是 (0，1)。', graphic: 'line' },
  { title: 'y<0：答案是一片区域', short: '不等式图像', tag: '区域与方向', intro: '等式 y=0 是横轴；不等式 y<0 指所有纵坐标小于 0 的点。因此答案不只是一条线，而是横轴下方整片区域。', points: ['y<0：横轴下方，不包含横轴。', 'y>0：横轴上方，不包含横轴。', 'y≤0：横轴及其下方，边界也包含在内。'], question: '点 (2，−1) 满足 y<0 吗？', options: ['满足，因为 −1 小于 0', '不满足，因为 2 大于 0', '不满足，因为点不在横轴上'], answer: 0, explain: '看点的第二个坐标 y=−1。因为 −1<0，所以这个点在横轴下方，满足条件。', graphic: 'region' },
  { title: '等式像一架平衡天平', short: '等式要两边平衡', tag: '方程的道理', intro: '等号不是“答案在右边”的箭头，而是在说左右两边一样重。要让等式继续成立，就必须对左右两边做同一件事。', points: ['两边同时加上同一个数，平衡不变。', '两边同时减去同一个数，平衡也不变。', '“移项变号”是简写：其实是在等式两边同时做了相反的加减。'], question: 'x + 3 = 7。想让左边只剩 x，应该怎样做？', options: ['只把左边的 +3 擦掉', '两边同时减去 3', '两边同时加上 3'], answer: 1, explain: '两边同时减 3：左边的 +3 和 −3 抵消，右边 7−3=4，所以 x=4。等式一直保持平衡。', graphic: 'balance-add' },
  { title: '乘除：把未知数前的“几份”还原', short: '乘除怎么解', tag: '相反运算', intro: '3x 表示 3 份相同的 x。要知道 1 份有多少，就把总数平均分成 3 份，也就是等式两边同时除以 3。除法同理，用乘法还原。', points: ['3x=12：把 12 平均分成 3 份，每份是 4。', '等式两边同时除以 3，得到 x=4。', 'x÷3=4：两边同时乘 3，得到 x=12。', '这里解的是等式；两边做同一运算，等号保持不变。'], question: '3x = 12。怎样让左边只剩一个 x？', options: ['两边同时加 3', '两边同时除以 3', '只把 3 改成 −3'], answer: 1, explain: '3x 是 3 个 x。两边同时除以 3：左边 3x÷3=x，右边 12÷3=4，所以 x=4。', graphic: 'balance-multiply' },
  { title: '二元一次方程：每个解都是一个点', short: '方程和直线', tag: '无数组解', intro: '像 2x+y=4 这样的二元一次方程，可以有很多组解。每一组 (x，y) 都是坐标图上的一个点，而且这些点排成一条直线。', points: ['把 x=0 代入 2x+y=4，得到 y=4，解是 (0，4)。', '把 x=1 代入，得到 y=2，解是 (1，2)。', '两个解确定一条直线；直线上的每一点都是方程的解。'], question: '点 (1，2) 是 2x+y=4 的解吗？', options: ['是，因为 2×1+2=4', '不是，因为 1+2 不等于 4', '是，因为坐标里有 2'], answer: 0, explain: '代入检查：2×1+2=4，等式成立，所以 (1，2) 是一个解。', graphic: 'equation' },
  { title: '方程组：两条直线在哪里相遇？', short: '相交与方程组', tag: '交点就是答案', intro: '方程组要求同一个 (x，y) 同时满足两条方程。画出两条直线，它们的交点就是共同的解。', points: ['若两条直线交于 (2，1)，这组数同时满足两个方程。', '相交于一点：一个解。', '平行不相交：没有共同解；重合：有无数组共同解。'], question: '两条直线交于 (2，1)，方程组的解是什么？', options: ['x=2，y=1', 'x=1，y=2', '只有 x=2'], answer: 0, explain: '交点坐标 (2，1) 表示 x=2 且 y=1，这一组数同时满足两条方程。', graphic: 'system' },
];

const STORE = 'equation-school-progress-v2';
function readProgress() {
  try {
    const current = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (current) return current;
    const old = JSON.parse(localStorage.getItem('equation-school-progress-v1') || 'null');
    if (!old) return {};
    const shift = (index: number) => index >= 4 ? index + 2 : index;
    const migrated = { lastLesson: shift(Number(old.lastLesson) || 0), completed: Array.isArray(old.completed) ? old.completed.map(shift) : [] };
    localStorage.setItem(STORE, JSON.stringify(migrated));
    return migrated;
  } catch { return {}; }
}
const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));
const fmt = (n: number) => Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
const coordinateTicks = (range: number) => {
  const step = Math.max(1, Math.ceil(range / 5));
  const ticks: number[] = [];
  for (let value = Math.ceil(-range / step) * step; value <= range; value += step) ticks.push(value);
  return ticks;
};
function equation(k: number, b: number) {
  const term = k === 0 ? '' : k === 1 ? 'x' : k === -1 ? '−x' : `${fmt(k)}x`;
  if (!term) return `y = ${fmt(b)}`;
  if (b === 0) return `y = ${term}`;
  return `y = ${term} ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))}`;
}
function linePoints(k: number, b: number, xRange = 5, yRange = 5) {
  const hits: [number, number][] = [];
  const add = (x: number, y: number) => { if (x >= -xRange - .01 && x <= xRange + .01 && y >= -yRange - .01 && y <= yRange + .01 && !hits.some(p => Math.abs(p[0] - x) < .01 && Math.abs(p[1] - y) < .01)) hits.push([x, y]); };
  add(-xRange, -xRange * k + b); add(xRange, xRange * k + b);
  if (Math.abs(k) > .0001) { add((-yRange - b) / k, -yRange); add((yRange - b) / k, yRange); }
  return hits.slice(0, 2);
}

type DrawnLine = { vertical: boolean; x?: number; k: number; b: number };
function describeLine(points: [number, number][]): DrawnLine | null {
  if (points.length !== 2) return null;
  const [[x1, y1], [x2, y2]] = points;
  if (x1 === x2) return { vertical: true, x: x1, k: 0, b: 0 };
  const k = (y2 - y1) / (x2 - x1);
  return { vertical: false, k, b: y1 - k * x1 };
}
function lineText(line: DrawnLine | null) {
  return line ? line.vertical ? `x = ${fmt(line.x ?? 0)}` : equation(line.k, line.b) : '等待画出';
}
function intersectLines(a: DrawnLine | null, b: DrawnLine | null) {
  if (!a || !b) return '';
  if (a.vertical && b.vertical) return a.x === b.x ? '两条直线重合，有无数组共同解。' : '两条直线平行，没有交点。';
  if (a.vertical) return `交点是 (${fmt(a.x ?? 0)}，${fmt(b.k * (a.x ?? 0) + b.b)})`;
  if (b.vertical) return `交点是 (${fmt(b.x ?? 0)}，${fmt(a.k * (b.x ?? 0) + a.b)})`;
  if (Math.abs(a.k - b.k) < 1e-8) return Math.abs(a.b - b.b) < 1e-8 ? '两条直线重合，有无数组共同解。' : '两条直线平行，没有交点。';
  const x = (b.b - a.b) / (a.k - b.k);
  return `交点是 (${fmt(x)}，${fmt(a.k * x + a.b)})`;
}
function intersectionPoint(a: DrawnLine | null, b: DrawnLine | null): [number, number] | null {
  if (!a || !b) return null;
  if (a.vertical) return b.vertical ? null : [a.x ?? 0, b.k * (a.x ?? 0) + b.b];
  if (b.vertical) return [b.x ?? 0, a.k * (b.x ?? 0) + a.b];
  if (Math.abs(a.k - b.k) < 1e-8) return null;
  const x = (b.b - a.b) / (a.k - b.k);
  return [x, a.k * x + a.b];
}

function Graph({ lesson, k, b, inequality, drawMode, drawn, secondDrawn = [], activeDrawn = 'first', hideBaseLine = false, xRange = 5, yRange = 5, onPoint, onSelectLine, onDragCustom, onDragBase }: {
  lesson: Lesson['graphic']; k: number; b: number; inequality: boolean; drawMode: boolean; drawn: [number, number][]; secondDrawn?: [number, number][]; activeDrawn?: 'first' | 'second'; hideBaseLine?: boolean; xRange?: number; yRange?: number; onPoint: (point: [number, number]) => void; onSelectLine?: () => void; onDragCustom?: (which: 'first' | 'second', points: [number, number][]) => void; onDragBase?: (dx: number, dy: number, startK: number, startB: number) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ which: 'first' | 'second' | 'base'; type: 'line' | 'point'; pointIndex?: number; start: [number, number]; original: [number, number][]; startK?: number; startB?: number; } | null>(null);
  const px = (x: number) => 48 + (x + xRange) / (2 * xRange) * 404;
  const py = (y: number) => 452 - (y + yRange) / (2 * yRange) * 404;
  const mapPoint = (e: React.MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    return [clamp(Math.round(((e.clientX - box.left) / box.width * 500 - 48) / 404 * 2 * xRange - xRange), -xRange, xRange), clamp(Math.round((452 - (e.clientY - box.top) / box.height * 500) / 404 * 2 * yRange - yRange), -yRange, yRange)] as [number, number];
  };
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drawMode || !onDragCustom) return;
    const pos = mapPoint(e), sx = px(pos[0]), sy = py(pos[1]);
    const candidates: { which: 'first' | 'second'; points: [number, number][] }[] = [
      { which: 'first', points: drawn }, { which: 'second', points: secondDrawn },
    ];
    for (const candidate of candidates) {
      if (candidate.points.length !== 2 || (candidate.which === 'second' && !isSecondLine)) continue;
      const nearPoint = candidate.points.findIndex(p => Math.hypot(px(p[0]) - sx, py(p[1]) - sy) < 18);
      if (nearPoint >= 0) { dragRef.current = { which: candidate.which, type: 'point', pointIndex: nearPoint, start: pos, original: candidate.points }; e.currentTarget.setPointerCapture(e.pointerId); return; }
      const [p1, p2] = candidate.points, ax = px(p1[0]), ay = py(p1[1]), bx = px(p2[0]), by = py(p2[1]);
      const t = clamp(((sx - ax) * (bx - ax) + (sy - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2 || 1), 0, 1);
      if (Math.hypot(sx - (ax + t * (bx - ax)), sy - (ay + t * (by - ay))) < 13) { dragRef.current = { which: candidate.which, type: 'line', start: pos, original: candidate.points }; e.currentTarget.setPointerCapture(e.pointerId); return; }
    }
    if (!hideBaseLine && lesson === 'line' && onDragBase) {
      const distance = Math.abs(pos[1] - (k * pos[0] + b)) / Math.sqrt(k * k + 1);
      if (distance < .42) { dragRef.current = { which: 'base', type: 'line', start: pos, original: [], startK: k, startB: b }; e.currentTarget.setPointerCapture(e.pointerId); }
    }
  };
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current; if (!drag) return;
    const pos = mapPoint(e), dx = pos[0] - drag.start[0], dy = pos[1] - drag.start[1];
    if (drag.which === 'base') { onDragBase?.(dx, dy, drag.startK ?? k, drag.startB ?? b); return; }
    const updated = drag.original.map((p, i) => drag.type === 'point' && i !== drag.pointIndex ? p : [clamp(p[0] + dx, -xRange, xRange), clamp(p[1] + dy, -yRange, yRange)] as [number, number]);
    onDragCustom?.(drag.which, updated);
  };
  const handlePointerUp = () => { dragRef.current = null; };
  const primary = lesson === 'system' ? linePoints(.5, 0, xRange, yRange) : lesson === 'equation' ? linePoints(-2, 4, xRange, yRange) : lesson === 'region' ? linePoints(0, 0, xRange, yRange) : linePoints(k, b, xRange, yRange);
  const yBottom = py(-yRange);
  const useLine = lesson === 'line' || lesson === 'region' || lesson === 'equation' || lesson === 'system';
  const showVertical = lesson === 'axis';
  const showArea = lesson === 'region' && inequality;
  const isDrawnLine = drawn.length === 2;
  const isSecondLine = secondDrawn.length === 2;
  const intersection = intersectionPoint(describeLine(drawn), describeLine(secondDrawn));
  const selectedPoints = activeDrawn === 'first' ? drawn : secondDrawn;
  const selectedLine = describeLine(selectedPoints);
  const pointsFor = (line: DrawnLine | null, original: [number, number][]) => !line ? original : line.vertical ? [[line.x ?? 0, -yRange], [line.x ?? 0, yRange]] as [number, number][] : linePoints(line.k, line.b, xRange, yRange);
  const points = pointsFor(describeLine(drawn), primary);
  const pointsB = pointsFor(describeLine(secondDrawn), []);
  return <div className="graph-wrap">
    <svg ref={ref} className={`graph ${drawMode ? 'graph-draw' : ''}`} viewBox="0 0 500 500" role="img" aria-label="可交互坐标图" onClick={e => { if (drawMode) onPoint(mapPoint(e)); }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
      <rect x="0" y="0" width="500" height="500" rx="22" fill="#fffefa" />
      {showArea && <rect x="48" y={py(0)} width="404" height={yBottom - py(0)} fill="#fae6b9" opacity=".7" />}
      {lesson === 'region' && !inequality && <path d={`M 48 ${py(0)} L 452 ${py(0)} L 452 ${yBottom} L 48 ${yBottom} Z`} fill="#fae6b9" opacity=".7" />}
      {coordinateTicks(xRange).filter(value => value !== 0).map(value => <g key={`x${value}`}><line x1={px(value)} y1={py(-yRange)} x2={px(value)} y2={py(yRange)} stroke="#e9e7df"/><text x={px(value)} y="476" textAnchor="middle" className="axis-label">{value}</text></g>)}
      {coordinateTicks(yRange).filter(value => value !== 0).map(value => <g key={`y${value}`}><line x1={px(-xRange)} y1={py(value)} x2={px(xRange)} y2={py(value)} stroke="#e9e7df"/><text x="28" y={py(value) + 4} textAnchor="middle" className="axis-label">{value}</text></g>)}
      <path d={`M ${px(-xRange)} ${py(0)} L ${px(xRange)} ${py(0)}`} stroke="#263733" strokeWidth="2" markerEnd="url(#arrow)" />
      <path d={`M ${px(0)} ${py(-yRange)} L ${px(0)} ${py(yRange)}`} stroke="#263733" strokeWidth="2" markerEnd="url(#arrow)" />
      <defs><marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#263733" /></marker></defs>
      <text x="462" y={py(0) + 5} className="axis-title">x</text><text x={px(0) + 7} y="35" className="axis-title">y</text>
      {showVertical && <line x1={px(1)} y1={py(-yRange)} x2={px(1)} y2={py(yRange)} stroke="#e28150" strokeWidth="4" strokeLinecap="round" />}
      {useLine && lesson !== 'system' && !hideBaseLine && !isDrawnLine && points.length === 2 && <line x1={px(points[0][0])} y1={py(points[0][1])} x2={px(points[1][0])} y2={py(points[1][1])} stroke="#e28150" strokeWidth="4" strokeLinecap="round" strokeDasharray={lesson === 'region' && inequality ? '9 6' : undefined} />}
      {isDrawnLine && points.length === 2 && <line x1={px(points[0][0])} y1={py(points[0][1])} x2={px(points[1][0])} y2={py(points[1][1])} stroke="#e28150" strokeWidth="4" strokeLinecap="round" />}
      {isSecondLine && pointsB.length === 2 && <line x1={px(pointsB[0][0])} y1={py(pointsB[0][1])} x2={px(pointsB[1][0])} y2={py(pointsB[1][1])} stroke="#6c7dcb" strokeWidth="4" strokeLinecap="round" />}
      {intersection && <><circle cx={px(intersection[0])} cy={py(intersection[1])} r="8" fill="#314b3f" stroke="white" strokeWidth="3" /><text x={px(intersection[0]) + 10} y={py(intersection[1]) - 11} className="point-label">交点</text></>}
      {lesson === 'point' && <><circle cx={px(2)} cy={py(3)} r="8" fill="#e28150" /><text x={px(2) + 12} y={py(3) - 12} className="point-label">(2，3)</text><circle cx={px(-2)} cy={py(1)} r="7" fill="#6c7dcb" /><text x={px(-2) - 44} y={py(1) - 11} className="point-label">(−2，1)</text></>}
      {showVertical && <><circle cx={px(1)} cy={py(0)} r="7" fill="#e28150" /><text x={px(1) + 10} y={py(0) - 12} className="point-label">x = 1</text></>}
      {lesson === 'axis' && <text x="376" y={py(0) - 12} className="point-label">y = 0（x 轴）</text>}
      {lesson === 'equation' && <><circle cx={px(0)} cy={py(4)} r="7" fill="#e28150" /><circle cx={px(1)} cy={py(2)} r="7" fill="#e28150" /><text x={px(0) + 10} y={py(4) - 10} className="point-label">(0，4)</text><text x={px(1) + 10} y={py(2) - 10} className="point-label">(1，2)</text></>}
      {lesson === 'system' && <><line x1={px(-5)} y1={py(-2.5)} x2={px(5)} y2={py(2.5)} stroke="#6c7dcb" strokeWidth="3" /><line x1={px(-2)} y1={py(5)} x2={px(5)} y2={py(-2)} stroke="#e28150" strokeWidth="3" /><circle cx={px(2)} cy={py(1)} r="7" fill="#243d37" /><text x={px(2) + 10} y={py(1) - 10} className="point-label">(2，1) 共同解</text></>}
      {drawn.map((p, i) => <g key={`a${i}`}><circle cx={px(p[0])} cy={py(p[1])} r="6" fill="#e28150" stroke="white" strokeWidth="2" /><text x={px(p[0]) + 9} y={py(p[1]) - 9} className="point-label">({p[0]}，{p[1]})</text></g>)}
      {secondDrawn.map((p, i) => <g key={`b${i}`}><circle cx={px(p[0])} cy={py(p[1])} r="6" fill="#6c7dcb" stroke="white" strokeWidth="2" /><text x={px(p[0]) + 9} y={py(p[1]) - 9} className="point-label">({p[0]}，{p[1]})</text></g>)}
      <rect x="48" y="48" width="404" height="404" fill="transparent" onClick={e => { if (drawMode) { e.stopPropagation(); const native = e.nativeEvent; const box = ref.current!.getBoundingClientRect(); onPoint([clamp(Math.round(((native.clientX - box.left) / box.width * 500 - 48) / 40.4 - 5), -5, 5), clamp(Math.round((452 - (native.clientY - box.top) / box.height * 500) / 40.4 - 5), -5, 5)]); } }} />
      {onSelectLine && <title>点选网格上的两个位置来画线</title>}
    </svg>
    {drawMode && <div className="draw-result">{selectedPoints.length === 0 ? `先在网格上点第${activeDrawn === 'first' ? '一' : '二'}条线的第一个点` : selectedPoints.length === 1 ? `第一个点：(${selectedPoints[0][0]}，${selectedPoints[0][1]})，再点第二个点` : selectedLine?.vertical ? <><b>{lineText(selectedLine)}</b><span>竖直线不能写成 y=kx+b。</span></> : <><b>{lineText(selectedLine)}</b><span>画好了！选另一条线继续。</span></>}</div>}
    {onSelectLine && <button className="mini-line" onClick={onSelectLine}>重新点两点 <RotateCcw size={14} /></button>}
  </div>;
}

type BalanceKind = 'balance-add' | 'balance-multiply';
type BalanceScenario = { label: string; beforeLeft: string[]; beforeRight: string[]; leftAction: string; rightAction: string; duringLeft: string[]; duringRight: string[]; afterLeft: string[]; afterRight: string[]; result: string; moved: string; explanation: string };
const balanceScenarios: Record<BalanceKind, BalanceScenario[]> = {
  'balance-add': [
    { label: 'x + 3 = 7', beforeLeft: ['x', '+3'], beforeRight: ['7'], leftAction: '− 3', rightAction: '− 3', duringLeft: ['x', '+3', '−3'], duringRight: ['7', '−3'], afterLeft: ['x'], afterRight: ['4'], result: 'x = 4', moved: 'x = 7 − 3', explanation: '+3 和 −3 抵消；右边 7−3=4。所以 x=4。移项时看到的“+3 变 −3”，其实是两边同时减了 3。' },
    { label: 'x − 3 = 7', beforeLeft: ['x', '−3'], beforeRight: ['7'], leftAction: '+ 3', rightAction: '+ 3', duringLeft: ['x', '−3', '+3'], duringRight: ['7', '+3'], afterLeft: ['x'], afterRight: ['10'], result: 'x = 10', moved: 'x = 7 + 3', explanation: '−3 和 +3 抵消；右边 7+3=10。所以 x=10。减去的 3 移到另一边，看起来就变成加 3。' },
  ],
  'balance-multiply': [
    { label: '3x = 12', beforeLeft: ['x', 'x', 'x'], beforeRight: ['1','1','1','1','1','1','1','1','1','1','1','1'], leftAction: '÷ 3', rightAction: '÷ 3', duringLeft: ['把 3 份平均分'], duringRight: ['把 12 平均分成 3 份'], afterLeft: ['x'], afterRight: ['4'], result: 'x = 4', moved: 'x = 12 ÷ 3', explanation: '3x 是 3 份相同的 x。把两边都平均分成 3 份，左边剩 1 份 x，右边每份有 4，所以 x=4。乘法系数移过去变成除法，是因为我们在两边同时除以 3。' },
    { label: 'x ÷ 3 = 4', beforeLeft: ['x ÷ 3'], beforeRight: ['4'], leftAction: '× 3', rightAction: '× 3', duringLeft: ['x ÷ 3 × 3'], duringRight: ['4 × 3'], afterLeft: ['x'], afterRight: ['12'], result: 'x = 12', moved: 'x = 4 × 3', explanation: 'x 被平均分成 3 份后是 4。要还原原来的 x，就把两边都乘以 3：左边 ÷3 和 ×3 抵消，右边 4×3=12。' },
  ],
};

function BalanceDemo({ kind }: { kind: BalanceKind }) {
  const scenarios = balanceScenarios[kind];
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [applied, setApplied] = useState(false);
  const scenario = scenarios[scenarioIndex];
  const tiles = (values: string[], after = false) => values.map((value, i) => <span className={`balance-tile ${value === 'x' || value.includes('x') ? 'unknown' : ''} ${after ? 'after' : ''}`} key={`${value}-${i}`}>{value}</span>);
  const choose = (index: number) => { setScenarioIndex(index); setApplied(false); };
  return <section className="balance-demo">
    <div className="balance-demo-head"><div><span className="tiny-label">动手试一试</span><h2>{kind === 'balance-add' ? '两边同时加减，天平就仍然平衡' : '乘除是“份数”和“每份”的还原'}</h2></div><div className="bulb"><Lightbulb size={19} /></div></div>
    <div className="scenario-tabs">{scenarios.map((item, i) => <button key={item.label} className={scenarioIndex === i ? 'selected' : ''} onClick={() => choose(i)}>{item.label}</button>)}</div>
    <p className="balance-prompt">{kind === 'balance-add' ? '目标：让左边只留下 x。' : '目标：让左边只留下 1 份 x。'}先观察等式两边，再看看同时操作会发生什么。</p>
    <div className={`balance-stage ${applied ? 'changed' : ''}`}>
      <div className="balance-beam"><i /></div>
      <div className="balance-pan-row">
        <div className="balance-pan"><small>等号左边</small><div className="balance-tiles">{tiles(scenario.beforeLeft)}</div>{applied && <span className="operation-tag">同时 {scenario.leftAction}</span>}</div>
        <div className="balance-equal">＝</div>
        <div className="balance-pan"><small>等号右边</small><div className="balance-tiles">{tiles(scenario.beforeRight)}</div>{applied && <span className="operation-tag">同时 {scenario.rightAction}</span>}</div>
      </div>
      <div className="balance-fulcrum" />
      <div className="balance-caption"><Check size={14} /> 两边一样重，等式保持平衡</div>
    </div>
    {applied ? <div className="balance-step-result"><div className="step-transform"><span>两边同时操作</span><b>{scenario.duringLeft.join(' ')} ＝ {scenario.duringRight.join(' ')}</b></div><div className="step-transform simplified"><span>化简后</span><b>{scenario.afterLeft.join(' ')} ＝ {scenario.afterRight.join(' ')}　→　{scenario.result}</b></div><p>{scenario.explanation}</p><div className="move-translation"><span>课本里的“移项写法”</span><b>{scenario.label.split(' = ')[0]} = {scenario.label.split(' = ')[1]}　→　{scenario.moved}</b><small>这是同一个过程的简写，两边同时做运算才是原因。</small></div></div> : <div className="balance-ready"><span>试着先猜想：要把左边变简单，两边应该同时做什么？</span><button onClick={() => setApplied(true)}>{kind === 'balance-add' ? `两边同时 ${scenario.leftAction}` : `两边同时 ${scenario.leftAction}`} <ArrowRight size={15} /></button></div>}
    <div className="balance-principle"><b>记住原因</b><span>等式像天平：只要左右两边同时加、减、乘或除以同一个数（除数不能为 0），平衡就不会被破坏。</span></div>
  </section>;
}

export default function App() {
  const [savedProgress] = useState(readProgress);
  const [lessonIndex, setLessonIndex] = useState(() => {
    return clamp(Number(savedProgress.lastLesson) || 0, 0, lessons.length - 1);
  });
  const [completed, setCompleted] = useState<number[]>(() => {
    return Array.isArray(savedProgress.completed) ? savedProgress.completed : [];
  });
  const [view, setView] = useState<'lesson' | 'explore' | 'builder' | 'geometry'>('explore');
  const [k, setK] = useState(1); const [b, setB] = useState(0);
  const [inequality, setInequality] = useState(true);
  const [drawMode, setDrawMode] = useState(false); const [drawn, setDrawn] = useState<[number, number][]>([]);
  const [drawnSecond, setDrawnSecond] = useState<[number, number][]>([]);
  const [activeDrawn, setActiveDrawn] = useState<'first' | 'second' | null>(null);
  const [choice, setChoice] = useState<number | null>(null); const [submitted, setSubmitted] = useState(false); const [hint, setHint] = useState(false);
  const lesson = lessons[lessonIndex];
  useEffect(() => { localStorage.setItem(STORE, JSON.stringify({ lastLesson: lessonIndex, completed })); }, [lessonIndex, completed]);
  useEffect(() => { setChoice(null); setSubmitted(false); setHint(false); setDrawMode(false); setDrawn([]); setDrawnSecond([]); setActiveDrawn(null); }, [lessonIndex, view]);
  const correct = submitted && choice === lesson.answer;
  const next = () => { if (lessonIndex < lessons.length - 1) setLessonIndex(lessonIndex + 1); };
  const prev = () => { if (lessonIndex > 0) setLessonIndex(lessonIndex - 1); };
  const submit = () => {
    if (choice === null) return;
    setSubmitted(true);
    if (choice === lesson.answer) setCompleted(old => old.includes(lessonIndex) ? old : [...old, lessonIndex]);
  };
  const selected = useMemo(() => lesson.graphic === 'region' ? (inequality ? 'y < 0' : 'y ≤ 0') : equation(k, b), [lesson.graphic, inequality, k, b]);

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-icon">y=</div><span>看见方程<small>图像数学</small></span></div><nav className="feature-nav" aria-label="学习工具"><button className={`explore-button ${view === 'explore' ? 'active' : ''}`} onClick={() => setView('explore')}><Compass size={17} /> 方程画图</button><button className={`explore-button builder-nav ${view === 'builder' ? 'active' : ''}`} onClick={() => setView('builder')}><Target size={17} /> 自己组式</button><button className={`explore-button geometry-nav ${view === 'geometry' ? 'active' : ''}`} onClick={() => setView('geometry')}><Square size={17} /> 动点几何</button></nav></header>
    <div className="layout">
      <main className="main-content">
        {view === 'lesson' ? <>
          <div className="lesson-topline"><span className="eyebrow"><span className="eyebrow-dot" /> 第 {String(lessonIndex + 1).padStart(2, '0')} 课 · {lesson.tag}</span><span className="time-label">每一步都算数</span></div>
          <h1>{lesson.title}</h1><p className="lead">{lesson.intro}</p>
          {lesson.graphic === 'balance-add' || lesson.graphic === 'balance-multiply' ? <div className="balance-layout">
            <BalanceDemo key={lesson.graphic} kind={lesson.graphic === 'balance-add' ? 'balance-add' : 'balance-multiply'} />
            <section className="learn-card balance-concepts"><div className="card-top"><div><span className="tiny-label">记住这个道理</span><h2>不是符号自己变了</h2></div><div className="bulb"><Lightbulb size={19} /></div></div><div className="concept-list">{lesson.points.map((point, i) => <div className="concept" key={point}><span>{String(i + 1).padStart(2, '0')}</span><p>{point}</p></div>)}</div><div className="important-note"><b>加减看起来变号</b><p>“+3”移到等号另一边看起来成“−3”，不是平白改了符号，而是两边同时减了 3。</p><b>乘除看起来互换</b><p>“×3”移过去看起来变“÷3”，是因为两边同时除以 3。等号一直代表两边相等。</p></div></section>
          </div> : <div className="workspace">
            <section className="graph-card"><div className="card-top"><div><span className="tiny-label">图像观察</span><h2>{lesson.graphic === 'axis' ? '把“方程”放进坐标图' : lesson.graphic === 'region' ? '解集会落在哪里？' : lesson.graphic === 'point' ? '坐标像地图地址' : lesson.graphic === 'system' ? '找找两条线的相遇点' : '拖动参数，看看发生什么'}</h2></div><span className="live-badge"><i /> 实时图像</span></div>
              <Graph lesson={lesson.graphic} k={k} b={b} inequality={inequality} drawMode={drawMode} drawn={drawn} onPoint={p => setDrawn(old => old.length === 2 ? [p] : [...old, p])} />
              {(lesson.graphic === 'line' || lesson.graphic === 'region') && <div className="formula-chip"><span>当前表达式</span><b>{selected}</b>{lesson.graphic === 'line' && <span className="formula-note">b 是与纵轴相交的位置</span>}</div>}
            </section>
            <section className="learn-card"><div className="card-top"><div><span className="tiny-label">一起理解</span><h2>抓住这几个要点</h2></div><div className="bulb"><Lightbulb size={19} /></div></div><div className="concept-list">{lesson.points.map((point, i) => <div className="concept" key={point}><span>{String(i + 1).padStart(2, '0')}</span><p>{point}</p></div>)}</div>
              {lesson.graphic === 'line' && <div className="sliders"><label>斜率 <b>k = {fmt(k)}</b><input type="range" min="-3" max="3" step="0.5" value={k} onChange={e => setK(Number(e.target.value))} /><small>k 控制倾斜方向和程度</small></label><label>纵轴交点 <b>b = {fmt(b)}</b><input type="range" min="-4" max="4" step="1" value={b} onChange={e => setB(Number(e.target.value))} /><small>b 控制直线上下平移的位置</small></label></div>}
              {lesson.graphic === 'region' && <div className="segmented"><button className={inequality ? 'selected' : ''} onClick={() => setInequality(true)}>y &lt; 0</button><button className={!inequality ? 'selected' : ''} onClick={() => setInequality(false)}>y ≤ 0</button><span><i className={inequality ? 'dashed' : ''} />{inequality ? '虚线边界不包含' : '实线边界也包含'}</span></div>}
              {(lesson.graphic === 'line' || lesson.graphic === 'axis') && <div className="draw-tools"><div><MousePointer2 size={16} /><span><b>自己来画一条</b><small>点选两个位置，看看对应的方程</small></span></div><button className={drawMode ? 'selected' : ''} onClick={() => { setDrawMode(!drawMode); setDrawn([]); }}>{drawMode ? '退出画线' : '开始画线'}</button></div>}
              {lesson.graphic === 'system' && <div className="intersection-callout"><Target size={17} /><span>两条直线的交点，满足这两条方程。</span></div>}
            </section>
          </div>}
          <section className="quiz-card"><div className="quiz-heading"><div className="quiz-icon"><CircleHelp size={20} /></div><div><span className="tiny-label">想一想 · 选出答案</span><h2>{lesson.question}</h2></div></div><div className="options">{lesson.options.map((option, i) => <button key={option} className={`option ${choice === i ? 'chosen' : ''} ${submitted && i === lesson.answer ? 'right-answer' : ''} ${submitted && choice === i && i !== lesson.answer ? 'wrong-answer' : ''}`} onClick={() => { if (!submitted) setChoice(i); }}><span className="option-letter">{String.fromCharCode(65 + i)}</span>{option}{submitted && i === lesson.answer && <Check size={17} className="option-check" />}</button>)}</div>
            {hint && <div className="hint-box"><Lightbulb size={16} />{lesson.explain}</div>}
            {submitted && <div className={`feedback ${correct ? 'success' : 'retry'}`}><b>{correct ? '答对了，理解得很棒！' : '再想一想，答案已经标出来啦。'}</b><span>{lesson.explain}</span></div>}
            <div className="quiz-actions"><button className="hint-button" onClick={() => setHint(!hint)}><Lightbulb size={16} />{hint ? '收起提示' : '给我一点提示'}</button><button className="check-button" onClick={submitted ? () => { setChoice(null); setSubmitted(false); setHint(false); } : submit} disabled={!submitted && choice === null}>{submitted ? <><RotateCcw size={16} />再做一次</> : <>检查答案 <ArrowRight size={16} /></>}</button></div>
          </section>
          <div className="lesson-nav"><button onClick={prev} disabled={lessonIndex === 0}><ArrowLeft size={16} />上一课</button><span>{completed.includes(lessonIndex) ? <><Check size={15} /> 本课已完成</> : '完成练习即可记录进度'}</span><button className="next-link" onClick={next} disabled={lessonIndex === lessons.length - 1}>下一课 <ArrowRight size={16} /></button></div>
        </> : view === 'explore' ? <Explore k={k} b={b} setK={setK} setB={setB} drawn={drawn} setDrawn={setDrawn} secondDrawn={drawnSecond} setSecondDrawn={setDrawnSecond} activeDrawn={activeDrawn} setActiveDrawn={setActiveDrawn} drawMode={drawMode} setDrawMode={setDrawMode} /> : view === 'builder' ? <EquationBuilder /> : <GeometryPlayground />}
      </main>
    </div>
  </div>;
}

function Explore({ k, b, setK, setB, drawn, setDrawn, secondDrawn, setSecondDrawn, activeDrawn, setActiveDrawn, drawMode, setDrawMode }: {
  k: number; b: number; setK: (v: number) => void; setB: (v: number) => void;
  drawn: [number, number][]; setDrawn: React.Dispatch<React.SetStateAction<[number, number][]>>;
  secondDrawn: [number, number][]; setSecondDrawn: React.Dispatch<React.SetStateAction<[number, number][]>>;
  activeDrawn: 'first' | 'second' | null; setActiveDrawn: (v: 'first' | 'second' | null) => void;
  drawMode: boolean; setDrawMode: (v: boolean) => void;
}) {
  const [exploreMode, setExploreMode] = useState<'lines' | 'functions'>('lines');
  const [lineXRange, setLineXRange] = useState(5);
  const [lineYRange, setLineYRange] = useState(5);
  const firstLine = describeLine(drawn); const secondLine = describeLine(secondDrawn);
  const takePoint = (point: [number, number]) => {
    if (activeDrawn === 'first') {
      const next = drawn.length >= 2 ? [point] : [...drawn, point];
      setDrawn(next);
      if (next.length === 2) { setDrawMode(false); setActiveDrawn(null); }
    } else if (activeDrawn === 'second') {
      const next = secondDrawn.length >= 2 ? [point] : [...secondDrawn, point];
      setSecondDrawn(next);
      if (next.length === 2) { setDrawMode(false); setActiveDrawn(null); }
    }
  };
  const startLine = (line: 'first' | 'second') => {
    if (activeDrawn === line) { setActiveDrawn(null); setDrawMode(false); return; }
    setActiveDrawn(line); setDrawMode(true);
    if (line === 'first') setDrawn([]); else setSecondDrawn([]);
  };
  const clearLines = () => { setDrawn([]); setSecondDrawn([]); setDrawMode(false); setActiveDrawn(null); };
  const changeSlope = (value: number) => { setK(value); clearLines(); };
  const changeIntercept = (value: number) => { setB(value); clearLines(); };
  return <>
    <h1>方程与图像</h1><p className="lead">选择函数类型，填写参数或方程，图像会立即显示。</p>
    <div className="explore-mode-switch" aria-label="选择探索内容"><button className={exploreMode === 'lines' ? 'active' : ''} onClick={() => setExploreMode('lines')}>直线与交点</button><button className={exploreMode === 'functions' ? 'active' : ''} onClick={() => setExploreMode('functions')}>函数图像</button></div>
    {exploreMode === 'functions' ? <FunctionGraph /> : <div className="workspace explore-workspace">
      <section className="graph-card">
        <div className="card-top"><div><span className="tiny-label">实时互动</span><h2>画两条线，找它们的交点</h2></div><span className="live-badge"><i /> 实时图像</span></div>
        <div className="axis-range-controls"><span>坐标范围</span><label>x 轴 <button aria-label="缩小 x 轴范围" onClick={() => setLineXRange(v => Math.max(2, v - 1))}>−</button><b>±{lineXRange}</b><button aria-label="扩大 x 轴范围" onClick={() => setLineXRange(v => Math.min(50, v + 1))}>+</button></label><label>y 轴 <button aria-label="缩小 y 轴范围" onClick={() => setLineYRange(v => Math.max(2, v - 1))}>−</button><b>±{lineYRange}</b><button aria-label="扩大 y 轴范围" onClick={() => setLineYRange(v => Math.min(50, v + 1))}>+</button></label><button className="range-reset" onClick={() => { setLineXRange(5); setLineYRange(5); }}>恢复 ±5</button></div>
        <Graph lesson="line" k={k} b={b} inequality drawMode={drawMode} drawn={drawn} secondDrawn={secondDrawn} activeDrawn={activeDrawn ?? 'first'} hideBaseLine={drawMode || drawn.length > 0 || secondDrawn.length > 0} xRange={lineXRange} yRange={lineYRange} onPoint={takePoint} onSelectLine={clearLines} onDragCustom={(which, points) => which === 'first' ? setDrawn(points) : setSecondDrawn(points)} onDragBase={(dx, dy, startK, startB) => setB(startB + dy - startK * dx)} />
        {(firstLine || secondLine) ? <div className="line-results"><div><i className="line-key first" /><span>直线 1</span><b>{lineText(firstLine)}</b></div><div><i className="line-key second" /><span>直线 2</span><b>{lineText(secondLine)}</b></div><strong>{intersectLines(firstLine, secondLine) || '画好两条直线后，这里会显示交点。'}</strong></div> : <div className="formula-chip"><span>参数直线</span><b>{equation(k, b)}</b><span className="formula-note">也可以改用下面的两点画线</span></div>}
      </section>
      <section className="learn-card explore-controls">
        <div className="card-top"><div><span className="tiny-label">两点确定一条直线</span><h2>按顺序画出两条线</h2></div><div className="bulb"><Sparkles size={18} /></div></div>
        <div className="draw-instructions"><b>每条直线分别点两个位置</b><span>画完第一条后，再选择第二条继续。</span></div>
        <div className="draw-line-actions"><button className={activeDrawn === 'first' ? 'selected' : ''} onClick={() => startLine('first')}><i className="line-key first" />{activeDrawn === 'first' ? '正在画直线 1…' : '画直线 1'}{drawn.length === 2 && <Check size={15} />}</button><button className={activeDrawn === 'second' ? 'selected' : ''} onClick={() => startLine('second')}><i className="line-key second" />{activeDrawn === 'second' ? '正在画直线 2…' : '画直线 2'}{secondDrawn.length === 2 && <Check size={15} />}</button></div>
        {drawMode && <div className="draw-hint"><MousePointer2 size={16} />{activeDrawn === 'first' ? `在网格点两个位置${drawn.length === 1 ? '（还差一个点）' : ''}` : `在网格点两个位置${secondDrawn.length === 1 ? '（还差一个点）' : ''}`}</div>}
        <div className="sliders explore-sliders"><label>斜率 <b>k = {fmt(k)}</b><input type="range" min="-3" max="3" step="0.5" value={k} onChange={e => changeSlope(Number(e.target.value))} /><small>滑块控制参数直线的倾斜程度</small></label><label>纵轴交点 <b>b = {fmt(b)}</b><input type="range" min="-4" max="4" step="1" value={b} onChange={e => changeIntercept(Number(e.target.value))} /><small>滑块控制参数直线上下移动</small></label></div>
        <button className="reset-button" onClick={() => { setK(1); setB(0); clearLines(); }}><RotateCcw size={15} />清空两条线并恢复参数直线</button>
        <div className="explore-note"><Lightbulb size={16} /><p><b>观察小问题</b><br />两条线相交时，交点坐标就是它们共同满足的 x 和 y。</p></div>
      </section>
    </div>}
  </>;
}
