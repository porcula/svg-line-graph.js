export function svg_line_graph(args) {
  const default_style = 'svg.graph .grid { stroke:#ddd; stroke-width:1; shape-rendering:geometricPrecision; }\
  svg.graph .xaxis path {stroke:#000; stroke-width:1; shape-rendering:geometricPrecision; }\
  svg.graph .yaxis path {stroke:#000; stroke-width:1; shape-rendering:geometricPrecision; }\
  svg.graph .xaxis text { fill:#000; text-anchor:middle; dominant-baseline:hanging; }\
  svg.graph .yaxis text { fill:#000; text-anchor:end; dominant-baseline:alphabetic; }\
  svg.graph path.line { fill:transparent; stroke-width:3; shape-rendering:geometricPrecision; }\
  svg.graph .line.highlight { stroke-width:5; }\
  svg.graph .line.shadow { stroke-opacity:0.1; marker:none; }\
  svg.graph .hint.shadow { display:none; }\
  svg.graph .hint circle { fill:transparent; stroke:none; cursor:crosshair; }\
  svg.graph .hint circle:hover { stroke:#fff; stroke-width:3;}\
  svg.graph .legend.background { fill:rgba(255,255,255,0.9); stroke:#aaa; stroke-width:1; }\
  svg.graph .legend.item { cursor:pointer; }\
  svg.graph .legend.marker { stroke-width: 3 }\
  svg.graph .legend.marker:hover { fill:#000; }\
  svg.graph .legend.text { stroke:none; text-anchor:start; dominant-baseline:central; user-select:none; }\
  svg.graph .legend.highlight { font-weight:bold; }\
  svg.graph g.legend.shadow { opacity:0.3; }\
  svg.graph .legend.hidden { display:none; }\
  svg.graph .legend.toggle { fill:rgba(0,0,0,0.05); stroke:transparent; }\
  ';

  const defaults = {
    id: "svg_line_graph",
    width: 800,
    height: 400,
    margins: [40,10,20,50],
    legend: undefined,
    ymin: undefined,
    ymax: undefined,
    yticks: 10,
    yunit: '',
    xlabels: [],
    xl_offset: 4,
    yl_offset: -2,
    marker: undefined,
    hint: undefined,
    hint_r: undefined, //calculated
    gaps: 'skip',
    custom: "",
    colors: ['#f00','#0d0','#44f', '#dd0','#0dd','#f4f', '#800','#080','#008', '#880','#088','#808'],
  };
  const def_legend = { x:50, y:0, w:100, h:20, vertical:false, grow:false, hidden:false, anchor:'tl' };
  const a = {...defaults, ...args};
  if (a.legend!=undefined) a.legend = {...def_legend, ...a.legend};
  const xL = a.margins[3], xR = a.width-a.margins[1], yT = a.margins[0], yB = a.height-a.margins[2];
  const xwidth = xR-xL, yheight=yB-yT;
  const xsteps = a.xlabels.length-1; //exclude last label
  const xstep = xwidth/xsteps; //grid width
  const xcount = a.series.map((i)=>i.values.length).reduce((a,b)=>Math.max(a,b), 0); //longest series
  let ymin = a.ymin, ymax = a.ymax;
  if (isNaN(ymin) || isNaN(ymax)) {
    let tmin = +Infinity,  tmax = -Infinity;
    for(const va of a.series.map((i)=>i.values)) {
      for(const v of va) {
        if (!isNaN(v) && v!=null) {
          if (v<tmin) tmin=v;
          if (v>tmax) tmax=v;
        }
      }
    }
    ymin ??= tmin;
    ymax ??= tmax;
  }
  if ((ymax-ymin)<1e-6) {
    if (ymax==0.0) { ymax=1.0; }
    else { ymax = ymax*1.09; ymin = ymax*0.90; }
  }
  const eps = 0.01*(ymax-ymin); //1% of range
  let vstep = Math.max(1,Math.pow(10, Math.ceil(Math.log10((Math.abs(ymax-ymin-eps)))-1))); //rounded 10-base
  const vmin = Math.floor(ymin/vstep)*vstep; //bottom, src units
  const vmax = Math.ceil(ymax/vstep)*vstep;  //top, src units
  let ysteps = Math.max(1, Math.ceil((vmax*10-vmin*10)/vstep/10)); //Y label and grid count, 10 max, extra digit for float error correction
  if (ysteps<a.yticks) ysteps *= a.yticks;
  if (ysteps>a.yticks) {
    let n = ysteps;
    ysteps = 0;
    for (let d=2; d<a.yticks; d++) {
      if (n%d==0) { 
        let s = n/d;
        if (s<=a.yticks && s>ysteps) ysteps = s;
      }
    }
  }
  if (ysteps==0) ysteps = Math.pow(2, Math.floor(Math.log2(a.yticks)));
  vstep = (vmax-vmin)/ysteps;
  if (isNaN(vstep)) vstep = 1;
  const ystep  = yheight/ysteps; //grid height
  const ydigits = vstep==0 ? 0 : ysteps<10 ? 1 : Math.max(0, Math.ceil(-Math.log10(vstep)));
  const xfactor = xwidth/(xcount-1);
  const yfactor = -yheight/(vmax-vmin); //inverse coordinate system
  const xzero = xL; //Y-axis always on left
  const yzero = (yB-yT)*vmax/(vmax-vmin) + yT;  //can be out of view
  const yaxis = (vmin<=0 && vmax>=0) ? yzero : undefined;  //draw X-axis at Y=0
  const hint_r = a.hint_r ?? Math.max(3,Math.ceil(Math.min(xwidth,yheight)*0.02)); //invisible circle radius
  const yfmt = new Intl.NumberFormat(undefined,{maximumFractionDigits:ydigits}); //current locale for decimal/thousands separator
  const yformat = a.yformat ?? yfmt.format;
  const rnd = (x) => +x.toFixed(3); //shorter SVG, less precision
  let style = default_style;
  let defs = '';
  const markerids = [];
  for (const [si,s] of a.series.entries()) {
    const color = s.color ?? a.colors[si] ?? '#000';
    const marker = s.marker ?? a.marker;
    let linemarker = '';
    if (typeof(marker)=='number') { // radius
      const id = markerids[si] = `SLG-marker-${si}`;
      linemarker = `marker:url(#${id});`;
      defs += `<marker id="${id}" refX="${marker}" refY="${marker}" markerWidth="${marker*2}" markerHeight="${marker*2}">`
      +`<circle class="marker series${si}" cx="${marker}" cy="${marker}" r="${marker/2}"/></marker>`;
      style += `svg.graph .series${si}.marker { stroke:${color}; fill:${color}; }`;
    }
    else if (typeof(marker)=='string') { //marker-id
      markerids[si] = marker;
      linemarker = `marker:url(#${marker});`;
    }
    style += `svg.graph .series${si} { stroke:${color}; fill:${color}; ${linemarker} }`;
  }
  let svg = `<svg id="${a.id}" class="graph" version="1.1" viewBox="0 0 ${a.width} ${a.height}" xmlns="http://www.w3.org/2000/svg"><style>${style}</style>`;
  if (defs) svg += `<defs>${defs}</defs>`;
  svg += a.custom;
  //gridline
  //--horizontal 
  svg += '<path class="grid" d="';
  for(let i=0; i<=ysteps; i+=1) {
    const y = rnd(yT + ystep*i);
    svg += `M ${xL},${y} h ${xwidth} `;
  }
  //--vertical
  for(let i=0; i<=xsteps; i+=1) {
    const x = rnd(xL+xstep*i);
    svg += `M ${x},${yT} v ${yheight} `;
  }
  svg += '"/>\n';
  // yaxis - always on left
  svg += `<g class="yaxis"><path d="M ${xL},${yT} v ${yheight}"/>`;
  // yaxis labels
  const suffix = a.unit ?? '';
  for (let i=0; i<=ysteps; i+=1) {
    const y = rnd(yB-ystep*i);
    const v = (vmax-vmin)/ysteps*i+vmin;
    svg += `<text x="${xL+a.yl_offset}" y="${y}" >${yformat(v)}${suffix}</text>`;
  }
  svg += '</g>\n';
  // xaxis
  svg += '<g class="xaxis">';
  if (yaxis!=undefined) {
    svg += `<path d="M ${xL},${rnd(yaxis)} h ${xwidth}"/>`;
  }
  // xaxis labels
  for (const [i,label] of a.xlabels.entries()) {
    const x = rnd(xL+xstep*i);
    svg += `<text x="${x}" y="${yB+a.xl_offset}" >${label}</text>`;
  }
  svg += '</g>\n';

  // series
  let hints='';
  for (let si=a.series.length-1; si>=0; si--) { //reverse draw order
    const s = a.series[si];
    if (s.values.length==0) continue;
    let gaps = s.gaps||a.gaps;
    let path = '', mark = '', hint = '';
    // line
    let prev_def = false;
    let prev_x = undefined;
    for (const [vi,v] of s.values.entries()) {
      const def = !isNaN(v) && v!=null;
      if (def) {
        const x = rnd(xzero+vi*xfactor);
        const y = rnd(yzero+v*yfactor);
        if (prev_def) {
          path += `L${x},${y} `;
        } else if (gaps=='ignore') {
          path += prev_x==undefined ? `M${x},${y} ` : `L${x},${y} `;
        } else if (gaps=='zero') { 
          path += `M${x},${yzero} L${x},${y}`;
        } else {
          path += `M${x},${y} `;
        }
        prev_x = x;
        if (a.hint) {
          let attr = '', title = '';
          for(const [mode,fn] of Object.entries(a.hint)) {
            if (mode=='static') {
              let txt = fn(si,vi);
              if (txt!='') title = `<title>${txt}</title>`;
            } else if (mode=='dynamic') {
              attr += ` onmouseenter="${fn}(${si},${vi})"`;
            } else if (mode=='external') {
              attr += ` data-si="${si}" data-vi="${vi}"`;
            }
          }
          hint += `<circle cx="${x}" cy="${y}" r="${hint_r}"${attr}>${title}</circle>`;
        }
      } else if (prev_def && gaps=='zero') {
        path += `L ${prev_x},${yzero} `;
      }
      prev_def = def;
    }
    svg += `<path class="line normal series${si}" d="${path}"/>\n`;
    if (hint) hints += `<g class="hint normal series${si}">${hint}</g>\n`;
    svg += '</g>';
  } // series
  svg += hints;

  if (a.legend) {
    let legend = '';
    const [x0,y0,w,h] = [a.legend.x, a.legend.y, a.legend.w, a.legend.h];
    const cr = h*0.3, cx = h*0.7, tx = h*1.3, dy = h*0.9;
    let x=0, y=0, mx=0, my=0;
    const limx = xR-h*1.0-x0, limy = yB-h*1.7-y0;
    const last_si = a.series.length-1;
    for (const [si,s] of a.series.entries()) {
      const jscode = `if (event) event.stopPropagation();\
 this.closest('svg').querySelectorAll('#${a.id} .series${si}').forEach((i)=>{\
 const c = i.classList; c.replace('normal','highlight')||c.replace('highlight','shadow')||c.replace('shadow','normal');\
})`;
      legend += `<g class="legend series${si} item normal" clip-path="polygon(${-cx} 0, ${w-cx} 0, ${w-cx} ${h}, ${-cx} ${h})" onclick="${jscode}">`;
      if (markerids[si]==undefined) {
        legend += `<circle class="legend series${si} marker" cx="${x+cx}" cy="${y+dy}" r="${cr}"/>`;
      } else {
        legend += `<path class="legend series${si} marker" marker-start="url(#${markerids[si]})" d="M${x+cx},${y+dy}"/>`;
      }
      legend += `<text class="legend series${si} text" x="${x+tx}" y="${y+dy}"><title>${s.name_long||s.name}</title>${s.name}</text>`;
      legend += '</g>';
      if (si<last_si) {
        if (a.legend.vertical) {
          y += h;
          if (a.legend.grow && (y+h)>limy) { 
            x += w; y = 0; 
          }
        } else {
          x += w;
          if (a.legend.grow && (x+w)>limx) { 
            x = 0; y += h; 
          }
        }
      }
      mx = Math.max(mx, x); 
      my = Math.max(my, y); 
    }
    const [lw,lh] = a.legend.vertical ? [ mx+w, my+h*1.7 ] : [ mx+w+h*1.0, my+h*1.7 ];
    const la = a.legend.anchor;
    const ox = la=='t'||la=='b' ? (a.width-lw)/2+x0: la.endsWith('r') ? a.width-lw-x0 : x0; //left=default
    const oy = la=='l'||la=='r' ? (a.height-lh)/2+y0: la.startsWith('b') ? a.height-lh-y0 : y0; //top=default
    const hidden = a.legend.hidden ? 'hidden' : '';
    svg += `<g class="legend ${hidden}" transform="translate(${ox},${oy})"><rect class="legend background" x="0" y="0" width="${lw}" height="${lh}" rx="${h*0.2}"/>${legend}</g>`;
    svg += `<rect class="legend toggle" x="${a.width-h}" y="0" width="${h}" height="${h}" onclick="this.parentElement.querySelector('.legend').classList.toggle('hidden')"/>\n`;
  }
  svg += '</svg>';
  return svg;
}
