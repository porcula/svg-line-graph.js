function svg_line_graph(args) {
  const default_style = 'svg.graph .grid { stroke:#ddd; stroke-width:1; shape-rendering:geometricPrecision; }\
  svg.graph .xaxis path {stroke:#000; stroke-width:1; shape-rendering:geometricPrecision; }\
  svg.graph .yaxis path {stroke:#000; stroke-width:1; shape-rendering:geometricPrecision; }\
  svg.graph .xaxis text { fill:#000; text-anchor:middle; dominant-baseline:hanging; }\
  svg.graph .yaxis text { fill:#000; text-anchor:end; dominant-baseline:middle; }\
  svg.graph .line path { fill:transparent; stroke-width:3; shape-rendering:geometricPrecision; }\
  svg.graph .line.highlight path { stroke-width:6; }\
  svg.graph .legend .highlight { font-weight:bold; }\
  svg.graph .line.shadow path, svg.graph .line.shadow circle { stroke-opacity:0.1; fill:transparent; }\
  svg.graph .line.shadow .hint { display:none; }\
  svg.graph .marker circle { }\
  svg.graph .hint circle { fill:transparent; stroke:none; cursor:crosshair; }\
  svg.graph .line circle:hover { stroke:#fff; }\
  svg.graph .legend .marker { cursor:pointer; }\
  svg.graph .legend.hidden { display:none; }\
  svg.graph .legend rect { fill:rgba(255,255,255,0.9); stroke:#aaa; stroke-width:1; }\
  svg.graph .legend text { stroke:none; text-anchor:start; dominant-baseline:middle; }\
  svg.graph .legend .shadow circle, svg.graph .legend .shadow text { stroke-opacity:0.3; fill-opacity:0.3; }\
  svg.graph .toggle_legend { fill:rgba(0,0,0,0.05); stroke:transparent; }\
  ';
  
  const defaults = {
    id: "svg_line_graph",
    width: 800,
    height: 400,
    margins: [40,10,20,50],
    legend: { x:50, y:0, w:100, h:20, vertical:false, grow:false },
    ymin: undefined,
    ymax: undefined,
    yunit: '',
    xlabels: [],
    marker: 0,
    hint: undefined,
    hint_r: undefined, //calculated
    custom: "",
    colors: ['#f00','#0d0','#44f', '#dd0','#0dd','#f4f', '#800','#080','#008', '#880','#088','#808'],
  };
  const a = {...defaults, ...args};
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
  const eps = 0.01*(ymax-ymin); //1% of range
  let vstep = Math.pow(10, Math.ceil(Math.log10((Math.abs(ymax-ymin-eps)))-1)); //rounded 10-base
  const vmin = Math.floor(ymin/vstep)*vstep; //bottom, src units
  const vmax = Math.ceil(ymax/vstep)*vstep;  //top, src units
  let ysteps = Math.ceil((vmax-vmin)/vstep); //Y label and grid count, 10 max
  if (ysteps<5) {
    vstep /= 2;
    ysteps *= 2;
  }
  const ystep  = yheight/ysteps; //grid height
  const ydigits = Math.max(0, Math.ceil(-Math.log10(vstep)));
  const xfactor = xwidth/(xcount-1);
  const yfactor = -yheight/(vmax-vmin); //inverse coordinate system
  const xzero = xL; //Y-axis always on left
  const yzero = (yB-yT)*vmax/(vmax-vmin) + yT;  //can be out of view
  const yaxis = (vmin<=0 && vmax>=0) ? yzero : undefined;  //draw X-axis at Y=0
  const hint_r = a.hint_r ?? Math.max(3,Math.ceil(Math.min(xwidth,yheight)*0.03)); //invisible circle radius
  const yformat = new Intl.NumberFormat(undefined,{maximumFractionDigits:ydigits}); //current locale for decimal/thousands separator
  const rnd = (x) => +x.toFixed(3); //shorter SVG, less precision
  let style = default_style;
  for (const [si,s] of a.series.entries()) {
    const color = s.color ?? a.colors[si] ?? '#000';
    style += `svg.graph .series-${si} { fill:${color}; stroke:${color} }`;
  }
  let svg = `<svg id="${a.id}" class="graph" version="1.1" viewBox="0 0 ${a.width} ${a.height}" xmlns="http://www.w3.org/2000/svg"><style>${style}</style>\n${a.custom}`;
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
    svg += `<text x="${xL-2}" y="${y}" >${yformat.format(v)}${suffix}</text>`;
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
    svg += `<text x="${x}" y="${yB+4}" >${label}</text>`;
  }
  svg += '</g>\n';
  // series
  for (let si=a.series.length-1; si>=0; si--) { //reverse draw order
    const s = a.series[si];
    if (s.values.length==0) continue;
    let path = '', mark = '', hint = '';
    // line
    let prev_def = false;
    for (const [vi,v] of s.values.entries()) {
      const def = !isNaN(v) && v!=null;
      if (def) {
        const x = rnd(xzero+vi*xfactor);
        const y = rnd(yzero+v*yfactor);
        if (prev_def) {
          path += `L ${x},${y} `;
        } else {
          path += `M ${x},${y} `;
        }
        if (a.marker) mark += `<circle cx="${x}" cy="${y}" r="${a.marker}"/>`;
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
      }
      prev_def = def;
    }
    svg += `<g class="line normal series-${si}"><path d="${path}"/>\n`;
    if (mark) svg += `<g class="marker">${mark}</g>\n`;
    if (hint) svg += `<g class="hint">${hint}</g>\n`;
    svg += '</g>';
  } // series

  if (a.legend) {
    let legend = '';
    const [x0,y0,w,h] = [a.legend.x, a.legend.y, a.legend.w, a.legend.h];
    const cr = h*0.3, cx = h*0.7, tx = h*1.3, dy = h*0.9;
    let x=0, y=0, mx=0, my=0;
    const limx = xR-h*1.0-x0, limy = yB-h*1.7-y0;
    const last_si = a.series.length-1;
    for (const [si,s] of a.series.entries()) {
      const jscode = `event.stopPropagation();\
 this.parentElement.parentElement.querySelectorAll('.series-${si}').forEach((i)=>{\
 const c = i.classList; c.replace('normal','highlight')||c.replace('highlight','shadow')||c.replace('shadow','normal');\
})`;
      legend += `<g class="series-${si} normal marker" clip-path="polygon(${-cx} 0, ${w-cx} 0, ${w-cx} ${h}, ${-cx} ${h})" onclick="${jscode}">`;
      legend += `<circle cx="${x+cx}" cy="${y+dy}" r="${cr}"/>`;
      legend += `<text x="${x+tx}" y="${y+dy}"><title>${s.name}</title>${s.name}</text>`;
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
    const [lw, lh] = a.legend.vertical 
      ? [ mx+w, my+h*1.7 ]
      : [ mx+w+h*1.0, my+h*1.7 ];
    let [ox,oy] = [x0,y0];
    //if (a.legend.grow && ((x0+lw+h)>a.width)) ox = a.width-lw-h;
    svg += `<g class="legend" transform="translate(${ox},${oy})"><rect x="0" y="0" width="${lw}" height="${lh}" rx="${h*0.2}"/>${legend}</g>`;
    svg += `<rect class="toggle_legend" x="${a.width-h}" y="0" width="${h}" height="${h}" onclick="this.parentElement.querySelector('.legend').classList.toggle('hidden')"/>\n`;
  }
  svg += '</svg>';
  return svg;
}
