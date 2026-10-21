/* Browser-only artifact generator. Uses native Excalidraw elements, never images. */
import * as E from '@excalidraw/excalidraw';
import React from 'react';
import {createRoot} from 'react-dom/client';

const C={
  primary:'#0545BA',primarySoft:'#EDF3FF',person:'#163A73',
  ink:'#182842',muted:'#4C607D',surface:'#F7F9FD',border:'#CCD7E8',
  data:'#6545A4',dataSoft:'#F2EEFA',external:'#64748B',externalSoft:'#F1F5F9',
  connector:'#48638C',lifeline:'#A8B8D0',infra:'#946019',infraSoft:'#FFF5E5',
};
const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
const clean=s=>s.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'');
function wrap(s,width,size=22){
  ctx.font=`${size}px Arial`;
  return s.split('\n').map(par=>{let lines=[],line='';for(const word of par.split(' ')){const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width>width&&line){lines.push(line);line=word;}else line=next;}lines.push(line);return lines.join('\n');}).join('\n');
}
function text(id,x,y,value,size=22,width=900,color=C.ink){return {id,type:'text',x,y,text:wrap(value,width,size),fontSize:size,fontFamily:2,lineHeight:1.25,strokeColor:color,roughness:0};}
function box(id,x,y,width,height,fill='#fff',stroke=C.border){return {id,type:'rectangle',x,y,width,height,backgroundColor:fill,strokeColor:stroke,fillStyle:'solid',strokeWidth:1.5,roughness:0,roundness:{type:3}};}
function bounds(elements){return E.getCommonBounds(elements);}
function shift(elements,dx,dy){for(const e of elements){e.x+=dx;e.y+=dy;}return elements;}
function normalized(skeleton){return E.convertToExcalidrawElements(skeleton,{regenerateIds:false});}
function header(skeleton,width,number,level,title,scope){
  skeleton.push(box('sheet',0,0,width,350,'#fff','#fff'));
  skeleton.push(text('kicker',64,40,`POS CORPORATIVO  /  ${number}  /  ${level.toUpperCase()}`,19,width-128,C.primary));
  skeleton.push(text('title',64,85,title,44,width-128));
  skeleton.push(text('scope',64,152,scope,24,width-128,C.muted));
  skeleton.push(text('status',64,230,'ARQUITECTURA PROPUESTA · 05 OCT 2026 · Chile / Perú / España · No representa una implementación homologada',19,width-128,C.muted));
  const items=[['Persona',C.person],['Software POS',C.primary],['Almacén de datos',C.data],['Sistema externo',C.external],['Infraestructura / condición',C.infra]];
  let x=64;for(let i=0;i<items.length;i++){skeleton.push(box(`key-${i}`,x,290,18,18,items[i][1],items[i][1]));skeleton.push(text(`key-text-${i}`,x+28,285,items[i][0],20,310));x+=i===3?260:Math.max(190,ctx.measureText(items[i][0]).width+76);}
  skeleton.push(text('legend-desc',64,330,'Flecha: iniciador → destino; texto: propósito y protocolo. Borde discontinuo: límite nombrado. Todo el contenido es editable.',19,width-128,C.muted));
}
function cards(skeleton,items,x,y,width,cols=3){
  const gap=24,w=(width-(cols-1)*gap)/cols;let cursor=y;const prefix=`notes-${Math.round(y)}`;
  for(let i=0;i<items.length;i+=cols){const row=items.slice(i,i+cols);const rendered=row.map(item=>({title:wrap(item.title,w-44,25),body:wrap(item.body,w-44,22)}));const h=Math.max(...rendered.map(r=>r.title.split('\n').length*31.25+r.body.split('\n').length*27.5+78));
    rendered.forEach((item,j)=>{const id=`${prefix}-${i+j}`,xx=x+j*(w+gap);skeleton.push({...box(`${id}-bg`,xx,cursor,w,h,C.surface),groupIds:[id]});skeleton.push({...text(`${id}-title`,xx+22,cursor+22,item.title,25,w-44,C.primary),groupIds:[id]});skeleton.push({...text(`${id}-body`,xx+22,cursor+item.title.split('\n').length*31.25+43,item.body,22,w-44),groupIds:[id]});});cursor+=h+gap;
  }return cursor;
}
function footer(skeleton,width,y,sources){
  skeleton.push(text('footer',64,y,'C4: contenedor = aplicación o almacén; componente = módulo dentro de un proceso. Despliegue y dinámicas son vistas complementarias, no el nivel de código.',20,width-128,C.muted));
  skeleton.push(text('glossary',64,y+66,'LAN: red de tienda · WAN: enlace a país · ACK: acuse de aplicación durable · ACL: capa anticorrupción · outbox/inbox: registros de envío/recepción · watermark: corte consistente del origen',20,width-128,C.muted));
  skeleton.push(text('sources',64,y+135,`FUENTES DEL REPOSITORIO\n${sources.join('  ·  ')}\nAngular + Tauri y Nx: dirección elegida. Backend, bases, integración y topología: diseño por implementar y validar. Nx organiza código y CI; no es un proceso runtime.`,18,width-128,C.muted));
}
const decisionNotes={
  context:[{title:'Límites de autoridad',body:'Sucursal conserva la venta original. País consolida una proyección. Precio, efecto financiero del pago, documento fiscal y contabilización ERP tienen autoridades y estados diferentes.'},{title:'Continuidad autorizada',body:'Perfil inicial: caída de WAN con LAN, backend y PostgreSQL de sucursal disponibles. Vigencia de precios, permisos, límites y capacidades de pago/fiscalidad determinan qué puede continuar.'},{title:'Chile y evolución multinacional',body:'Antecedentes: Chile Dynamics AX on-premise; España Gira; Perú sistema custom. Interfaces por validar. No se asigna stock al POS ni se declara un ERP futuro ya aprobado.'}],
  containers:[{title:'PostgreSQL, con responsabilidades explícitas',body:'Relaciones, restricciones, transacciones y outbox/inbox comparten un commit local. JSONB admite payloads variables. PostgreSQL de país conserva integración y proyecciones; no cambia la autoridad de ventas. MongoDB también soporta transacciones; una segunda base requiere una necesidad probada.'},{title:'Entrega durable y ACK de aplicación',body:'País confirma inbox + efecto/proyección local + outbox antes de acusar aplicación. Workers procesan después la outbox confirmada. Un ACK no certifica contabilización ERP, aceptación fiscal ni liquidación del pago.'},{title:'Autonomía y efectos externos',body:'No se sostiene SQL abierto esperando un proveedor. Un pago incierto se consulta o concilia con su identidad original. El puente es condicional según SDK y transporta autorización emitida por backend; no incorpora otra base de ventas.'}],
  backend:[{title:'Un monolito modular, un proceso',body:'Los bloques interiores llaman código TypeScript. No hay HTTP ni bases separadas entre módulos. UI valida experiencia; el backend valida permisos, integridad, turno y capacidades antes de mutar negocio.'},{title:'Transacción y efectos externos',body:'Intención de pago durable antes de invocar el proveedor; resultado y confirmación local después. Venta + auditoría + outbox se confirman juntas. Venta, pago, fiscalidad y ERP conservan estados separados y recuperación explícita.'},{title:'Precios y caja son dominios diferentes',body:'La cotización fija versión inmutable y revalida vigencia antes de cobrar. Turno de caja no equivale a sesión de acceso. Devoluciones y compensaciones son nuevas operaciones auditables; no reescritura de historia.'}],
  sync:[{title:'Programado, incremental o manual',body:'Calendario y zona horaria IANA, ventanas, límites, backoff y jitter son configuración explícita. Carga masiva programada o manual utiliza el mismo pipeline auditado. Una ejecución manual no salta validaciones.'},{title:'Recibido no equivale a aplicado',body:'Inbox y cursor recibidos permiten reanudar descarga. Deltas crean una candidata completa aislada; snapshot incorpora cambios posteriores al corte H, incluyendo bajas. Toda candidata pasa por validación antes de activar.'},{title:'Publicación atómica, sin bloqueo prolongado',body:'Descarga, checksum, referencias, cobertura, compatibilidad y vigencia se validan fuera del commit final. Una transacción corta cambia inbox aplicada + puntero activo + cursor aplicado. Impedir regresión por snapshots lentos y retener versiones referenciadas.'}],
  deployment:[{title:'Frontera de continuidad',body:'Sin WAN pueden continuar operaciones autorizadas con LAN y escritor sanos. Sin LAN/backend se detienen nuevos comandos dependientes; el puesto no se convierte en escritor de emergencia. La autonomía por terminal sería otro perfil de arquitectura.'},{title:'Seguridad y operación',body:'Identidad de usuario y puesto, permisos por sucursal/país, TLS y credenciales de mínimos privilegios. Logs correlacionan commandId/eventId/intento. Observar cola pendiente, antigüedad, fallos, huecos y versión/vigencia activa.'},{title:'Recuperación y decisiones pendientes',body:'Backups fuera de la instancia y ensayos de restore. RPO/RTO, retención, dimensionamiento, sistema operativo, alojamiento y alta disponibilidad deben validarse. Excluir al escritor antiguo antes de recuperar; réplica no reemplaza backup.'}],
};

