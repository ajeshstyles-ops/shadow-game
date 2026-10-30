// GAME.JS - Engine - Level 4 Snake Chase (Wind & Falling Trees)
(function(){
'use strict';
var cv=document.getElementById('c'),ctx=cv.getContext('2d');
var G=290;
var iw,ih,dpr,S,gy,viewW,viewH;
function resize(){dpr=Math.min(devicePixelRatio||1,2);iw=innerWidth;ih=innerHeight;cv.width=Math.round(iw*dpr);cv.height=Math.round(ih*dpr);if(iw>ih){S=ih/340;gy=ih*0.8;}else{S=iw/520;gy=ih*0.58;}viewW=iw/S;viewH=ih/S;}
addEventListener('resize',resize);resize();
function rnd(i,s){var v=Math.sin(i*127.1+s*311.7)*43758.5453;return v-Math.floor(v);}
function ov(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}

var currentLevel=1,LD=null,END=7800,segs=[],gaps=[],spikes=[],walls=[],solids=[],spikeRects=[],checkpoints=[],LAKE_X=99999,LAKE_X2=99999,BOULDER_AT=99999,PIT_X=99999,PIT_X2=99999,EXIT_X2=7350;
var crate,crate2,boulder,log,parts=[],pushLogObj=null;
var logInWater = false; 
var mudZones = []; var windZones = []; var fallingTrees = []; var snake = null; 
var leaves = []; // For particle effect

function buildLevel(n){
  if(!LEVELS_DATA[n]) { n = 1; }
  currentLevel=n; LD=LEVELS_DATA[n]; END=LD.END;
  segs=LD.segs; gaps=LD.gaps; spikes=LD.spikes||[]; walls=(LD.walls||[]).concat([{x:-340,y:-3000,w:300,h:4000},{x:END,y:-3000,w:300,h:4000}]);
  solids=segs.map(s=>({x:s[0],y:G,w:s[1]-s[0],h:400})).concat(walls);
  spikeRects=spikes.map(s=>({x:s[0]+2,y:G-12,w:s[1]-s[0]-4,h:12}));
  checkpoints=(LD.checkpoints||[]).map(x=>({x:x}));
  LAKE_X=LD.lake?LD.lake.x:99999; LAKE_X2=LD.lake?LD.lake.x2:99999;
  BOULDER_AT=LD.boulder?LD.boulder.at:99999; PIT_X=LD.boulder?LD.boulder.pit[0]:99999; PIT_X2=LD.boulder?LD.boulder.pit[1]:99999;
  EXIT_X2=LD.exit;
  
  mudZones = LD.mudZones || [];
  windZones = LD.windZones || [];
  fallingTrees = (LD.fallingTrees||[]).map(t => ({x: t.x, h: t.h, state: 'standing', angle: 0}));
  snake = LD.snake ? { x: LD.snake.startX, y: G-20, speed: LD.snake.speed, length: 120, points: [] } : null;
  leaves = [];
}

function resetObjects(){
  crate=(LD.crates&&LD.crates[0])?{x:LD.crates[0].x,y:G-36,w:36,h:36,vy:0}:{x:0,y:0,w:0,h:0,vy:0};
  crate2=(LD.crates&&LD.crates[1])?{x:LD.crates[1].x,y:G-36,w:36,h:36,vy:0}:{x:0,y:0,w:0,h:0,vy:0};
  log= (LD.log && LD.log.x) ? {x:LD.log.x,y:G-12,w:LD.log.w,h:14,vx:LD.log.speed,dir:1} : {x:0,y:0,w:0,h:0,vx:0,dir:1};
  pushLogObj = LD.pushLog ? {x:LD.pushLog.x, y:G-LD.pushLog.h, w:LD.pushLog.w, h:LD.pushLog.h, vx:0, dir:1} : null;
  logInWater = false;
  
  if(!boulder || !boulder.fallen) boulder={active:false,x:0,y:G-44,r:44,rot:0,vy:0,fallen:false};
  
  if(snake) {
    snake.x = LD.snake.startX;
    snake.points = [];
    for(var i=0; i<20; i++) snake.points.push({x: snake.x - i*6, y: snake.y});
  }
  fallingTrees.forEach(t => { t.state = 'standing'; t.angle = 0; });
  parts=[];
}

var P={x:80,y:G,vx:0,vy:0,w:14,h:34,face:1,onGround:true,coyote:0,buf:0,anim:0,pushing:false,dead:0};
var keys={l:false,r:false,j:false},jPrev=false,state='title',tick=0,cur={x:80},camX=0;
var rainDrops = [];

function pr(x,y){return {x:x-7,y:y-34,w:14,h:34};}
function crateRect(c){return {x:c.x,y:c.y,w:c.w,h:c.h};}
function hitStatic(r){for(var i=0;i<solids.length;i++){if(ov(r,solids[i]))return true;}return false;}
function dust(x,y,n,s){for(var i=0;i<n;i++)parts.push({x:x+(Math.random()-.5)*s,y:y,vx:(Math.random()-.5)*1.2,vy:-Math.random()*1.1,l:30+Math.random()*20,m:50});}
function respawn(){
  var wasFallen=boulder?boulder.fallen:false;
  resetObjects();
  if(wasFallen || cur.x>PIT_X2) boulder.fallen=true;
  P.x=cur.x;P.y=G;P.vx=0;P.vy=0;P.onGround=true;P.pushing=false;P.buf=0;P.coyote=0;
  camX=P.x-viewW*0.36;
}
function movePlayerX(dx){var n=Math.abs(dx),sgn=dx>0?1:-1;P.pushing=false;while(n>1e-6){var m=Math.min(1,n);n-=m;m*=sgn;var r=pr(P.x+m,P.y);if(hitStatic(r)){P.vx=0;break;}var hit=false;var objectsToCheck=[crate,crate2,log]; if(pushLogObj) objectsToCheck.push(pushLogObj);
  for(var c of objectsToCheck){if(c.w>0 && ov(r,crateRect(c))){var nc={x:c.x+m,y:c.y,w:c.w,h:c.h};if(P.onGround&&!hitStatic(nc)){c.x+=m;P.x+=m;P.pushing=true;hit=true;break;}else{P.vx=0;hit=true;break;}}}if(!hit)P.x+=m;}}
function movePlayerY(dy){var n=Math.abs(dy),sgn=dy>0?1:-1;P.onGround=false;while(n>1e-6){var m=Math.min(1,n);n-=m;m*=sgn;var r=pr(P.x,P.y+m);if(hitStatic(r)){if(m>0)P.onGround=true;P.vy=0;break;}var onBox=false;var objectsToCheck=[crate,crate2,log]; if(pushLogObj) objectsToCheck.push(pushLogObj);
  for(var c of objectsToCheck){if(c.w>0 && ov(r,crateRect(c))){if(m>0){P.onGround=true;if(c===log) P.x+=c.vx; }P.vy=0;onBox=true;break;}}if(!onBox)P.y+=m;else break;}}
function updateCrate(c){if(!c || c.w===0) return; c.vy=Math.min(c.vy+0.55,12);var n=Math.abs(c.vy);while(n>1e-6){var m=Math.min(1,n);n-=m;var nc={x:c.x,y:c.y+m,w:c.w,h:c.h};if(hitStatic(nc)){c.vy=0;break;}c.y+=m;}}
function die(){if(!P.dead&&state==='play'){P.dead=1;}}

function update(){
  tick++;var tx;if(state==='title'){tx=P.x-viewW*0.36;camX+=(tx-camX)*0.12;return;}if(state==='end')return;
  if(P.dead){P.dead++;if(P.dead===30)respawn();if(P.dead>=60)P.dead=0;return;}
  
  if(currentLevel===3){
    if(rainDrops.length < 100 && Math.random() < 0.5){ rainDrops.push({x: camX + Math.random()*viewW, y: -10, speed: 10 + Math.random()*10}); }
    for(var i=rainDrops.length-1; i>=0; i--){ rainDrops[i].y += rainDrops[i].speed; if(rainDrops[i].y > G+50) rainDrops.splice(i,1); }
  } else { rainDrops = []; }

  if(keys.j&&!jPrev)P.buf=7;jPrev=keys.j;var dir=(keys.r?1:0)-(keys.l?1:0);if(dir)P.face=dir;
  
  var isInMud = false;
  for(var m of mudZones) { if (P.x > m.x && P.x < m.x2) isInMud = true; }
  
  // Wind Logic (Level 4)
  var windForce = 0;
  for(var w of windZones) {
    if (P.x > w.x && P.x < w.x2) {
      windForce = w.force;
      if (tick % 5 === 0) { // Spawn leaves
        leaves.push({x: P.x + (Math.random()*100), y: Math.random()*G, vx: -windForce*2 - Math.random()*3, vy: Math.random()*2-1, size: 2+Math.random()*3, rot: Math.random()*6.3});
      }
    }
  }
  for(var i=leaves.length-1; i>=0; i--) {
    leaves[i].x += leaves[i].vx; leaves[i].y += leaves[i].vy; leaves[i].rot += 0.1;
    if(leaves[i].x < camX - 100 || leaves[i].y > G) leaves.splice(i,1);
  }

  var sp=3.0*(P.pushing?0.55:1) * (isInMud ? 0.5 : 1); 
  P.vx+=(dir*sp-P.vx)*0.3; if(Math.abs(P.vx)<0.05)P.vx=0;
  movePlayerX(P.vx - windForce); // Apply wind force
  
  if(P.onGround)P.coyote=6;else if(P.coyote>0)P.coyote--;if(P.buf>0)P.buf--;
  if(P.buf>0&&P.coyote>0){P.vy=-8;P.buf=0;P.coyote=0;P.onGround=false;}if(!keys.j&&P.vy<-4.5)P.vy=-4.5;
  P.vy=Math.min(P.vy+0.55,12);var wasAir=!P.onGround,pv=P.vy;movePlayerY(P.vy);
  if(P.onGround&&wasAir&&pv>4)dust(P.x,P.y,5,14);
  if(P.onGround&&Math.abs(P.vx)>0.3)P.anim+=Math.abs(P.vx)*0.09;else if(!P.onGround)P.anim+=0.05;
  updateCrate(crate);updateCrate(crate2);
  
  if(log.w>0){log.x+=log.vx*log.dir;if(log.x<LAKE_X||log.x+log.w>LAKE_X2)log.dir*=-1;}
  if(pushLogObj) { /* ... same as before ... */ }

  // Snake Logic (Level 4)
  if(snake) {
    var targetX = P.x - 120; 
    if (snake.x < targetX) snake.x += snake.speed * 1.5; // Snake moves very fast!
    else if (snake.x > targetX + 200) snake.x -= snake.speed * 0.5; 
    
    snake.points.unshift({x: snake.x, y: snake.y + Math.sin(tick*0.15)*15});
    if (snake.points.length > 20) snake.points.pop();
    
    for(var pt of snake.points) {
      if (Math.abs(pt.x - P.x) < 25 && Math.abs(pt.y - P.y) < 25) die();
    }
  }

  // Falling Trees Logic (Level 4)
  for(var t of fallingTrees) {
    if (t.state === 'standing' && P.x > t.x - 50) {
      t.state = 'falling'; // Trigger fall when player is near
    }
    if (t.state === 'falling') {
      t.angle += 0.05; // Fall over
      if (t.angle > Math.PI/2) t.state = 'fallen';
    }
    // If tree falls on player
    if (t.state === 'falling' && Math.abs(P.x - t.x) < t.h && P.y > G - t.h) die();
  }

  for(var i=0;i<checkpoints.length;i++){if(P.x>=checkpoints[i].x&&checkpoints[i].x>cur.x)cur=checkpoints[i];}
  
  var pb={x:P.x-5,y:P.y-32,w:10,h:30};
  for(var s=0;s<spikeRects.length;s++){if(ov(pb,spikeRects[s]))die();}

  if(boulder && !boulder.fallen&&!boulder.active&&P.x>=BOULDER_AT){boulder.active=true;boulder.x=P.x-300;boulder.y=G-boulder.r;boulder.vy=0;}
  if(boulder && boulder.active){boulder.x+=3.2;boulder.rot+=3.2/boulder.r;if(boulder.x>PIT_X&&boulder.x<PIT_X2){boulder.vy+=0.9;boulder.y+=boulder.vy;}if(boulder.y>G+150){boulder.active=false;boulder.fallen=true;dust(PIT_X+35,G,12,30);}var cx=boulder.x,cy=boulder.y,qx=Math.max(pb.x,Math.min(cx,pb.x+pb.w)),qy=Math.max(pb.y,Math.min(cy,pb.y+pb.h));var ddx=cx-qx,ddy=cy-qy;if(ddx*ddx+ddy*ddy<(boulder.r-5)*(boulder.r-5))die();}
  
  if(P.x>LAKE_X&&P.x<LAKE_X2&&P.y>G-5){
    var onLog=ov(pb,crateRect(log));
    var onPushLog = pushLogObj ? ov(pb, crateRect(pushLogObj)) : false;
    var onCrate=ov(pb,crateRect(crate)) || ov(pb,crateRect(crate2));
    if(!onLog && !onPushLog && !onCrate)die();
  }
  
  if(P.y>G+260)die();
  for(var k=parts.length-1;k>=0;k--){var p=parts[k];p.x+=p.vx;p.y+=p.vy;p.vy+=0.02;p.l--;if(p.l<=0)parts.splice(k,1);}
  
  if(P.x>EXIT_X2-20&&state==='play'){
    if(currentLevel===1){ currentLevel=2; buildLevel(2); resetObjects(); cur=checkpoints[0]; P.x=cur.x; P.y=G; camX=P.x-viewW*0.36; }
    else if (currentLevel===2) { currentLevel=3; buildLevel(3); resetObjects(); cur=checkpoints[0]; P.x=cur.x; P.y=G; camX=P.x-viewW*0.36; }
    else if (currentLevel===3) { currentLevel=4; buildLevel(4); resetObjects(); cur=checkpoints[0]; P.x=cur.x; P.y=G; camX=P.x-viewW*0.36; }
    else { state='end'; document.getElementById('end').classList.remove('hid'); document.body.classList.remove('play'); }
  }

  tx=P.x-viewW*0.36;camX+=(tx-camX)*0.12;camX=Math.max(-60,Math.min(END-viewW+60,camX));
}

// ... Drawing functions ...

function draw(){
  // ... (sky, trees, etc.)
  
  // Draw Falling Trees
  ctx.save();
  for(var t of fallingTrees) {
    ctx.translate(t.x, G);
    ctx.rotate(t.angle);
    ctx.fillStyle = '#050505';
    ctx.fillRect(-10, -t.h, 20, t.h);
    ctx.restore();
    ctx.save();
  }

  // Draw Snake
  if(snake) {
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.moveTo(snake.points[0].x, snake.points[0].y);
    for(var i=1; i<snake.points.length; i++) { ctx.lineTo(snake.points[i].x, snake.points[i].y); }
    ctx.lineWidth = 25; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#050505'; ctx.stroke();
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(snake.x + 8, snake.y - 6, 4, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(snake.x + 8, snake.y + 6, 4, 0, 6.3); ctx.fill();
  }

  // Draw Leaves
  ctx.fillStyle = '#1a1a1a';
  for(var l of leaves) {
    ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.rot); ctx.fillRect(-l.size, -l.size/2, l.size, l.size); ctx.restore();
  }

  // ... (player, etc.)
}