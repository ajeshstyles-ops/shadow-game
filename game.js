
 // GAME.JS - Engine - Boulder once + Lake fix
(function(){
'use strict';
var cv=document.getElementById('c'),ctx=cv.getContext('2d');
var G=290;
var iw,ih,dpr,S,gy,viewW,viewH;
function resize(){dpr=Math.min(devicePixelRatio||1,2);iw=innerWidth;ih=innerHeight;cv.width=Math.round(iw*dpr);cv.height=Math.round(ih*dpr);if(iw>ih){S=ih/340;gy=ih*0.8;}else{S=iw/520;gy=ih*0.58;}viewW=iw/S;viewH=ih/S;}
addEventListener('resize',resize);resize();
function rnd(i,s){var v=Math.sin(i*127.1+s*311.7)*43758.5453;return v-Math.floor(v);}
function ov(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}

var currentLevel=1,LD=null,END=7800,segs=[],gaps=[],spikes=[],walls=[],solids=[],spikeRects=[],checkpoints=[],LAKE_X=4400,LAKE_X2=4700,BOULDER_AT=2480,PIT_X=3350,PIT_X2=3420,EXIT_X2=7350;
var crate,crate2,stal,boulder,log,parts=[];

function buildLevel(n){
  currentLevel=n; LD=LEVELS_DATA[n]; END=LD.END;
  segs=LD.segs; gaps=LD.gaps; spikes=LD.spikes||[]; walls=(LD.walls||[]).concat([{x:-340,y:-3000,w:300,h:4000},{x:END,y:-3000,w:300,h:4000}]);
  solids=segs.map(s=>({x:s[0],y:G,w:s[1]-s[0],h:400})).concat(walls);
  spikeRects=spikes.map(s=>({x:s[0]+2,y:G-12,w:s[1]-s[0]-4,h:12}));
  checkpoints=(LD.checkpoints||[]).map(x=>({x:x}));
  LAKE_X=LD.lake?LD.lake.x:99999; LAKE_X2=LD.lake?LD.lake.x2:99999;
  BOULDER_AT=LD.boulder?LD.boulder.at:99999; PIT_X=LD.boulder?LD.boulder.pit[0]:99999; PIT_X2=LD.boulder?LD.boulder.pit[1]:99999;
  EXIT_X2=LD.exit;
}

function resetObjects(){
  crate=(LD.crates&&LD.crates[0])
    ?{x:LD.crates[0].x,y:G-36,w:36,h:36,vy:0}
    :{x:0,y:0,w:0,h:0,vy:0};

  crate2=(LD.crates&&LD.crates[1])
    ?{x:LD.crates[1].x,y:G-36,w:36,h:36,vy:0}
    :{x:0,y:0,w:0,h:0,vy:0};

  log= LD.log?{x:LD.log.x,y:G-12,w:LD.log.w,h:14,vx:LD.log.speed,dir:1}:{x:0,y:0,w:0,h:0,vx:0,dir:1};
  stal= LD.stal?{x:LD.stal.x,y:-10,w:14,h:40,state:0,t:0,vy:0}:{x:0,y:0,w:0,h:0,state:0,t:0,vy:0};
  if(!boulder || !boulder.fallen) boulder={active:false,x:0,y:G-44,r:44,rot:0,vy:0,fallen:false};
  parts=[];
}

var P={x:80,y:G,vx:0,vy:0,w:14,h:34,face:1,onGround:true,coyote:0,buf:0,anim:0,pushing:false,dead:0};
var keys={l:false,r:false,j:false},jPrev=false,state='title',tick=0,cur={x:80},camX=0;

function pr(x,y){return {x:x-7,y:y-34,w:14,h:34};}
function crateRect(c){return {x:c.x,y:c.y,w:c.w,h:c.h};}
function hitStatic(r){for(var i=0;i<solids.length;i++){if(ov(r,solids[i]))return true;}return false;}
function dust(x,y,n,s){for(var i=0;i<n;i++)parts.push({x:x+(Math.random()-.5)*s,y:y,vx:(Math.random()-.5)*1.2,vy:-Math.random()*1.1,l:30+Math.random()*20,m:50});}
function respawn(){
  var wasFallen=boulder?boulder.fallen:false;
  resetObjects();
  if(wasFallen || cur.x>PIT_X2) boulder.fallen=true;
  P.x=cur.x;P.y=G;P.vx=0;P.vy=0;P.onGround=true;P.pushing=false;P.buf=0;P.coyote=0;
  if(cur.x>1800 && stal){stal.state=3;stal.y=G-stal.h;}
  camX=P.x-viewW*0.36;
}
function movePlayerX(dx){var n=Math.abs(dx),sgn=dx>0?1:-1;P.pushing=false;while(n>1e-6){var m=Math.min(1,n);n-=m;m*=sgn;var r=pr(P.x+m,P.y);if(hitStatic(r)){P.vx=0;break;}var hit=false;for(var c of [crate,crate2,log]){if(c.w>0 && ov(r,crateRect(c))){var nc={x:c.x+m,y:c.y,w:c.w,h:c.h};if(P.onGround&&!hitStatic(nc)){c.x+=m;P.x+=m;P.pushing=true;hit=true;break;}else{P.vx=0;hit=true;break;}}}if(!hit)P.x+=m;}}
function movePlayerY(dy){var n=Math.abs(dy),sgn=dy>0?1:-1;P.onGround=false;while(n>1e-6){var m=Math.min(1,n);n-=m;m*=sgn;var r=pr(P.x,P.y+m);if(hitStatic(r)){if(m>0)P.onGround=true;P.vy=0;break;}var onBox=false;for(var c of [crate,crate2,log]){if(c.w>0 && ov(r,crateRect(c))){if(m>0){P.onGround=true;if(c===log)P.x+=c.vx;}P.vy=0;onBox=true;break;}}if(!onBox)P.y+=m;else break;}}
function updateCrate(c){if(!c || c.w===0) return; c.vy=Math.min(c.vy+0.55,12);var n=Math.abs(c.vy);while(n>1e-6){var m=Math.min(1,n);n-=m;var nc={x:c.x,y:c.y+m,w:c.w,h:c.h};if(hitStatic(nc)){c.vy=0;break;}c.y+=m;}}
function die(){if(!P.dead&&state==='play'){P.dead=1;}}

function update(){
  tick++;var tx;if(state==='title'){tx=P.x-viewW*0.36;camX+=(tx-camX)*0.12;return;}if(state==='end')return;
  if(P.dead){P.dead++;if(P.dead===30)respawn();if(P.dead>=60)P.dead=0;return;}
  if(keys.j&&!jPrev)P.buf=7;jPrev=keys.j;var dir=(keys.r?1:0)-(keys.l?1:0);if(dir)P.face=dir;
  var sp=3.0*(P.pushing?0.55:1);P.vx+=(dir*sp-P.vx)*0.3;if(Math.abs(P.vx)<0.05)P.vx=0;movePlayerX(P.vx);
  if(P.onGround)P.coyote=6;else if(P.coyote>0)P.coyote--;if(P.buf>0)P.buf--;
  if(P.buf>0&&P.coyote>0){P.vy=-8;P.buf=0;P.coyote=0;P.onGround=false;}if(!keys.j&&P.vy<-4.5)P.vy=-4.5;
  P.vy=Math.min(P.vy+0.55,12);var wasAir=!P.onGround,pv=P.vy;movePlayerY(P.vy);
  if(P.onGround&&wasAir&&pv>4)dust(P.x,P.y,5,14);
  if(P.onGround&&Math.abs(P.vx)>0.3)P.anim+=Math.abs(P.vx)*0.09;else if(!P.onGround)P.anim+=0.05;
  updateCrate(crate);updateCrate(crate2);
  if(log.w>0){log.x+=log.vx*log.dir;if(log.x<LAKE_X||log.x+log.w>LAKE_X2)log.dir*=-1;}
  for(var i=0;i<checkpoints.length;i++){if(P.x>=checkpoints[i].x&&checkpoints[i].x>cur.x)cur=checkpoints[i];}
  if(stal.w>0){
    if(stal.state===0&&P.x>1692&&P.x<1900){stal.state=1;stal.t=0;}
    if(stal.state===1){stal.t++;if(stal.t>=14){stal.state=2;stal.vy=0;}}else if(stal.state===2){stal.vy+=0.9;stal.y+=stal.vy;if(stal.y+stal.h>=G){stal.y=G-stal.h;stal.state=3;dust(stal.x,G,10,24);}}
  }
  var pb={x:P.x-5,y:P.y-32,w:10,h:30};
  if(stal.w>0 && (stal.state===2||stal.state===3)&&ov(pb,{x:stal.x-5,y:stal.y,w:10,h:stal.h}))die();
  for(var s=0;s<spikeRects.length;s++){if(ov(pb,spikeRects[s]))die();}
  if(boulder && !boulder.fallen&&!boulder.active&&P.x>=BOULDER_AT){boulder.active=true;boulder.x=P.x-300;boulder.y=G-boulder.r;boulder.vy=0;}
  if(boulder && boulder.active){boulder.x+=3.2;boulder.rot+=3.2/boulder.r;if(boulder.x>PIT_X&&boulder.x<PIT_X2){boulder.vy+=0.9;boulder.y+=boulder.vy;}if(boulder.y>G+150){boulder.active=false;boulder.fallen=true;dust(PIT_X+35,G,12,30);}var cx=boulder.x,cy=boulder.y,qx=Math.max(pb.x,Math.min(cx,pb.x+pb.w)),qy=Math.max(pb.y,Math.min(cy,pb.y+pb.h));var ddx=cx-qx,ddy=cy-qy;if(ddx*ddx+ddy*ddy<(boulder.r-5)*(boulder.r-5))die();}
  if(P.x>LAKE_X&&P.x<LAKE_X2&&P.y>G-5){var onLog=ov(pb,crateRect(log));if(!onLog)die();}
  if(P.y>G+260)die();
  for(var k=parts.length-1;k>=0;k--){var p=parts[k];p.x+=p.vx;p.y+=p.vy;p.vy+=0.02;p.l--;if(p.l<=0)parts.splice(k,1);}
  if(P.x>EXIT_X2-20&&state==='play'){if(currentLevel===1){currentLevel=2;buildLevel(2);resetObjects();cur=checkpoints[0];P.x=cur.x;P.y=G;camX=P.x-viewW*0.36;}else{state='end';document.getElementById('end').classList.remove('hid');document.body.classList.remove('play');}}
  tx=P.x-viewW*0.36;camX+=(tx-camX)*0.12;camX=Math.max(-60,Math.min(END-viewW+60,camX));
}

var noise=document.createElement('canvas');noise.width=noise.height=128;(function(){var n=noise.getContext('2d'),d=n.createImageData(128,128);for(var i=0;i<d.data.length;i+=4){var v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=Math.random()*38;}n.putImageData(d,0,0);})();
var noisePat=ctx.createPattern(noise,'repeat');
var layers=[{par:.22,col:'rgba(150,153,149,.55)',sp:260,w0:14,w1:30,seed:1},{par:.45,col:'rgba(98,101,98,.78)',sp:210,w0:18,w1:40,seed:2},{par:.75,col:'rgba(44,46,45,.92)',sp:300,w0:26,w1:58,seed:3}];
function worldT(par){ctx.setTransform(dpr*S,0,0,dpr*S,-camX*par*S*dpr,(gy-G*S)*dpr);}
function drawTrees(L){worldT(L.par);var a=Math.floor((camX*L.par-120)/L.sp),b=Math.ceil((camX*L.par+viewW+120)/L.sp);ctx.fillStyle=L.col;ctx.strokeStyle=L.col;ctx.lineCap='round';for(var i=a;i<=b;i++){var x=i*L.sp+rnd(i,L.seed)*L.sp*.7;var w=L.w0+rnd(i,L.seed+9)*(L.w1-L.w0);var lean=(rnd(i,L.seed+4)-.5)*40;ctx.beginPath();ctx.moveTo(x-w*.8,G+30);ctx.lineTo(x+w*.8,G+30);ctx.lineTo(x+lean+w*.4,G-1600);ctx.lineTo(x+lean-w*.4,G-1600);ctx.closePath();ctx.fill();ctx.lineWidth=w*.28;for(var k=0;k<3;k++){var h=40+rnd(i,L.seed+20+k)*300,dir=rnd(i,L.seed+30+k)>.5?1:-1,len=40+rnd(i,L.seed+40+k)*90;var bx=x+lean*(h/1600);ctx.beginPath();ctx.moveTo(bx,G-h);ctx.quadraticCurveTo(bx+dir*len*.5,G-h-len*.2,bx+dir*len,G-h-len*.7);ctx.stroke();}}}
function fogBand(a){ctx.setTransform(dpr,0,0,dpr,0,0);var y0=gy-170*S,g=ctx.createLinearGradient(0,y0,0,gy+10*S);g.addColorStop(0,'rgba(196,198,193,0)');g.addColorStop(.7,'rgba(196,198,193,'+a+')');g.addColorStop(1,'rgba(196,198,193,'+(a*.6)+')');ctx.fillStyle=g;ctx.fillRect(0,y0,iw,180*S);}
function hash(x){var v=Math.sin(x*12.9898)*43758.5453;return v-Math.floor(v);}
function drawPlayer(){ctx.save();ctx.translate(P.x,P.y);ctx.scale(P.face,1);ctx.strokeStyle='#000';ctx.fillStyle='#000';ctx.lineCap='round';var moving=Math.abs(P.vx)>0.3&&P.onGround,t=P.anim,sw=moving?Math.sin(t*2.2):0,air=!P.onGround;ctx.lineWidth=5;ctx.beginPath();if(air){ctx.moveTo(0,-13);ctx.lineTo(5,-5);ctx.moveTo(0,-13);ctx.lineTo(-3,-4);}else{var l1=Math.max(0,Math.cos(t*2.2))*3,l2=Math.max(0,-Math.cos(t*2.2))*3;ctx.moveTo(0,-13);ctx.lineTo(sw*8,-l1);ctx.moveTo(0,-13);ctx.lineTo(-sw*8,-l2);}ctx.stroke();ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(0,-24);ctx.stroke();ctx.beginPath();ctx.arc(1,-29,5.6,0,6.3);ctx.fill();ctx.lineWidth=4;ctx.beginPath();if(P.pushing){ctx.moveTo(0,-23);ctx.lineTo(10,-20);}else if(air){ctx.moveTo(0,-23);ctx.lineTo(6,-30);ctx.moveTo(0,-23);ctx.lineTo(-5,-29);}else{ctx.moveTo(0,-23);ctx.lineTo(-sw*6,-14);ctx.moveTo(0,-23);ctx.lineTo(sw*6,-15);}ctx.stroke();ctx.shadowColor='#fff';ctx.shadowBlur=5;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(3,-30,1.15,0,6.3);ctx.arc(5.6,-30,1.15,0,6.3);ctx.fill();ctx.restore();}
function draw(){
  ctx.setTransform(dpr,0,0,dpr,0,0);var sky=ctx.createLinearGradient(0,0,0,ih);var hz=Math.min(.98,gy/ih);sky.addColorStop(0,'#d6d7d2');sky.addColorStop(hz*.7,'#a9aca7');sky.addColorStop(hz,'#6c6f6b');sky.addColorStop(1,'#1a1b1a');ctx.fillStyle=sky;ctx.fillRect(0,0,iw,ih);
  drawTrees(layers[0]);fogBand(.45);drawTrees(layers[1]);fogBand(.5);drawTrees(layers[2]);fogBand(.28);
  ctx.setTransform(dpr*S,0,0,dpr*S,-camX*S*dpr,(gy-G*S)*dpr);
  var x0=camX-20,x1=camX+viewW+20,yb=G+(ih-gy)/S+40;
  for(var g=0;g<gaps.length;g++){var gp=gaps[g];if(gp[1]<x0||gp[0]>x1)continue;if(gp[0]===LAKE_X){ctx.fillStyle='rgba(20,30,40,0.9)';ctx.fillRect(gp[0],G,gp[1]-gp[0],yb-G);ctx.fillStyle='rgba(100,150,200,0.25)';ctx.fillRect(gp[0],G+2,gp[1]-gp[0],30);}else{var pg=ctx.createLinearGradient(0,G,0,G+260);pg.addColorStop(0,'rgba(0,0,0,0)');pg.addColorStop(.6,'rgba(0,0,0,.9)');pg.addColorStop(1,'#000');ctx.fillStyle=pg;ctx.fillRect(gp[0],G,gp[1]-gp[0],yb-G);}}
  ctx.fillStyle='#000';
  for(var i=0;i<segs.length;i++){var a=segs[i][0],b=segs[i][1];if(b<x0||a>x1)continue;ctx.fillRect(a,G,b-a,yb-G);var xs=Math.max(a,Math.floor(x0/7)*7),xe=Math.min(b,x1);ctx.beginPath();for(var x=xs;x<xe;x+=7){var h=2+hash(x)*7;ctx.moveTo(x,G+1);ctx.lineTo(x+3.5,G-h);ctx.lineTo(x+7,G+1);}ctx.fill();}
  for(var w=0;w<walls.length-2;w++){var wl=walls[w];if(wl.x+wl.w<x0||wl.x>x1)continue;ctx.fillRect(wl.x,wl.y,wl.w,wl.h);}
  for(var s=0;s<spikes.length;s++){var sp=spikes[s];if(sp[1]<x0||sp[0]>x1)continue;ctx.beginPath();for(var sx=sp[0];sx<sp[1]-3;sx+=8){ctx.moveTo(sx,G+1);ctx.lineTo(sx+4,G-17-hash(sx)*4);ctx.lineTo(sx+8,G+1);}ctx.fill();}
  if(stal.w>0 && stal.x>x0-200&&stal.x<x1+200){ctx.strokeStyle='#000';ctx.lineCap='round';ctx.lineWidth=15;ctx.beginPath();ctx.moveTo(stal.x+190,-420);ctx.quadraticCurveTo(stal.x+70,-90,stal.x-26,-12);ctx.stroke();ctx.fillStyle='#000';ctx.beginPath();ctx.moveTo(stal.x-7,stal.y);ctx.lineTo(stal.x+7,stal.y);ctx.lineTo(stal.x,stal.y+stal.h);ctx.fill();}
  for(var c of [crate,crate2]){if(c.w>0 && c.x+c.w>x0&&c.x<x1){ctx.fillStyle='#0b0b0b';ctx.fillRect(c.x,c.y,c.w,c.h);}}
  if(log.w>0 && log.x+log.w>x0&&log.x<x1){ctx.fillStyle='#1a1a1a';ctx.fillRect(log.x,log.y,log.w,log.h);}
  if(boulder&&boulder.active){var bcx=boulder.x,bcy=boulder.y;ctx.save();ctx.translate(bcx,bcy);ctx.rotate(boulder.rot);ctx.fillStyle='#050505';ctx.beginPath();ctx.arc(0,0,boulder.r,0,6.3);ctx.fill();ctx.restore();}
  if(!(P.dead>0&&P.dead>12))drawPlayer();
  for(var k=0;k<parts.length;k++){var pt=parts[k];ctx.fillStyle='rgba(165,168,163,'+Math.min(.7,pt.l/pt.m)+')';ctx.beginPath();ctx.arc(pt.x,pt.y,1.6,0,6.3);ctx.fill();}
  ctx.setTransform(dpr,0,0,dpr,0,0);var vg=ctx.createRadialGradient(iw/2,ih*.55,Math.min(iw,ih)*.25,iw/2,ih*.55,Math.max(iw,ih)*.78);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.82)');ctx.fillStyle=vg;ctx.fillRect(0,0,iw,ih);
  ctx.setTransform(1,0,0,1,0,0);ctx.save();ctx.translate(-Math.floor(Math.random()*128),-Math.floor(Math.random()*128));ctx.globalAlpha=.7;ctx.fillStyle=noisePat;ctx.fillRect(0,0,cv.width+128,cv.height+128);ctx.restore();
  var fa=0;if(P.dead>0){fa=P.dead<=30?P.dead/30:1-(P.dead-30)/30;}if(fa>0){ctx.fillStyle='rgba(0,0,0,'+fa+')';ctx.fillRect(0,0,cv.width,cv.height);}
}
var last=0,acc=0,STEP=1000/60;function loop(t){if(!last)last=t;var dt=Math.min(100,t-last);last=t;acc+=dt;while(acc>=STEP){update();acc-=STEP;}draw();requestAnimationFrame(loop);}
var map={ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r',ArrowUp:'j',KeyW:'j',Space:'j',KeyZ:'j'};
addEventListener('keydown',function(e){var k=map[e.code];if(k){keys[k]=true;e.preventDefault();}if(state==='title')startGame();});
addEventListener('keyup',function(e){var k=map[e.code];if(k){keys[k]=false;e.preventDefault();}});
var padL=document.getElementById('padL'),bl=document.getElementById('bl'),br=document.getElementById('br'),bj=document.getElementById('bj'),padR=document.getElementById('padR');
function padMove(e){var r=padL.getBoundingClientRect(),x=e.clientX-r.left,mid=r.width/2;var left=x<mid;keys.l=left;keys.r=!left;bl.classList.toggle('on',left);br.classList.toggle('on',!left);}
function padOff(){keys.l=keys.r=false;bl.classList.remove('on');br.classList.remove('on');}
padL.addEventListener('pointerdown',function(e){e.preventDefault();padMove(e);});padL.addEventListener('pointermove',function(e){if(e.buttons||e.pressure>0)padMove(e);});padL.addEventListener('pointerup',padOff);
padR.addEventListener('pointerdown',function(e){e.preventDefault();keys.j=true;bj.classList.add('on');});function jOff(){keys.j=false;bj.classList.remove('on');}padR.addEventListener('pointerup',jOff);
function startGame(){if(state!=='title')return;state='play';document.getElementById('title').classList.add('hid');document.body.classList.add('play');}
document.getElementById('title').addEventListener('pointerdown',function(e){e.preventDefault();startGame();});
document.getElementById('again').addEventListener('click',function(){currentLevel=1;buildLevel(1);boulder={active:false,x:0,y:G-44,r:44,rot:0,vy:0,fallen:false};cur=checkpoints[0];respawn();P.dead=0;state='play';document.getElementById('end').classList.add('hid');document.body.classList.add('play');});
window.buildLevel=buildLevel; window.resetObjects=resetObjects; window.respawn=respawn;
buildLevel(1); resetObjects(); respawn(); requestAnimationFrame(loop);
})();
