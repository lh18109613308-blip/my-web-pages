import { useMemo, useRef, useState } from 'react';
import { Eraser, MousePointer2 } from 'lucide-react';

const SIZE = 500, PAD = 44, SPAN = SIZE - PAD * 2;
const toX = (x: number, range: number) => PAD + (x + range) / (2 * range) * SPAN;
const toY = (y: number, range: number) => SIZE - PAD - (y + range) / (2 * range) * SPAN;
const fromX = (x: number, range: number) => (x - PAD) / SPAN * (2 * range) - range;
const fromY = (y: number, range: number) => (SIZE - PAD - y) / SPAN * (2 * range) - range;
const coordinateTicks = (range: number) => {
  const step = Math.max(1, Math.ceil(range / 5));
  const ticks: number[] = [];
  for (let value = Math.ceil(-range / step) * step; value <= range; value += step) ticks.push(value);
  return ticks;
};
type Sample = { x: number; y: number };
type Params = { a: number; b: number; c: number };
type Kind = 'line' | 'quadratic' | 'free' | 'equation';
const defaults: Params[] = [{ a: 1, b: 0, c: 0 }, { a: 0, b: 1, c: 0 }];
const kindName = (kind: Kind) => kind === 'line' ? '一次函数' : kind === 'quadratic' ? '二次函数' : kind === 'equation' ? '自写方程' : '手绘函数';
const evaluateExpression = (source: string, x: number, y: number) => {
  const compact = source.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/²/g, '^2').replace(/\s+/g, '');
  const raw = compact.match(/(?:\d+(?:\.\d*)?|\.\d+)|[xy]|[()+\-*/^]/gi);
  if (!raw || raw.join('') !== compact) throw new Error('方程里有不认识的符号');
  const tokens: string[] = [];
  for (const token of raw) {
    const previous = tokens[tokens.length - 1];
    const endsValue = previous && (/^(?:\d|x$|y$|\))/.test(previous));
    const startsValue = /^(?:\d|x$|y$|\()/.test(token);
    if (endsValue && startsValue) tokens.push('*');
    tokens.push(token.toLowerCase());
  }
  let index = 0;
  const expression = (): number => { let value = product(); while (tokens[index] === '+' || tokens[index] === '-') { const op = tokens[index++]; const right = product(); value = op === '+' ? value + right : value - right; } return value; };
  const product = (): number => { let value = signed(); while (tokens[index] === '*' || tokens[index] === '/') { const op = tokens[index++]; const right = signed(); value = op === '*' ? value * right : value / right; } return value; };
  const signed = (): number => { if (tokens[index] === '+') { index++; return signed(); } if (tokens[index] === '-') { index++; return -signed(); } return power(); };
  const power = (): number => { let value = atom(); if (tokens[index] === '^') { index++; value = Math.pow(value, signed()); } return value; };
  const atom = (): number => {
    const token = tokens[index++];
    if (token === '(') { const value = expression(); if (tokens[index++] !== ')') throw new Error('括号没有配对'); return value; }
    if (token === 'x') return x; if (token === 'y') return y;
    const value = Number(token); if (!token || !Number.isFinite(value)) throw new Error('请检查数字和括号'); return value;
  };
  const value = expression();
  if (index !== tokens.length || !Number.isFinite(value)) throw new Error('方程无法计算，请检查写法');
  return value;
};
const evaluateEquation = (source: string, x: number) => {
  const sides = source.includes('=') ? source.split('=') : ['y', source];
  if (sides.length !== 2 || !sides[0].trim() || !sides[1].trim()) throw new Error('请写成 y=表达式，或 左边=右边');
  const difference = (y: number) => evaluateExpression(sides[0], x, y) - evaluateExpression(sides[1], x, y);
  const atZero = difference(0), coefficient = difference(1) - atZero;
  if (Math.abs(coefficient) < 1e-9) throw new Error('这个方程不能唯一确定 y；请试试含 y 的一次方程');
  const result = -atZero / coefficient;
  if (!Number.isFinite(result)) throw new Error('这个 x 位置无法得到 y');
  return result;
};
const equation = (kind: Kind, p: Params) => kind === 'line'
  ? `y = ${p.b}x ${p.c < 0 ? '−' : '+'} ${Math.abs(p.c)}`
  : `y = ${p.a}x² ${p.b < 0 ? '−' : '+'} ${Math.abs(p.b)}x ${p.c < 0 ? '−' : '+'} ${Math.abs(p.c)}`;

