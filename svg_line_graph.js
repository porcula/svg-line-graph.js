function svg_line_graph(args) {
  const default_style = 'svg.graph .grid { stroke:#ddd; stroke-width:1; shape-rendering:geometricPrecision; }\
  svg.graph .xaxis path {stroke:#000; stroke-width:1; shape-rendering:geometricPrecision; }\
  svg.graph .yaxis path {stroke:#000; stroke-width:1; shape-rendering:geometricPrecision; }\
  svg.graph .xaxis text { fill:#000; text-anchor:middle; dominant-baseline:hanging; }\
  svg.graph .yaxis text { fill:#000; text-anchor:end; dominant-baseline:middle; }\
  svg.graph .line path { fill:transparent; stroke-width:3; shape-rendering:geometricPrecision; }\
  svg.graph .line.selected path { stroke-width:6; }\
  svg.graph .line.selected text { font-weight:bold; }\
  svg.graph .marker circle { }\
  svg.graph .hint circle { fill:transparent; stroke:none; cursor:pointer; }\
  svg.graph .legend { cursor:pointer; }\
  svg.graph .legend.collapsed { transform:scale(0.2); }\
  svg.graph .legend rect { fill:rgba(255,255,255,0.9); stroke:#aaa; stroke-width:1; }\
  svg.graph .legend text { stroke:none; text-anchor:start; dominant-baseline:middle; }';
  
  const defaults = {
    id: "svg_line_graph",
    width: 800,
    height: 400,
    margins: [40,10,20,50],
    legend: [50,0,100,20],
    legend_vertical: false,
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
  const hint_r = a.hint_r ?? Math.ceil(Math.min(xwidth,yheight)*0.05); //invisible circle radius
//console.debug(' ymin',ymin,'ymax',ymax,'vstep',vstep,'ysteps',ysteps,'vmin',vmin,'vmax',vmax,'xfactor',xfactor,'yfactor',yfactor,'yzero',yzero,'yaxis',yaxis,'ydigits',ydigits);
  const yformat = new Intl.NumberFormat(undefined,{maximumFractionDigits:ydigits}); //current locale for decimal/thousands separator
  const rnd = (x) => +x.toFixed(3); //shorter SVG, less precision
  let style = default_style;
  for (const [si,s] of a.series.entries()) {
    const color = s.color ?? a.colors[si];
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
    svg += `<g class="line series-${si}"><path d="${path}"/>\n`;
    if (mark) svg += `<g class="marker">${mark}</g>\n`;
    if (hint) svg += `<g class="hint">${hint}</g>\n`;
    svg += '</g>';
  } // series
  if (a.legend) {
    const [x0,y0,w,h] = a.legend;
    const cr = h*0.3;
    const cx = h*0.7;
    const tx = h*1.3;
    const dy = h*0.9;
    let x = x0;
    let y = y0;
    let legend = '';
    for (const [si,s] of Object.entries(a.series)) {
      legend += `<g class="series-${si} marker" clip-path="polygon(${-cx} 0, ${w-cx} 0, ${w-cx} ${h}, ${-cx} ${h})" onclick="event.stopPropagation(); this.parentElement.parentElement.querySelectorAll('.series-${si}').forEach((i)=>i.classList.toggle('selected'))">`;
      legend += `<circle cx="${x+cx}" cy="${y+dy}" r="${cr}"/>`;
      legend += `<text x="${x+tx}" y="${y+dy}"><title>${s.name}</title>${s.name}</text>`;
      legend += '</g>';
      if (a.legend_vertical) {
        y += h;
      } else {
        x += w;
      }
    }
    if (a.legend_vertical) {
      x += w;
      y += h*0.7;
    } else {
      x += h*1.0;
      y += h*1.7;
    }
    svg += `<g class="legend" onclick="this.classList.toggle('collapsed')">`;
    svg += `<rect x="${x0}" y="${y0}" width="${x-x0}" height="${y-y0}" rx="${h*0.2}"/>`; // rx still not stylable in Firefox
    svg += legend +'</g>\n';
  }
  svg += '</svg>';
  return svg;
}
