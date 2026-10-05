import { useRef, useState } from 'react';
import { ArrowDownLeft, ArrowRight, Check, Eraser, Info, RotateCcw, Sparkles } from 'lucide-react';

type Side = 'left' | 'right';
type Kind = 'x' | 'number' | 'group';
type Term = { id: string; kind: Kind; value: number; divisor?: number; insideX?: number; insideNumber?: number };
type Operation = { kind: 'multiply' | 'divide'; value: number };
type DragItem = { term?: Term; operation?: Operation; source: 'palette' | Side | 'operation'; id?: string; x: number; y: number };
const seed = (kind: Kind, value: number): Term => ({ id: crypto.randomUUID(), kind, value });
const starterPalette = [seed('x',1),seed('x',-1),seed('x',2),seed('x',-2),seed('x',3),seed('x',-3),seed('number',1),seed('number',-1),seed('number',2),seed('number',-2),seed('number',3),seed('number',-3)];
const extraPalette: Term[] = [
  { ...seed('x', 1), divisor: 2 }, { ...seed('x', -1), divisor: 2 },
  { ...seed('x', 1), divisor: 3 }, { ...seed('x', -1), divisor: 3 },
  { ...seed('group', 1), insideX: 1, insideNumber: 2 }, { ...seed('group', 1), insideX: 1, insideNumber: -2 },
  { ...seed('group', -1), insideX: 1, insideNumber: 2 }, { ...seed('group', -1), insideX: 1, insideNumber: -2 },
];
const showNum = (number: number) => {
  if (Math.abs(number - Math.round(number)) < 1e-8) return String(Math.round(number));
  for (let denominator = 2; denominator <= 12; denominator++) {
    const numerator = Math.round(number * denominator);
    if (Math.abs(number - numerator / denominator) < 1e-8) {
      let a = Math.abs(numerator), b = denominator;
      while (b) [a, b] = [b, a % b];
      return `${numerator / a}/${denominator / a}`;
    }
  }
  return String(Number(number.toFixed(2)));
};
const unsigned = (term: Term) => {
  const amount = Math.abs(term.value);
  if (term.kind === 'number') return showNum(amount);
  if (term.kind === 'group') {
    const x = term.insideX ?? 0, n = term.insideNumber ?? 0;
    const innerX = x === 0 ? '' : `${x < 0 ? '−' : ''}${Math.abs(x) === 1 ? '' : showNum(Math.abs(x))}x`;
    const innerN = n === 0 ? '' : `${innerX ? (n < 0 ? ' − ' : ' + ') : (n < 0 ? '−' : '')}${showNum(Math.abs(n))}`;
    const inner = innerX || innerN ? `${innerX}${innerN}` : '0';
    return `${amount === 1 ? '' : `${showNum(amount)} × `}(${inner})`;
  }
  const xTerm = amount === 1 ? 'x' : `${showNum(amount)} × x`;
  return term.divisor && term.divisor !== 1 ? `${xTerm} ÷ ${showNum(term.divisor)}` : xTerm;
};
const label = (term: Term) => `${term.value < 0 ? '−' : '+'}${unsigned(term)}`;
const operationLabel = (operation: Operation) => `${operation.kind === 'multiply' ? '×' : '÷'} ${showNum(Math.abs(operation.value))}${operation.value < 0 ? '（负数）' : ''}`;
const sampleLeft = () => [seed('x', 2), seed('number', 3)];
const sampleRight = () => [seed('number', 7)];