function nativeGraph(svgSource,view,model){
  // Reuse the reviewed C4 geometry; reconstruct every shape, label and connector
  // as native objects. This avoids the converter's bitmap fallback on subgraphs.
  const host=document.createElement('div');host.style.cssText='position:absolute;left:-50000px;top:0';host.innerHTML=svgSource;document.body.append(host);
  const svg=host.querySelector('svg'),vb=svg.viewBox.baseVal;svg.style.cssText=`width:${vb.width}px;height:${vb.height}px;max-width:none;`;
  const factor=1.2,sk=[];
  const rect=el=>{const b=el.getBBox(),m=svg.getScreenCTM().inverse().multiply(el.getScreenCTM()),p=new DOMPoint(b.x,b.y).matrixTransform(m),q=new DOMPoint(b.x+b.width,b.y+b.height).matrixTransform(m);return {x:p.x*factor,y:p.y*factor,width:(q.x-p.x)*factor,height:(q.y-p.y)*factor};};
  const lines=el=>Array.from(el.querySelectorAll('.text-outer-tspan')).map(t=>t.textContent).join('\n')||el.textContent;
  for(const boundary of view.boundaries){const g=svg.querySelector(`[id="${boundary.id}"]`),r=rect(g.querySelector(':scope > rect')),label=g.querySelector('.cluster-label');
    // A collaborator outside a process may straddle Mermaid's top border.
    // Keep it wholly outside, without moving the reviewed internal graph.
    let top=r.y;for(const id of view.nodeIds.filter(id=>id!=='legend'&&!boundary.nodes.includes(id))){const other=rect(svg.querySelector(`[data-node="${id}"] .label-container`));if(other.x<r.x+r.width&&other.x+other.width>r.x&&other.y<=top&&other.y+other.height>top)top=other.y+other.height+32;}
    const delta=top-r.y;r.y=top;r.height-=delta;
    sk.push({...box(boundary.id,r.x,r.y,r.width,r.height,'#ffffff',C.border),strokeStyle:'dashed',roundness:null});const lr=rect(label);sk.push(text(boundary.id+'-title',lr.x,lr.y+delta,clean(boundary.label),22,r.width-40,C.muted));}
  for(const id of view.nodeIds.filter(id=>id!=='legend')){
    const g=svg.querySelector(`[data-node="${id}"]`),shape=g.querySelector('.label-container'),r=rect(shape),n=model.nodes[id],person=n.type==='Persona',data=n.type==='Contenedor de datos',ext=n.type==='Sistema externo',infra=n.type==='Infraestructura';
    const fill=person?C.person:data?C.dataSoft:ext?C.externalSoft:infra?C.infraSoft:C.primarySoft,stroke=person?C.person:data?C.data:ext?C.external:infra?C.infra:C.primary;
    sk.push({...box(id,r.x,r.y,r.width,r.height,fill,stroke),roundness:person?{type:3}:null,label:{text:lines(g.querySelector('.label')),fontFamily:2,fontSize:24,lineHeight:1.1,strokeColor:person?'#fff':C.ink},customData:{c4NodeId:id,type:n.type}});
  }
  const labelSk=[];
  for(const [i,rel] of view.relationships.entries()){
    const id=`${rel.from}_${rel.to}`,edge=svg.querySelector(`path[id="L_${rel.from}_${rel.to}_0"]`);if(!edge)throw new Error('Missing reviewed edge '+id);
    const length=edge.getTotalLength(),count=Math.max(3,Math.ceil(length/22)),raw=Array.from({length:count+1},(_,i)=>edge.getPointAtLength(length*i/count)),origin=raw[0],points=raw.map(p=>[(p.x-origin.x)*factor,(p.y-origin.y)*factor]);
    sk.push({id,type:'arrow',x:origin.x*factor,y:origin.y*factor,points,start:{id:rel.from},end:{id:rel.to},strokeColor:C.connector,strokeWidth:2,roughness:0,roundness:null,endArrowhead:'arrow',groupIds:['relation-'+id],customData:{from:rel.from,to:rel.to,label:rel.label}});
    const label=svg.querySelector(`.edgeLabels [data-id="L_${rel.from}_${rel.to}_0"]`),lr=rect(label.querySelector('text')),value=lines(label),fontSize=21.6,lineHeight=26.4/fontSize,h=value.split('\n').length*fontSize*lineHeight;
    // A separate grouped label preserves the reviewed route's explicit position.
    // Endpoints stay bound to nodes; labels remain movable native text.
    labelSk.push({...box('label-bg-'+id,lr.x-5,lr.y-5,lr.width+10,h+10,'#fff','#fff'),strokeWidth:0,roundness:null,groupIds:['relation-'+id]});
    labelSk.push({...text('label-'+id,lr.x,lr.y,value,fontSize,lr.width+20,C.muted),lineHeight,groupIds:['relation-'+id],customData:{relationshipIndex:i}});
  }
  // Deliberate routing lanes for long cross-boundary relations. Their positions
  // derive from the participating shapes so labels and connectors move together.
  const shapes=new Map(sk.map(e=>[e.id,e]));
  function route(id,absolute,labelX,labelY){const a=shapes.get(id),[origin]=absolute;a.x=origin[0];a.y=origin[1];a.points=absolute.map(p=>[p[0]-origin[0],p[1]-origin[1]]);const label=labelSk.find(e=>e.id==='label-'+id),bg=labelSk.find(e=>e.id==='label-bg-'+id);const dx=labelX-label.x,dy=labelY-label.y;for(const e of [label,bg]){e.x+=dx;e.y+=dy;}}
  if(view.id==='containers'){
    const a=shapes.get('countryWorker'),b=shapes.get('masters'),cx=b.x+b.width/2,y=a.y+a.height/2;
    route('countryWorker_masters',[[a.x,y],[cx,y],[cx,b.y]],(a.x+cx)/2-106,y-128);
  }
  if(view.id==='deployment'){
    const a=shapes.get('client'),b=shapes.get('branchApi'),cx=b.x+b.width/2,y=a.y+a.height/2;
    route('client_branchApi',[[a.x+a.width,y],[cx,y],[cx,b.y]],(a.x+a.width+cx)/2-68,y-100);
    const s=shapes.get('syncWorker'),p=shapes.get('countryApi'),lane=s.y+s.height+114,sx=s.x+s.width/2,px=p.x+p.width/2;
    route('syncWorker_countryApi',[[sx,s.y+s.height],[sx,lane],[px,lane],[px,p.y]],s.x-158,lane-102);
  }
  host.remove();return normalized([...sk,...labelSk]);
}
async function structure({view,model,svg,number}){
  let elements=nativeGraph(svg,view,model);
  const b=bounds(elements),width=Math.max(1900,b[2]-b[0]+128);shift(elements,64-b[0],430-b[1]);
  const decor=[];header(decor,width,number,view.level,view.title,view.scope);
  let y=bounds(elements)[3]+80;
  decor.push(text('reading-title',64,y,'Contratos que gobiernan esta vista',32,width-128));y+=64;
  y=cards(decor,decisionNotes[view.id],64,y,width-128,3);
  decor.push(text('details-title',64,y+35,'Responsabilidades, propiedad y comportamiento ante fallos',32,width-128));y+=110;
  const detail=view.nodeIds.filter(id=>id!=='legend').map(id=>{const n=model.nodes[id];return {title:n.name,body:`${n.type} · ${n.technology}\n\n${n.detail}\n\nAUTORIDAD · ${n.ownership}\n\nCONTINUIDAD · ${n.offline}`};});
  y=cards(decor,detail,64,y,width-128,Math.max(3,Math.min(4,Math.floor(width/670))));
  footer(decor,width,y+35,['docs/c4-arquitectura-propuesta.md','docs/propuesta-arquitectura.md','docs/opciones-tecnologicas.md','docs/operacion-caja-y-evolucion.md','docs/revision-resiliencia-datos-pos.md']);
  // Keep boundary backgrounds behind graph nodes and all free text editable.
  elements=[...normalized(decor),...elements];
  return finish(view.id,number,view.title,elements);
}

