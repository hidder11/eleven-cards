import {uiSurfaceStyles} from './ui-surface.js';
// Domain-neutral SVG renderer. Adapters own data, geometry, colors and annotations.
export function graphLineStyle(style, width = 3.5) {
  return {style, width, dash: style === 'dashed' ? '8 7' : style === 'dotted' ? '1 7' : 'none', cap: style === 'dashed' ? 'butt' : 'round'};
}
const graphAttribute = value => String(value).replace(/[&"<>]/g, c => ({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));
export class SharedGraph {
  static hoverGroup(host) {
    return host._config?.sync_hover === false ? null : (host._config?.hover_sync_group?.trim() || 'default');
  }
  static hoverState() {
    const key = Symbol.for('eleven-cards.hover-sync.v1');
    const target = globalThis.window ?? globalThis;
    return target[key] ??= new Map();
  }
  static connectHover(host, receive) {
    this.disconnectHover(host);
    host._receiveSharedHover = receive;
    host._sharedHoverListener = event => {
      const {source, group, timestamp} = event.detail;
      if (source !== host && host.isConnected && group === this.hoverGroup(host)) receive(timestamp);
    };
    window.addEventListener('eleven-cards:hover-sync', host._sharedHoverListener);
    // Scroll does not cross shadow roots: listen in every enclosing tree.
    host._sharedScrollTargets = [window];
    for (let root = host.getRootNode?.(); root && root !== window; root = root.host?.getRootNode()) {
      host._sharedScrollTargets.push(root);
    }
    host._sharedScrollListener = event => {
      if (event?.composedPath?.().some(node => node?.classList?.contains('tooltip'))) return;
      host._hideTooltip();
    };
    for (const target of host._sharedScrollTargets) target.addEventListener('scroll', host._sharedScrollListener, true);
    window.addEventListener('resize', host._sharedScrollListener);
  }
  static tooltipInView(host) {
    const chart = host.shadowRoot?.querySelector('.chart');
    const box = chart?.getBoundingClientRect?.();
    if (!box) return true;
    const bottom = box.bottom ?? box.top + box.height, right = box.right ?? box.left + box.width;
    if (bottom <= 0 || right <= 0 || box.top >= (window.innerHeight ?? Infinity) || box.left >= (window.innerWidth ?? Infinity)) return false;
    // Respect nested scrolling/clipping containers, including HA's shadow trees.
    for (let node = host; node; node = node.parentElement ?? node.getRootNode?.().host) {
      if (!node.getBoundingClientRect || !globalThis.getComputedStyle) continue;
      const style = getComputedStyle(node), clipX = /auto|scroll|hidden|clip/.test(style.overflowX), clipY = /auto|scroll|hidden|clip/.test(style.overflowY);
      if (!clipX && !clipY) continue;
      const bounds = node.getBoundingClientRect();
      if ((clipY && (bottom <= bounds.top || box.top >= bounds.bottom)) || (clipX && (right <= bounds.left || box.left >= bounds.right))) return false;
    }
    return true;
  }
  static tooltipStyles() {
    return uiSurfaceStyles('.tooltip')+`.tooltip{position:absolute;z-index:4;box-sizing:border-box;min-width:0;max-width:calc(100% - 8px);padding:12px;border:0;border-radius:8px;color:var(--primary-text-color,#20252b);background:var(--ha-card-background,var(--card-background-color,#fff));font-size:12px;line-height:1.5;font-variant-numeric:tabular-nums;overflow:auto;overflow-wrap:anywhere;pointer-events:none}.tooltip[hidden]{display:none}.tooltip strong{display:block;margin-bottom:10px;font-size:12px;font-weight:600;white-space:normal}.tooltip span{display:grid;grid-template-columns:7px minmax(0,1fr);column-gap:7px;padding:5px 0;white-space:normal;align-items:baseline}.tooltip i{display:block;width:7px;height:7px;border:0;border-radius:2px;background:var(--series-color)}.tooltip b{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;font-weight:400;min-width:0;overflow-wrap:anywhere}.tooltip .tooltip-label{font-style:normal;color:var(--secondary-text-color,#9ca3af)}.tooltip .tooltip-value{font-weight:600;color:var(--primary-text-color,#20252b);font-style:normal;text-align:right;white-space:normal;overflow-wrap:anywhere}.tooltip small{display:block;grid-column:2;color:var(--secondary-text-color,#666);font-size:10px;white-space:normal;font-variant-numeric:tabular-nums}`;
  }
  static tooltipPlacement({left,right,top,bottom,width,height,x,y,markers=[],gap=6}) {
    const clamp=(value,min,max)=>Math.max(min,Math.min(value,Math.max(min,max)));
    const candidates=[];
    for(const dx of [gap,-width-gap])for(const dy of [gap,-height-gap]){
      const l=clamp(x+dx,left,right-width),t=clamp(y+dy,top,bottom-height);
      const overlaps=markers.filter(m=>(m.right??m.x+4)>l-3&&(m.left??m.x-4)<l+width+3&&(m.bottom??m.y+4)>t-3&&(m.top??m.y-4)<t+height+3).length;
      const coversPointer=x>=l&&x<=l+width&&y>=t&&y<=t+height;
      const distance=Math.max(l-x,0,x-l-width)+Math.max(t-y,0,y-t-height);
      const clipped=Math.abs(l-x-dx)+Math.abs(t-y-dy);
      candidates.push({left:l,top:t,score:overlaps*10000+(coversPointer?100000:0)+distance+clipped});
    }
    const best=candidates.sort((a,b)=>a.score-b.score)[0];return {left:best.left,top:best.top};
  }
  static rememberTooltipPointer(host,event) {
    host._tooltipPointer=Number.isFinite(event?.clientX)&&Number.isFinite(event?.clientY)?{x:event.clientX,y:event.clientY}:null;
  }
  static positionTooltip(host,{chart,tooltip,x,y,markers=[],local=true}) {
    const box=chart.getBoundingClientRect(),sx=box.width/(chart.clientWidth||box.width)||1,sy=box.height/(chart.clientHeight||box.height)||1;
    const content=host.shadowRoot?.querySelector('.card-content,.content')?.getBoundingClientRect?.()??box;
    let left=Math.max(box.left+4,8),right=Math.min((box.right??box.left+box.width)-4,globalThis.window?.innerWidth-8||Infinity);
    let top=Math.max(content.top+4,8),bottom=Math.min((content.bottom??content.top+content.height)-4,globalThis.window?.innerHeight-8||Infinity);
    // Respect clipping parents and HA shadow-tree scrolling containers.
    for(let node=chart.parentElement;node;node=node.parentElement??node.getRootNode?.().host){
      if(!globalThis.getComputedStyle||!node.getBoundingClientRect)continue;
      const style=getComputedStyle(node),r=node.getBoundingClientRect();
      if(/auto|scroll|hidden|clip/.test(style.overflowX)){left=Math.max(left,r.left+4);right=Math.min(right,r.right-4);}
      if(/auto|scroll|hidden|clip/.test(style.overflowY)){top=Math.max(top,r.top+4);bottom=Math.min(bottom,r.bottom-4);}
    }
    right=Math.max(left,right);bottom=Math.max(top,bottom);
    tooltip.style.maxWidth=`${(right-left)/sx}px`;tooltip.style.maxHeight=`${(bottom-top)/sy}px`;
    const measured=tooltip.getBoundingClientRect(),active=this.hoverState().get(this.hoverGroup(host));
    const pointer=(local||active?.source===host)?host._tooltipPointer:null;
    const anchor=pointer??{x:box.left+x,y:box.top+y};
    const placement=this.tooltipPlacement({left,right,top,bottom,width:measured.width,height:measured.height,x:anchor.x,y:anchor.y,markers:markers.map(m=>({left:box.left+(m.left??m.x-4),right:box.left+(m.right??m.x+4),top:box.top+(m.top??m.y-4),bottom:box.top+(m.bottom??m.y+4)}))});
    tooltip.style.left=`${(placement.left-box.left)/sx}px`;tooltip.style.top=`${(placement.top-box.top)/sy}px`;
    return placement;
  }
  static yGrid(axes, height = 300, width = 1000) {
    const positions = new Map();
    for (const axis of axes) for (const value of axis.ticks) {
      const y = Number(((axis.max - value) / (axis.max - axis.min) * height).toFixed(6));
      positions.set(y, positions.get(y) || value === 0);
    }
    return `<g class="y-grid" aria-hidden="true" pointer-events="none">${[...positions].map(([y,zero])=>`<line class="y-grid-line" x1="0" x2="${width}" y1="${y}" y2="${y}" stroke="var(--divider-color,#ddd)" stroke-width="0.8" stroke-opacity="${zero ? 1 : .65}" vector-effect="non-scaling-stroke"/>`).join('')}</g>`;
  }
  static publishHover(host, timestamp) {
    const group = this.hoverGroup(host);
    if (!group || !host.isConnected || !Number.isFinite(timestamp)) return;
    this.hoverState().set(group, {source: host, timestamp});
    window.dispatchEvent(new CustomEvent('eleven-cards:hover-sync', {detail: {source: host, group, timestamp}}));
  }
  static clearHover(host) {
    for (const [group, active] of this.hoverState()) {
      if (active.source !== host) continue;
      this.hoverState().delete(group);
      window.dispatchEvent(new CustomEvent('eleven-cards:hover-sync', {detail: {source: host, group, timestamp: null}}));
    }
  }
  static hoverSourceInEvent(host, event) {
    const active = this.hoverState().get(this.hoverGroup(host));
    return Boolean(active && event.composedPath().includes(active.source));
  }
  static restoreHover(host) {
    if (!host.isConnected) return;
    const active = this.hoverState().get(this.hoverGroup(host));
    if (active && host.isConnected) host._receiveSharedHover?.(active.timestamp);
  }
  static disconnectHover(host) {
    this.clearHover(host);
    if (host._sharedHoverListener) globalThis.window?.removeEventListener('eleven-cards:hover-sync', host._sharedHoverListener);
    for (const target of host._sharedScrollTargets ?? []) target.removeEventListener('scroll', host._sharedScrollListener, true);
    globalThis.window?.removeEventListener('resize', host._sharedScrollListener);
    host._sharedScrollTargets = [];
    host._sharedScrollListener = null;
    host._sharedHoverListener = null;
    host._receiveSharedHover = null;
  }
  static interpolation(value, fallback = 'smooth') {
    const mode = value == null || value === '' ? fallback : value;
    if (!['smooth', 'linear', 'step'].includes(mode)) throw new Error('line_interpolation');
    return mode;
  }
  static path(points, mode = 'smooth', end) {
    mode = this.interpolation(mode);
    let path = '', previous = null;
    for (const [x, y] of points) {
      if (!Number.isFinite(y)) {
        if (previous && end !== undefined) path += ` H ${x}`;
        previous = null;
        continue;
      }
      if (!previous) path += `${path ? ' ' : ''}M ${x} ${y}`;
      else if (mode === 'linear') path += ` L ${x} ${y}`;
      else if (mode === 'step') path += ` H ${x} V ${y}`;
      else {
        const middle = (previous[0] + x) / 2;
        path += ` C ${middle} ${previous[1]}, ${middle} ${y}, ${x} ${y}`;
      }
      previous = [x, y];
    }
    if (previous && end !== undefined) path += ` H ${end}`;
    return path;
  }
  render(host, {viewBox, defs = '', before = '', after = '', fills = [], lines = []}) {
    const previous = host.shadowRoot.querySelector('.chart-enter')?.getAnimations?.().find(a => a.animationName === 'chart-reveal' && a.playState !== 'finished' && Number(a.currentTime ?? 0) < 650);
    this.progress = Number(previous?.currentTime ?? 0);
    this.entering = Boolean(host.isConnected && (!this.loaded || previous) && lines.some(p => p.d));
    if (host.isConnected && lines.some(p => p.d)) this.loaded = true;
    const areas = fills.filter(p => p.d).map(p => `<path d="${graphAttribute(p.d)}" class="${graphAttribute(p.className)}"${p.fill ? ` fill="${graphAttribute(p.fill)}"` : ''}${p.opacity != null ? ` fill-opacity="${p.opacity}"` : ''}${p.mask ? ` mask="${graphAttribute(p.mask)}"` : ''}/>`).join('');
    const paths = lines.filter(p => p.d).map(p => {
      const a = p.appearance;
      const stroke = p.inlineStyle ? `style="stroke:${graphAttribute(a.stroke)};stroke-width:${a.width};stroke-dasharray:${a.dash};stroke-linecap:${a.cap}"` : `stroke="${graphAttribute(a.stroke)}" stroke-width="${a.width}" stroke-dasharray="${a.dash}" stroke-linecap="${a.cap}"`;
      return `<path d="${graphAttribute(p.d)}" class="${graphAttribute(p.className)}"${p.entity ? ` data-entity="${graphAttribute(p.entity)}"` : ''} ${stroke}/>`;
    }).join('');
    return `<svg viewBox="${viewBox}" preserveAspectRatio="none" aria-hidden="true">${defs}${before}<g class="chart-series${this.entering ? ' chart-enter' : ''}">${areas}${paths}</g>${after}</svg>`;
  }
  restore(host) {
    if (this.entering && this.progress > 0) {
      const animation = host.shadowRoot.querySelector('.chart-enter')?.getAnimations?.().find(a => a.animationName === 'chart-reveal');
      if (animation) animation.currentTime = this.progress;
    }
  }
}
export function graphStyles() {
  return `
      .price-line, .series-line { fill: none; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
      .chart-enter { animation: chart-reveal 650ms cubic-bezier(0.22, 1, 0.36, 1) both; }
      @keyframes chart-reveal {
        from { clip-path: inset(0 100% 0 0); }
        to { clip-path: inset(0 0 0 0); }
      }
      .hover-dot { position: absolute; z-index: 2; width: 12px; height: 12px; box-sizing: border-box; border: 3px solid; border-radius: 50%; transform: translate(-50%, -50%); background: var(--card-background-color); pointer-events: none; }
      @media (prefers-reduced-motion: reduce) { .chart-enter { animation: none; } }
  `;
}