export default function EquationBuilder() {
  const [relation, setRelation] = useState('=' as '=' | '<' | '≤' | '>' | '≥');
  const [left, setLeft] = useState<Term[]>(sampleLeft);
  const [right, setRight] = useState<Term[]>(sampleRight);
  const [custom, setCustom] = useState<Term[]>([]);
  const [kind, setKind] = useState<Kind>('x');
  const [value, setValue] = useState(4);
  const [outer, setOuter] = useState(1);
  const [insideX, setInsideX] = useState(1);
  const [insideNumber, setInsideNumber] = useState(2);
  const [operationNumber, setOperationNumber] = useState(2);
  const [drag, setDrag] = useState<DragItem | null>(null);
  const [dropSide, setDropSide] = useState<Side | null>(null);
  const [operationActive, setOperationActive] = useState(false);
  const [message, setMessage] = useState('拖动任意一项到另一边，观察它怎样变号。');
  const board = useRef<HTMLDivElement>(null);

  const applyOperation = (operation: Operation) => {
    const factor = operation.kind === 'multiply' ? operation.value : 1 / operation.value;
    const transform = (items: Term[]) => items.map(term => ({ ...term, value: term.value * factor }));
    setLeft(transform); setRight(transform);
    const reverses = operation.value < 0;
    if (reverses && relation !== '=') setRelation(current => ({ '<': '>', '≤': '≥', '>': '<', '≥': '≤', '=': '=' }[current] as typeof current));
    setMessage(`两边同时${operation.kind === 'multiply' ? '乘' : '除'}以 ${showNum(operation.value)}。${reverses && relation !== '=' ? '因为乘除的是负数，不等号方向也反转了。' : '等号/不等号方向保持不变。'}`);
  };

  const makeDrop = (side: Side) => {
    if (!drag) return;
    if (drag.source === 'operation' || !drag.term) { setDrag(null); setDropSide(null); setOperationActive(false); return; }
    if (drag.source === 'palette') {
      const added = { ...drag.term, id: crypto.randomUUID() };
      (side === 'left' ? setLeft : setRight)(items => [...items, added]);
      setMessage(`把 ${label(drag.term)} 放到了${side === 'left' ? '左边' : '右边'}。继续搭建，或拖到对面观察移项。`);
    } else if (drag.source !== side && drag.id) {
      const term = drag.term;
      const moved = { ...term, id: crypto.randomUUID(), value: -term.value };
      if (drag.source === 'left') setLeft(items => items.filter(item => item.id !== drag.id));
      else setRight(items => items.filter(item => item.id !== drag.id));
      (side === 'left' ? setLeft : setRight)(items => [...items, moved]);
      const op = relation === '=' ? '等式' : '不等式';
      setMessage(`把 ${label(term)} 移到另一边后变成 ${label(moved)}。这等价于${op}两边同时${term.value > 0 ? '减去' : '加上'} ${unsigned({ ...term, value: Math.abs(term.value) })}。`);
    }
    setDrag(null); setDropSide(null); setOperationActive(false);
  };

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const operationNode = target.closest<HTMLElement>('[data-operation]');
    const node = target.closest<HTMLElement>('[data-term]');
    if (!node && !operationNode) return;
    event.preventDefault();
    if (operationNode) {
      const operation = JSON.parse(operationNode.dataset.operation || '{}') as Operation;
      setDrag({ operation, source: 'operation', x: event.clientX, y: event.clientY });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (!node) return;
    const term = JSON.parse(node.dataset.term || '{}') as Term;
    const source = node.dataset.source as DragItem['source'];
    setDrag({ term, source, id: node.dataset.id, x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const element = document.elementFromPoint(event.clientX, event.clientY);
    const target = element?.closest<HTMLElement>('[data-drop-side]');
    const side = target?.dataset.dropSide as Side | undefined;
    setDropSide(side ?? null);
    setOperationActive(Boolean(element?.closest('[data-operation-drop]')));
    setDrag({ ...drag, x: event.clientX, y: event.clientY });
  };
  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (drag.source === 'operation') {
      if (drag.operation && element?.closest('[data-operation-drop]')) applyOperation(drag.operation);
      setDrag(null); setDropSide(null); setOperationActive(false); return;
    }
    const target = element?.closest<HTMLElement>('[data-drop-side]');
    const side = target?.dataset.dropSide as Side | undefined;
    if (side) makeDrop(side);
    else { setDrag(null); setDropSide(null); setOperationActive(false); }
  };
  const addCustom = () => {
    if (kind === 'group') return;
    if (!Number.isInteger(value) || value === 0 || Math.abs(value) > 20) return;
    setCustom(items => [...items, seed(kind, value)]);
  };
  const addCustomGroup = () => {
    if (!Number.isInteger(outer) || outer === 0 || Math.abs(outer) > 10 || !Number.isInteger(insideX) || !Number.isInteger(insideNumber) || (insideX === 0 && insideNumber === 0)) return;
    setCustom(items => [...items, { ...seed('group', outer), insideX, insideNumber }]);
  };
  const reset = () => { setLeft([]); setRight([]); setRelation('='); setMessage('两边已清空。把下面的积木拖到左边或右边开始搭建。'); };
  const loadExample = () => { setLeft(sampleLeft()); setRight(sampleRight()); setRelation('='); setMessage('试着把左边的 +3 拖到右边，看它怎样变成 −3。'); };
  const remove = (side: Side, id: string) => {
    (side === 'left' ? setLeft : setRight)(items => items.filter(item => item.id !== id));
    setMessage('积木已取下，可以继续搭建。');
  };
  const side = (which: Side, items: Term[]) => <div className={`builder-side ${dropSide === which ? 'drop-active' : ''}`} data-drop-side={which}>
    <div className="builder-side-heading"><span>{which === 'left' ? '左边' : '右边'}</span><small>把积木拖到这里</small></div>
    <div className="builder-expression">{items.length ? items.map((term, index) => <span className={`builder-term ${term.kind !== 'number' ? 'variable' : ''} ${term.kind === 'group' ? 'group-term' : ''}`} key={term.id} data-term={JSON.stringify(term)} data-source={which} data-id={term.id} title="拖到等号另一边会变成相反数"><span className="term-operator">{term.value < 0 ? '−' : index > 0 ? '+' : ''}</span>{unsigned(term)}{term.kind === 'group' && <button className="term-expand" aria-label="展开括号" title="分配括号前的乘数" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); const result: Term[] = []; const xValue = (term.insideX ?? 0) * term.value; const nValue = (term.insideNumber ?? 0) * term.value; if (xValue) result.push({ ...seed('x', xValue), divisor: term.divisor }); if (nValue) result.push(seed('number', nValue)); (which === 'left' ? setLeft : setRight)(itemsNow => [...itemsNow.filter(item => item.id !== term.id), ...result]); setMessage(`${unsigned(term)} 去括号：括号外的 ${showNum(term.value)} 分别乘进括号里的每一项。`); }}>↗</button>}<button aria-label="移除积木" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); remove(which, term.id); }}>×</button></span>) : <span className="builder-zero">0</span>}</div>
  </div>;
  const palette = (term: Term, i: number) => <span className={`palette-term ${term.kind !== 'number' ? 'variable' : ''}`} key={`${term.id}-${i}`} data-term={JSON.stringify(term)} data-source="palette">{label(term)}</span>;
  const operationPalette = (operation: Operation, i: number) => <span className="operation-tile" key={`${operation.kind}-${operation.value}-${i}`} data-operation={JSON.stringify(operation)}>{operationLabel(operation)}</span>;
  const operations: Operation[] = [{kind:'multiply',value:2},{kind:'multiply',value:-2},{kind:'multiply',value:3},{kind:'divide',value:2},{kind:'divide',value:-2},{kind:'divide',value:3}];
  const customOperations: Operation[] = operationNumber > 0 && Number.isInteger(operationNumber) && operationNumber <= 20 ? [{ kind: 'multiply', value: operationNumber }, { kind: 'divide', value: operationNumber }] : [];

  return <div className="builder-page" ref={board} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={() => { setDrag(null); setDropSide(null); setOperationActive(false); }}>
    <div className="lesson-topline"><span className="eyebrow"><span className="eyebrow-dot" /> 自由实验室 · 拖动操作</span><span className="time-label">自己搭，自己试</span></div>
    <h1>自己搭一个等式或不等式</h1><p className="lead">把 x 项和数字积木拖进两边，再把某一项拖过等号。加减项会变成相反数，因为这等价于两边同时做相反的加减。</p>
    <div className="builder-toolbar"><div><span className="tiny-label">选择关系</span><div className="relation-picker">{(['=', '<', '≤', '>', '≥'] as const).map(item => <button className={relation === item ? 'selected' : ''} key={item} onClick={() => setRelation(item)}>{item}</button>)}</div></div><div className="builder-actions"><button onClick={loadExample}><Sparkles size={15} />载入示例</button><button onClick={reset}><Eraser size={15} />清空重搭</button></div></div>
    <div className="builder-board">
      {side('left', left)}<div className={`builder-relation ${operationActive ? 'operation-active' : ''}`} data-operation-drop><strong>{relation}</strong><ArrowRight size={14} /><small>两边同时<br/>运算</small></div>{side('right', right)}
    </div>
    <div className="builder-message"><Info size={16} /><span>{message}</span></div>
    <section className="term-workbench"><div className="workbench-heading"><div><span className="tiny-label">积木托盘</span><h2>拖动一项，放进等式</h2></div><span>含加减、乘除和括号</span></div><div className="term-palette">{starterPalette.map(palette)}{extraPalette.map(palette)}{custom.map(palette)}</div>
      <div className="custom-term"><b>自定义项</b><select value={kind} onChange={event => setKind(event.target.value as Kind)}><option value="x">含 x 的项</option><option value="number">常数</option></select><input type="number" min="-20" max="20" step="1" value={value} onChange={event => setValue(Number(event.target.value))} aria-label="积木系数" /><button onClick={addCustom}>加入托盘</button><small>输入 −20 到 20 的整数；可拖动的项也可自定义括号。</small></div>
      <div className="custom-group"><b>自定义括号</b><label>括号外<input type="number" min="-10" max="10" value={outer} onChange={event => setOuter(Number(event.target.value))} /></label><span>×</span><span>(</span><label>x 系数<input type="number" min="-10" max="10" value={insideX} onChange={event => setInsideX(Number(event.target.value))} /></label><label>常数<input type="number" min="-10" max="10" value={insideNumber} onChange={event => setInsideNumber(Number(event.target.value))} /></label><span>)</span><button onClick={addCustomGroup}>加入括号积木</button><small>例：2 × (x + 3)、−1 × (2x − 4)。拖进等式后可整体移项，也可点项上的 ↗ 展开。</small></div>
    </section>
    <section className="operation-workbench"><div className="workbench-heading"><div><span className="tiny-label">两边同时做运算</span><h2>把运算积木拖到等号上</h2></div><span>不是移项：左右两边都一起变化</span></div><div className="operation-palette">{operations.map(operationPalette)}{customOperations.map((operation, i) => operation.value !== 2 && operation.value !== 3 ? operationPalette(operation, i + operations.length) : null)}</div><div className="operation-custom"><label>自定义正整数 <input type="number" min="1" max="20" step="1" value={operationNumber} onChange={event => setOperationNumber(Number(event.target.value))} /></label><span>托盘会同步出现 ×{operationNumber} 和 ÷{operationNumber} 积木</span></div><div className="operation-explain">乘或除正数，不等号方向不变；乘或除负数，不等号方向反过来。等式里的等号始终不变。</div></section>
    <section className="bracket-workbench"><div className="workbench-heading"><div><span className="tiny-label">括号拆解</span><h2>让括号外的数，分别乘进括号内每一项</h2></div><span>分配律</span></div><div className="bracket-examples"><div><b>3 × (x + 2)</b><ArrowRight size={15}/><strong>3 × x + 3 × 2 = 3x + 6</strong></div><div><b>−1 × (x + 2)</b><ArrowRight size={15}/><strong>−x − 2</strong></div><div><b>−1 × (x − 2)</b><ArrowRight size={15}/><strong>−x + 2</strong></div></div><p>负号可以看作乘以 −1，所以括号里的每一项都要乘 −1；这就是去括号时加减号会改变的原因。</p></section>
    <section className="builder-understanding"><div><ArrowDownLeft size={18} /><span><b>加减项跨过去</b><small>符号变相反数，因为两边同时加减该项</small></span></div><div><Check size={18} /><span><b>乘除要两边一起做</b><small>拖运算积木到中间，方程两边同步变化</small></span></div><div><RotateCcw size={18} /><span><b>负号也要分配</b><small>−(x+2) 去括号后是 −x−2</small></span></div></section>
    {drag && <div className={`drag-ghost ${drag.term && drag.term.kind !== 'number' ? 'variable' : ''} ${drag.operation ? 'operation-ghost' : ''}`} style={{ left: drag.x + 12, top: drag.y + 12 }}>{drag.term ? label(drag.term) : drag.operation ? operationLabel(drag.operation) : ''}</div>}
  </div>;
}