async function dynamic(view){
  const width=Math.max(2350,view.participants.length*355+128),sk=[];
  header(sk,width,view.number,'Dinámica C4 · interacción numerada',view.title,view.scope);
  const cols=view.participants.length,cw=(width-128)/cols,top=420,pHeight=210,centers={};
  view.participants.forEach((p,i)=>{const x=64+i*cw+12,w=cw-24;centers[p.id]=x+w/2;const data=/datos|PostgreSQL/i.test(p.name+' '+p.technology),ext=/externo/.test(p.type);const fill=data?C.dataSoft:ext?C.externalSoft:C.primarySoft;
    sk.push({...box(p.id,x,top,w,pHeight,fill,data?C.data:ext?C.external:C.primary),label:{text:wrap(`${p.name}\n«${p.type}»\n${p.technology}\n${p.summary}`,w-26,21),fontFamily:2,fontSize:21,strokeColor:C.ink}});
  });
  let y=top+pHeight+65;
  const stepData=[];
  view.steps.forEach((s,i)=>{
    const x1=centers[s.from],x2=centers[s.to];if(x1===undefined||x2===undefined)throw new Error('Unknown participant');
    const own=s.from===s.to,available=own?Math.min(670,width-x1-110):Math.max(320,Math.abs(x2-x1)-36),label=wrap(`${String(i+1).padStart(2,'0')}  ${s.label}`,available,22),h=label.split('\n').length*27.5;
    const tx=own?x1+32:Math.min(x1,x2)+18;
    const by=y+h+15;
    sk.push(text(`step-${i}-label`,tx,y,label,22,available));
    sk.push({id:`step-${i}`,type:'arrow',x:x1,y:by,points:own?[[0,0],[210,0],[210,48],[0,48]]:[[0,0],[x2-x1,0]],strokeColor:C.primary,strokeWidth:2,roughness:0,endArrowhead:'arrow',roundness:null,groupIds:[`interaction-${i}`]});
    sk[sk.length-2].groupIds=[`interaction-${i}`];
    stepData.push({id:`step-${i}`,from:s.from,to:s.to,label:s.label});
    y=by+(own?95:58);
    if(s.note){sk.push(text(`step-${i}-note`,64,y,s.note,20,width-128,C.muted));y+=wrap(s.note,width-128,20).split('\n').length*25+38;}
  });
  // Lifelines behind interactions. Every arrow and label is individually editable.
  const lines=view.participants.map(p=>({id:`life-${p.id}`,type:'line',x:centers[p.id],y:top+pHeight+12,points:[[0,0],[0,y-top-pHeight]],strokeColor:C.lifeline,strokeStyle:'dashed',strokeWidth:1,roughness:0}));
  sk.splice(0,0,...lines);
  sk.push(text('dynamic-note',64,y+30,view.note,24,width-128,C.primary));y+=130;
  sk.push(text('notes-title',64,y,'Condiciones, fallos y recuperación',32,width-128));y+=70;
  y=cards(sk,view.notes,64,y,width-128,3);
  footer(sk,width,y+30,['docs/c4-arquitectura-propuesta.md','docs/operacion-caja-y-evolucion.md','docs/revision-resiliencia-datos-pos.md','docs/extensibilidad-proveedores-dispositivos.md']);
  const result=await finish(view.id,view.number,view.title,normalized(sk));result.interactions=stepData;return result;
}