export default function FunctionGraph() {
  const [kinds, setKinds] = useState<Kind[]>(['quadratic', 'line']);
  const [params, setParams] = useState<Params[]>(defaults);
  const [equations, setEquations] = useState(['y=x^2', 'y=x']);
  const [equationShifts, setEquationShifts] = useState<Sample[]>([{ x: 0, y: 0 }, { x: 0, y: 0 }]);
  const [samples, setSamples] = useState<Sample[][]>([[], []]);
  const [active, setActive] = useState<0 | 1>(0);
  const [showSecond, setShowSecond] = useState(false);
  const [xRange, setXRange] = useState(5);
  const [yRange, setYRange] = useState(5);
  const drawing = useRef(false);
  const drag = useRef<{ index: 0 | 1; start: Sample; params: Params; samples: Sample[]; shift: Sample } | null>(null);
  const curves = useMemo(() => [0, 1].map(index => {
    if (kinds[index] === 'free') return samples[index];
    if (kinds[index] === 'equation') {
      try { return Array.from({ length: 201 }, (_, i) => { const x = -xRange + i * 2 * xRange / 200, offset = equationShifts[index]; return { x, y: evaluateEquation(equations[index], x - offset.x) + offset.y }; }); }
      catch { return []; }
    }
    return Array.from({ length: 201 }, (_, i) => {
      const x = -xRange + i * 2 * xRange / 200, p = params[index];
      return { x, y: kinds[index] === 'line' ? p.b * x + p.c : p.a * x * x + p.b * x + p.c };
    });
  }), [kinds, params, samples, equations, equationShifts, xRange]);
  const paths = curves.map(curve => curve.map((p, i) => `${i ? 'L' : 'M'}${toX(p.x, xRange).toFixed(1)},${toY(p.y, yRange).toFixed(1)}`).join(' '));
  const intersections = useMemo(() => {
    if (!showSecond || curves.some(line => line.length < 2)) return [];
    const at = (curve: Sample[], x: number) => {
      const i = curve.findIndex(p => p.x >= x);
      if (i < 0) return curve[curve.length - 1].y;
      if (!i) return curve[0].y;
      const l = curve[i - 1], r = curve[i]; return l.y + (r.y - l.y) * (x - l.x) / (r.x - l.x || 1);
    };
    const points: Sample[] = [], step = xRange / 200;
    const difference = (x: number) => at(curves[0], x) - at(curves[1], x);
    const add = (root: number) => { const y = (at(curves[0], root) + at(curves[1], root)) / 2; if (Math.abs(y) <= yRange && !points.some(p => Math.abs(p.x - root) < step * 4)) points.push({ x: root, y }); };
    for (let x = -xRange + step; x < xRange - step; x += step) {
      const d = difference(x), prev = difference(x - step), next = difference(x + step);
      if (d * prev < 0) add(x - step * d / (d - prev));
      // A tangent touches without crossing, so detect a local minimum in the distance between curves.
      if (Math.abs(d) < 0.012 && Math.abs(d) <= Math.abs(prev) && Math.abs(d) <= Math.abs(next)) {
        const denominator = prev - 2 * d + next;
        const offset = denominator ? Math.max(-1, Math.min(1, 0.5 * (prev - next) / denominator)) : 0;
        add(x + offset * step);
      }
    }
    return points;
  }, [curves, showSecond, xRange, yRange]);
  const pointFrom = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(PAD, Math.min(SIZE - PAD, (event.clientX - rect.left) / rect.width * SIZE));
    const y = Math.max(PAD, Math.min(SIZE - PAD, (event.clientY - rect.top) / rect.height * SIZE));
    return { x: fromX(x, xRange), y: fromY(y, yRange) };
  };
  const addSample = (sample: Sample) => setSamples(old => {
    const next = [...old], map = new Map(next[active].map(p => [Math.round(p.x * 30), p]));
    map.set(Math.round(sample.x * 30), sample); next[active] = [...map.values()].sort((p, q) => p.x - q.x); return next;
  });
  const nearestCurve = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width * SIZE, py = (event.clientY - rect.top) / rect.height * SIZE;
    let best: { index: 0 | 1; distance: number } | null = null;
    for (let index = 0; index < curves.length; index++) {
      const curve = curves[index];
      if (index === 1 && !showSecond) continue;
      for (let i = 0; i < curve.length; i += Math.max(1, Math.floor(curve.length / 180))) {
        const distance = Math.hypot(toX(curve[i].x, xRange) - px, toY(curve[i].y, yRange) - py);
        if (!best || distance < best.distance) best = { index: index as 0 | 1, distance };
      }
    }
    return best && best.distance < 25 ? best.index : null;
  };
  const beginPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const point = pointFrom(event), hit = nearestCurve(event);
    if (hit !== null && (kinds[hit] !== 'free' || samples[hit].length > 1)) {
      setActive(hit); drawing.current = false;
      drag.current = { index: hit, start: point, params: { ...params[hit] }, samples: samples[hit].map(p => ({ ...p })), shift: { ...equationShifts[hit] } };
    } else if (kinds[active] === 'free') {
      drawing.current = true; addSample(point);
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const movePointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const point = pointFrom(event);
    if (drag.current) {
      const d = drag.current, dx = point.x - d.start.x, dy = point.y - d.start.y;
      if (kinds[d.index] === 'equation') {
        setEquationShifts(old => old.map((offset, i) => i === d.index ? { x: d.shift.x + dx, y: d.shift.y + dy } : offset));
      } else if (kinds[d.index] === 'free') {
        const shifted = d.samples.map(p => ({ x: Math.max(-xRange, Math.min(xRange, p.x + dx)), y: Math.max(-yRange, Math.min(yRange, p.y + dy)) }));
        setSamples(old => old.map((line, i) => i === d.index ? shifted : line));
      } else if (kinds[d.index] === 'line') {
        setParams(old => old.map((p, i) => i === d.index ? { ...p, c: d.params.c + dy - d.params.b * dx } : p));
      } else {
        setParams(old => old.map((p, i) => i === d.index ? { ...p, b: d.params.b - 2 * d.params.a * dx, c: d.params.c + d.params.a * dx * dx - d.params.b * dx + dy } : p));
      }
    } else if (drawing.current) addSample(point);
  };
  const endPointer = () => { drawing.current = false; drag.current = null; };
  const changeParam = (key: keyof Params, value: number) => setParams(old => old.map((p, i) => i === active ? { ...p, [key]: value } : p));
  const setKind = (kind: Kind) => { setKinds(old => old.map((v, i) => i === active ? kind : v)); drawing.current = false; };
  const clearActive = () => setSamples(old => old.map((line, i) => i === active ? [] : line));
  let equationError = '';
  if (kinds[active] === 'equation') { try { evaluateEquation(equations[active], 0); } catch (error) { equationError = error instanceof Error ? error.message : '请检查方程写法'; } }
  const label = (i: number) => kinds[i] === 'free' ? `y = f${i + 1}(x)` : kinds[i] === 'equation' ? equations[i] : equation(kinds[i], params[i]);
  return <div className="function-explorer">
    <div className="function-layout">
      <section className="function-graph-card">
        <div className="axis-range-controls"><span>坐标范围</span><label>x 轴 <button aria-label="缩小 x 轴范围" onClick={() => setXRange(v => Math.max(2, v - 1))}>−</button><b>±{xRange}</b><button aria-label="扩大 x 轴范围" onClick={() => setXRange(v => Math.min(50, v + 1))}>+</button></label><label>y 轴 <button aria-label="缩小 y 轴范围" onClick={() => setYRange(v => Math.max(2, v - 1))}>−</button><b>±{yRange}</b><button aria-label="扩大 y 轴范围" onClick={() => setYRange(v => Math.min(50, v + 1))}>+</button></label><button className="range-reset" onClick={() => { setXRange(5); setYRange(5); }}>恢复 ±5</button></div>
        <div className="function-equation"><span>函数 1 · {kindName(kinds[0])}</span><strong>{label(0)}</strong></div>
        {showSecond && <div className="function-equation second"><span>函数 2 · {kindName(kinds[1])}</span><strong>{label(1)}</strong></div>}
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={`function-svg ${kinds[active] === 'free' ? 'can-draw' : ''}`} role="img" aria-label="函数坐标图，可直接拖动或绘制函数曲线" onPointerDown={beginPointer} onPointerMove={movePointer} onPointerUp={endPointer} onPointerCancel={endPointer}>
          <defs><clipPath id="function-plot-clip"><rect x={PAD} y={PAD} width={SPAN} height={SPAN}/></clipPath></defs>
          {coordinateTicks(xRange).filter(value => value !== 0).map(value => <g key={`x${value}`}><line x1={toX(value, xRange)} y1={PAD} x2={toX(value, xRange)} y2={SIZE - PAD} className="function-grid"/><text x={toX(value, xRange)} y={toY(0, yRange) + 17} className="function-tick" textAnchor="middle">{value}</text></g>)}
          {coordinateTicks(yRange).filter(value => value !== 0).map(value => <g key={`y${value}`}><line x1={PAD} y1={toY(value, yRange)} x2={SIZE - PAD} y2={toY(value, yRange)} className="function-grid"/><text x={toX(0, xRange) - 9} y={toY(value, yRange) + 4} className="function-tick" textAnchor="end">{value}</text></g>)}
          <line x1={PAD} y1={toY(0, yRange)} x2={SIZE - PAD} y2={toY(0, yRange)} className="function-axis"/><line x1={toX(0, xRange)} y1={PAD} x2={toX(0, xRange)} y2={SIZE - PAD} className="function-axis"/><text x={SIZE - PAD + 8} y={toY(0, yRange) + 5} className="axis-label">x</text><text x={toX(0, xRange) + 7} y={PAD - 12} className="axis-label">y</text><text x={toX(0, xRange) - 9} y={toY(0, yRange) + 17} className="function-tick">0</text>
          {paths.map((path, i) => (i === 0 || showSecond) && path && <path key={i} d={path} clipPath="url(#function-plot-clip)" className={i ? 'function-curve second' : 'function-curve'}/>)}
          {kinds.map((kind, i) => { if (i === 1 && !showSecond || kind !== 'quadratic') return null; const p = params[i], vx = p.a ? -p.b / (2 * p.a) : NaN, vy = p.a ? p.c - p.b * p.b / (4 * p.a) : NaN; return Math.abs(vx) <= xRange && Math.abs(vy) <= yRange ? <circle key={i} cx={toX(vx, xRange)} cy={toY(vy, yRange)} r="5" className={i ? 'vertex-dot second' : 'vertex-dot'}/> : null; })}
          {intersections.map((p, i) => <g key={i}><circle cx={toX(p.x, xRange)} cy={toY(p.y, yRange)} r="7" className="intersection-dot"/><text x={toX(p.x, xRange) + 9} y={toY(p.y, yRange) - 8} className="intersection-label">({p.x.toFixed(2)}，{p.y.toFixed(2)})</text></g>)}
        </svg>
        <p className="function-graph-tip"><><MousePointer2 size={15}/>{kinds[active] === 'free' ? '空白处按住绘制；抓住已有曲线可整体拖动' : '抓住图上的曲线并拖动，可直接调整它的位置'}</></p>
        {showSecond && <div className="function-intersections">{intersections.length ? <>交点 / 方程组的解：{intersections.map(p => `(${p.x.toFixed(2)}，${p.y.toFixed(2)})`).join('、')}</> : '目前在图中范围内没有交点'}</div>}
      </section>
      <section className="function-controls">
        <div className="curve-select"><button className={!active ? 'selected' : ''} onClick={() => setActive(0)}><i/>函数 1</button>{showSecond && <button className={active ? 'selected second-select' : 'second-select'} onClick={() => setActive(1)}><i/>函数 2</button>}</div>
        <button className={`add-second ${showSecond ? 'enabled' : ''}`} onClick={() => { setShowSecond(v => !v); setActive(0); drawing.current = false; }}>{showSecond ? '− 收起第二条曲线' : '+ 添加第二条曲线'}</button>
        <h3>选择函数 {active + 1} 的类型</h3>
        <div className="function-type-options"><button className={kinds[active] === 'line' ? 'selected' : ''} onClick={() => setKind('line')}>一次函数<small>y = kx + b</small></button><button className={kinds[active] === 'quadratic' ? 'selected' : ''} onClick={() => setKind('quadratic')}>二次函数<small>y = ax² + bx + c</small></button><button className={kinds[active] === 'equation' ? 'selected' : ''} onClick={() => setKind('equation')}>写方程<small>输入后出图</small></button><button className={kinds[active] === 'free' ? 'selected' : ''} onClick={() => setKind('free')}>自己画<small>手绘曲线</small></button></div>
        {kinds[active] === 'equation' ? <>
          <p>写出方程，图像会跟着更新。支持括号、加减乘除和平方。</p>
          <label className="equation-entry">输入函数 {active + 1}<input value={equations[active]} onChange={e => setEquations(old => old.map((value, i) => i === active ? e.target.value : value))} placeholder="例如：y=2x+1 或 2x+y=4" aria-label={`输入函数 ${active + 1} 的方程`}/></label>
          <small className="equation-format-tip">支持一次、二次方程和括号；平方可写 x^2 或 x²。</small>
          {equationError && <div className="equation-error" role="status">{equationError}</div>}
          {!equationError && (equationShifts[active].x || equationShifts[active].y) && <small className="equation-shift-note">图像已整体平移：横向 {equationShifts[active].x.toFixed(1)}，纵向 {equationShifts[active].y.toFixed(1)}</small>}
        </> : kinds[active] === 'line' ? <>
          <p>填写 y = kx + b 中的 k 和 b。</p>
          <div className="coefficient-fields"><label>k<input type="number" step="any" value={params[active].b} onChange={e => changeParam('b', Number(e.target.value))}/></label><label>b<input type="number" step="any" value={params[active].c} onChange={e => changeParam('c', Number(e.target.value))}/></label></div>
        </> : kinds[active] === 'quadratic' ? <>
          <p>填写 y = ax² + bx + c 中的 a、b、c。</p>
          <div className="coefficient-fields three"><label>a<input type="number" step="any" value={params[active].a} onChange={e => changeParam('a', Number(e.target.value))}/></label><label>b<input type="number" step="any" value={params[active].b} onChange={e => changeParam('b', Number(e.target.value))}/></label><label>c<input type="number" step="any" value={params[active].c} onChange={e => changeParam('c', Number(e.target.value))}/></label></div>
        </> : <>
          <p>先选“函数 1 / 函数 2”，再在左侧坐标图上按住拖动画线。</p>
          <div className="draw-tip"><MousePointer2 size={17}/><span><b>鼠标或手指按住拖动</b><small>曲线会从左向右连接。</small></span></div>
          <div className="function-fact"><b>它仍然是函数吗？</b><span>同一个 x 只能对应一个 y。竖直尺子最多碰到曲线一次。</span></div>
          <button className="clear-curve" onClick={clearActive}><Eraser size={16}/>清除函数 {active + 1}</button>
        </>}
      </section>
    </div>
  </div>;
}
