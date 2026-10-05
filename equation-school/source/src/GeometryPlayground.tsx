import { useRef, useState } from 'react';
import { Move, RotateCcw, Ruler, Sparkles } from 'lucide-react';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function GeometryPlayground() {
  const [travel, setTravel] = useState(1.35);
  const [side, setSide] = useState(8);
  const dragging = useRef(false);
  const lockedEdge = useRef<'AB' | 'BC' | 'CD' | 'DA' | null>(null);
  const left = 92, top = 54, size = 320, right = left + size, bottom = top + size;
  const position = (amount: number) => {
    const p = ((amount % 4) + 4) % 4;
    if (p <= 1) return { x: left + p * size, y: top, edge: 'AB', part: p };
    if (p <= 2) return { x: right, y: top + (p - 1) * size, edge: 'BC', part: p - 1 };
    if (p <= 3) return { x: right - (p - 2) * size, y: bottom, edge: 'CD', part: p - 2 };
    return { x: left, y: bottom - (p - 3) * size, edge: 'DA', part: p - 3 };
  };
  const p = position(travel);
  const heightRatio = p.edge === 'AB' ? 0 : p.edge === 'BC' ? p.part : p.edge === 'CD' ? 1 : 1 - p.part;
  const height = side * heightRatio;
  const area = side * height / 2;
  const areaText = Number.isInteger(area) ? String(area) : area.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  const note = p.edge === 'AB' ? 'P 在 AB 上，A、P、B 三点共线，三角形退化，面积为 0。' : p.edge === 'BC' ? 'P 沿 BC 向下移动，高逐渐变大，所以面积逐渐增加。' : p.edge === 'CD' ? 'P 沿 CD 移动时，到 AB 的距离一直等于正方形边长，面积保持不变。' : 'P 沿 DA 向上移动，高逐渐变小，所以面积逐渐减小。';
  const dragLabel = p.edge === 'AB' ? { x: 0, y: -16, anchor: 'middle' as const } : p.edge === 'BC' ? { x: 17, y: 4, anchor: 'start' as const } : p.edge === 'CD' ? { x: 0, y: 25, anchor: 'middle' as const } : { x: -17, y: 4, anchor: 'end' as const };

  const updateFromPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width * 520;
    const y = (event.clientY - box.top) / box.height * 430;
    let edge = lockedEdge.current ?? p.edge as 'AB' | 'BC' | 'CD' | 'DA';
    if (edge === 'AB' && x > right) edge = 'BC';
    else if (edge === 'AB' && x < left) edge = 'DA';
    else if (edge === 'BC' && y > bottom) edge = 'CD';
    else if (edge === 'BC' && y < top) edge = 'AB';
    else if (edge === 'CD' && x < left) edge = 'DA';
    else if (edge === 'CD' && x > right) edge = 'BC';
    else if (edge === 'DA' && y < top) edge = 'AB';
    else if (edge === 'DA' && y > bottom) edge = 'CD';
    lockedEdge.current = edge;
    const amount = edge === 'AB' ? (clamp(x, left, right) - left) / size
      : edge === 'BC' ? 1 + (clamp(y, top, bottom) - top) / size
      : edge === 'CD' ? 2 + (right - clamp(x, left, right)) / size
      : 3 + (bottom - clamp(y, top, bottom)) / size;
    setTravel(amount);
  };
  const reset = () => { setTravel(1.35); setSide(8); };

  return <div className="geometry-page">
    <div className="lesson-topline"><span className="eyebrow"><span className="eyebrow-dot" /> 动点几何 · 拖动观察</span><span className="time-label">边拖边看面积变化</span></div>
    <h1>正方形边上的动点 P</h1>
    <p className="lead">正方形 ABCD 的边长是 {side}。P 可以沿着四条边移动；连接 PA、PB 后，观察三角形 PAB 的高和面积怎样改变。</p>
    <div className="geometry-layout">
      <section className="geometry-card"><div className="geometry-heading"><div><span className="tiny-label">拖动图上的 P 点</span><h2>△PAB 会跟着一起变化</h2></div><span className="live-badge"><i /> 实时变化</span></div>
        <svg className="square-diagram" viewBox="0 0 520 430" role="img" aria-label="正方形 ABCD 边上可拖动的点 P，以及三角形 PAB" onPointerDown={event => { if ((event.target as Element).closest('[data-point-p]')) { dragging.current = true; lockedEdge.current = p.edge as 'AB' | 'BC' | 'CD' | 'DA'; event.currentTarget.setPointerCapture(event.pointerId); updateFromPointer(event); } }} onPointerMove={event => { if (dragging.current) updateFromPointer(event); }} onPointerUp={() => { dragging.current = false; lockedEdge.current = null; }} onPointerCancel={() => { dragging.current = false; lockedEdge.current = null; }}>
          <rect x="0" y="0" width="520" height="430" rx="20" fill="#fffefa" />
          <polygon points={`${p.x},${p.y} ${left},${top} ${right},${top}`} fill="#f8d9bb" opacity=".68" />
          <line x1={left} y1={top} x2={right} y2={top} stroke="#4e6958" strokeWidth="5" strokeLinecap="round" />
          <line x1={right} y1={top} x2={right} y2={bottom} stroke="#4e6958" strokeWidth="5" strokeLinecap="round" />
          <line x1={right} y1={bottom} x2={left} y2={bottom} stroke="#4e6958" strokeWidth="5" strokeLinecap="round" />
          <line x1={left} y1={bottom} x2={left} y2={top} stroke="#4e6958" strokeWidth="5" strokeLinecap="round" />
          <line x1={left} y1={top} x2={p.x} y2={p.y} stroke="#df8050" strokeWidth="4" />
          <line x1={right} y1={top} x2={p.x} y2={p.y} stroke="#df8050" strokeWidth="4" />
          {heightRatio > 0 && <><line x1={p.x} y1={top} x2={p.x} y2={p.y} stroke="#788eb8" strokeWidth="2.5" strokeDasharray="7 6" /><text x={p.x + (p.x > right - 22 ? -12 : 10)} y={(top + p.y) / 2} textAnchor={p.x > right - 22 ? 'end' : 'start'} className="geometry-measure">h = {height.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}</text></>}
          <text x={left - 19} y={top - 15} textAnchor="end" className="vertex-label">A</text><text x={right + 19} y={top - 15} textAnchor="start" className="vertex-label">B</text><text x={right + 19} y={bottom + 9} textAnchor="start" className="vertex-label">C</text><text x={left - 19} y={bottom + 9} textAnchor="end" className="vertex-label">D</text>
          <text x={(left + right) / 2} y={top - 17} textAnchor="middle" className="side-label">AB = {side}</text><text x={left - 26} y={(top + bottom) / 2} textAnchor="middle" className="side-label" transform={`rotate(-90 ${left - 26} ${(top + bottom) / 2})`}>AD = {side}</text>
          <text x={(left + right + p.x) / 3} y={top + 24} textAnchor="middle" className="triangle-label">△PAB</text>
          <circle cx={p.x} cy={p.y} r="15" fill="transparent" data-point-p="true" style={{ cursor: 'grab', touchAction: 'none' }} />
          <circle cx={p.x} cy={p.y} r="8" fill="#df8050" stroke="white" strokeWidth="3" data-point-p="true" style={{ cursor: 'grab', touchAction: 'none' }} />
          <text x={p.x + dragLabel.x} y={p.y + dragLabel.y} textAnchor={dragLabel.anchor} className="point-label" data-point-p="true" style={{ cursor: 'grab', touchAction: 'none' }}>P</text>
        </svg>
        <div className="travel-control"><div><Move size={16} /><b>沿正方形边移动 P</b><span>拖图上的圆点，或拖动滑块</span></div><input type="range" min="0" max="4" step="0.005" value={travel} onChange={event => setTravel(Number(event.target.value))} aria-label="沿正方形边移动点 P" /><div className="edge-progress"><span>A</span><span>B</span><span>C</span><span>D</span><span>A</span></div><div className="edge-name">P 当前在 <b>{p.edge}</b> 边上</div></div>
      </section>
      <aside className="geometry-side">
        <section className="geometry-card area-card"><div className="card-kicker"><Sparkles size={16} />实时测量</div><div className="area-value">{areaText}<small>平方单位</small></div><div className="area-equation">S△PAB = AB × h ÷ 2</div><div className="measure-list"><div><span>底边 AB</span><b>{side}</b></div><div><span>高 h</span><b>{height.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}</b></div><div><span>P 沿边的位置</span><b>{p.edge}</b></div></div><p className="geometry-note">{note}</p></section>
        <section className="geometry-card concept-card"><div className="card-kicker"><Ruler size={16} />看图想一想</div><h3>为什么面积会变化？</h3><p>三角形的底边始终是 AB，所以底边长度不变。面积变化只看 P 到 AB 的垂直距离，也就是高 h。</p><div className="formula-banner">三角形面积 = 底 × 高 ÷ 2</div><label className="side-slider">正方形边长 <b>{side}</b><input type="range" min="4" max="12" step="1" value={side} onChange={event => setSide(Number(event.target.value))} /></label><button className="geometry-reset" onClick={reset}><RotateCcw size={15} />回到起点</button></section>
      </aside>
    </div>
  </div>;
}