async function finish(id,number,title,elements){
  elements=E.restoreElements(elements,null,{repairBindings:true,refreshDimensions:true});
  // Excalidraw restore normalizes positions and bindings without importing raster data.
  const [x1,y1,x2,y2]=bounds(elements),appState={viewBackgroundColor:'#ffffff',gridSize:null,exportBackground:true,exportWithDarkMode:false};
  const scene=JSON.parse(E.serializeAsJSON(elements,appState,{},'local'));
  scene.source='https://excalidraw.com';
  const svg=await E.exportToSvg({elements:scene.elements,appState:{...appState,exportEmbedScene:false},files:{},exportPadding:35});
  for(const t of svg.querySelectorAll('[font-family]'))if(t.getAttribute('font-family').startsWith('Helvetica'))t.setAttribute('font-family','Helvetica, Arial, sans-serif');
  return {id,number,title,scene,svg:svg.outerHTML,width:x2-x1,height:y2-y1};
}
async function atlas(boards){
  let all=[],y=0;const colWidth=Math.max(...boards.map(b=>b.width))+280;let rowHeight=0;for(const [i,board] of boards.entries()){if(i>0&&i%3===0){y+=rowHeight+260;rowHeight=0;}const x=(i%3)*colWidth;rowHeight=Math.max(rowHeight,board.height);const elements=structuredClone(board.scene.elements),prefix=board.number+'-';for(const e of elements){e.id=prefix+e.id;e.x+=x;e.y+=y;e.groupIds=e.groupIds.map(id=>prefix+id);if(e.containerId)e.containerId=prefix+e.containerId;if(e.boundElements)e.boundElements.forEach(b=>b.id=prefix+b.id);if(e.startBinding)e.startBinding.elementId=prefix+e.startBinding.elementId;if(e.endBinding)e.endBinding.elementId=prefix+e.endBinding.elementId;e.frameId=prefix+'frame';}all.push({id:prefix+'frame',type:'frame',x:x-20,y:y-20,width:board.width+40,height:board.height+60,name:`${board.number} · ${board.title}`,children:elements.map(e=>e.id)});all.push(...elements);}
  // Full elements and skeleton frames cannot be mixed through converter; frame defaults are derived separately.
  const frames=normalized(all.filter(e=>e.type==='frame').map(e=>({...e,children:[]})));const byId=new Map(frames.map(e=>[e.id,e]));
  const elements=E.restoreElements(all.map(e=>e.type==='frame'?byId.get(e.id):e),null,{repairBindings:true});
  return JSON.parse(E.serializeAsJSON(elements,{viewBackgroundColor:'#fff',gridSize:null},{},'local'));
}
window.POS_EXCALIDRAW={structure,dynamic,atlas,E,wrap};
window.mountExcalidraw=(scene)=>{document.body.innerHTML='<div id="editor" style="height:100vh;width:100vw"></div>';document.body.style.margin='0';createRoot(document.getElementById('editor')).render(React.createElement(E.Excalidraw,{initialData:{...scene,scrollToContent:true},excalidrawAPI:api=>window.excalidrawAPI=api}));};
