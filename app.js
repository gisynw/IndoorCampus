import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
const $=id=>document.getElementById(id), host=$('viewport');
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});}catch(e){$('loading').textContent='3D graphics are unavailable. Enable hardware acceleration or open this page in a WebGL-capable browser.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0xf1f4f9);renderer.outputColorSpace=THREE.SRGBColorSpace;
host.append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Burdick Hall 3D model. Use arrow keys to orbit; plus and minus to zoom.');
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,1000);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=12;controls.maxDistance=230;controls.maxPolarAngle=Math.PI*.49;
scene.add(new THREE.HemisphereLight(0xffffff,0x8c96ad,2.4));
const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(-35,70,45);scene.add(sun);
const fill=new THREE.DirectionalLight(0xc7dbff,1.3);fill.position.set(50,20,-30);scene.add(fill);
const grid=new THREE.GridHelper(110,22,0xd8dee9,0xe4e8f0);grid.position.y=-.38;scene.add(grid);
let data,models=[],mode='exploded',visible='both';
function shape(rings){const s=new THREE.Shape(rings[0].map(p=>new THREE.Vector2(p[0],p[1])));for(const r of rings.slice(1))s.holes.push(new THREE.Path(r.map(p=>new THREE.Vector2(p[0],p[1]))));return s;}
function polygons(geo){return (geo.type==='Polygon'?[geo.coordinates]:geo.coordinates).map(shape);}
function extrusion(geo,depth,material){const g=new THREE.ExtrudeGeometry(polygons(geo),{depth,bevelEnabled:false,curveSegments:1});g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,material);return m;}
function linework(paths,color,y){const coords=[];for(const p of paths)for(let i=1;i<p.length;i++)coords.push(p[i-1][0],y,-p[i-1][1],p[i][0],y,-p[i][1]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));return new THREE.LineSegments(g,new THREE.LineBasicMaterial({color}));}
function build(f,i){
 const group=new THREE.Group();scene.add(group);
 const color=i?0x74b3c7:0xb49bce,edge=i?0x2c718e:0x735695;
 const wall=extrusion(f.walls,1,new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.03}));wall.scale.y=2.8;group.add(wall);
 const slab=extrusion(f.slab,.18,new THREE.MeshStandardMaterial({color:i?0xdbeaf1:0xe7e0ef,roughness:.95,transparent:true,opacity:.72,depthWrite:false}));slab.position.y=-.20;slab.renderOrder=1;group.add(slab);
 const baseLines=linework(f.lines,edge,.02);group.add(baseLines);
 const tops=linework(f.lines,edge,0);tops.position.y=2.8;group.add(tops);
 const details=linework(f.details,0xb58749,.04);group.add(details);
 // Glazing stays schematic: vertical surfaces following source lines, no inferred window openings.
 const glassPositions=[];for(const p of f.glass)for(let j=1;j<p.length;j++){const a=p[j-1],b=p[j];glassPositions.push(a[0],0,-a[1],b[0],0,-b[1],b[0],2.2,-b[1],a[0],0,-a[1],b[0],2.2,-b[1],a[0],2.2,-a[1]);}
 const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(glassPositions,3));gg.computeVertexNormals();const glass=new THREE.Mesh(gg,new THREE.MeshStandardMaterial({color:0x8ed4dc,transparent:true,opacity:.25,side:THREE.DoubleSide,depthWrite:false}));group.add(glass);
 return {group,wall,tops,slab,details,glass};
}
function update(){const spacing=+$('spacing').value,h=+$('height').value;models.forEach((m,i)=>{m.group.position.y=i*(spacing+(mode==='exploded'?9:0));m.group.visible=visible==='both'||visible===String(i);m.wall.scale.y=h;m.tops.position.y=h;m.glass.scale.y=h/2.8;m.details.visible=$('details').checked;m.slab.visible=$('slabs').checked;});$('spacingValue').value=spacing.toFixed(1)+' m';$('heightValue').value=h.toFixed(1)+' m';$('viewTitle').textContent=visible==='both'?(mode==='exploded'?'Separated floors':'Stacked floors'):'Level '+(+visible+1);$('viewSubtitle').textContent=mode==='exploded'&&visible==='both'?'9 m display gap · heights are illustrative':'Georeferenced CAD · local metres';}
function focus(top=false){const height=visible==='1'?models[1].group.position.y:visible==='0'?0:(models[1]?.group.position.y||0)/2;controls.target.set(0,height,0);camera.position.set(top?.01:74,top?125:78+height,top?.01:90);controls.update();}
for(const button of document.querySelectorAll('[data-floor]'))button.onclick=()=>{visible=button.dataset.floor;document.querySelectorAll('[data-floor]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));update();focus();};
for(const button of document.querySelectorAll('[data-mode]'))button.onclick=()=>{mode=button.dataset.mode;document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));update();focus();};
for(const id of ['spacing','height','details','slabs'])$(id).addEventListener('input',update);
$('reset').onclick=()=>focus();$('top').onclick=()=>focus(true);
function orbit(angle){const v=camera.position.clone().sub(controls.target);v.applyAxisAngle(new THREE.Vector3(0,1,0),angle);camera.position.copy(controls.target).add(v);controls.update();}
function zoom(factor){const v=camera.position.clone().sub(controls.target);const d=THREE.MathUtils.clamp(v.length()*factor,controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(v.setLength(d));controls.update();}
$('left').onclick=()=>orbit(.2);$('right').onclick=()=>orbit(-.2);$('zoomIn').onclick=()=>zoom(.85);$('zoomOut').onclick=()=>zoom(1.18);
renderer.domElement.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','+','-','='].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')orbit(.15);else if(e.key==='ArrowRight')orbit(-.15);else zoom(e.key==='-'?1.15:.87);}});
$('shot').onclick=()=>{renderer.render(scene,camera);const a=document.createElement('a');a.download='Burdick-Hall-3D.png';a.href=renderer.domElement.toDataURL('image/png');a.click();};
$('aboutButton').onclick=()=>{$('about').showModal();$('aboutButton').setAttribute('aria-expanded','true');};$('closeAbout').onclick=()=>$('about').close();$('about').addEventListener('close',()=>$('aboutButton').setAttribute('aria-expanded','false'));
function resize(){const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
new ResizeObserver(resize).observe(host);resize();
function animate(){requestAnimationFrame(animate);controls.update();models.forEach((m,i)=>{const label=$('floorLabel'+i),p=new THREE.Vector3(25,m.group.position.y+.4,12).project(camera);label.style.display=m.group.visible&&p.z<1&&Math.abs(p.x)<.92&&Math.abs(p.y)<.88?'block':'none';label.style.left=(p.x*.5+.5)*host.clientWidth+'px';label.style.top=(-p.y*.5+.5)*host.clientHeight+'px';});renderer.render(scene,camera);}
try{const response=await fetch('./model.json');if(!response.ok)throw new Error('CAD data request failed');data=await response.json();if(data.floors?.length!==2)throw new Error('Expected two CAD floors');models=data.floors.map(build);update();focus();$('stats').textContent=`${data.floors[0].lineCount.toLocaleString()} wall paths on Level 1; ${data.floors[1].lineCount.toLocaleString()} on Level 2. Original DWG files are unchanged.`;$('loading').remove();animate();}catch(e){$('loading').textContent='The model could not load. Reload the page or check that model.json is served beside this page. '+e.message;console.error(e);}
