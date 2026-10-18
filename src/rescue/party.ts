import {TRAVEL_SPEED,type Island,type Species} from './model';
import {sprites} from './sprites';
const asset=(animal:Species|'human')=>`${import.meta.env.BASE_URL}grafos/${animal==='human'?'gunner02.png':`animals/${animal}.png`}`;
interface Point{x:number;y:number;d:number;}
interface Actor {id:number;element:HTMLElement;lastX:number;lastY:number;visible:boolean;animal:Species|'human';pathDistance:number;joining:boolean;}
export class Party {
 private trail:Point[]=[];
 private actors:Actor[]=[];
 private distance=0;
 private lastFrame=0;
 constructor(private root:HTMLElement,private reduced:()=>boolean){}
 reset(at:Island,rescued:Island[],saved?:Point[],purchased:{a:Island;b:Island}[]=[]):void {
  this.root.replaceChildren();this.actors=[];this.distance=0;this.lastFrame=0;
  // Start at the island, not on a synthetic line extending into empty water.
  this.trail=[{x:at.x,y:at.y+16,d:0}];
  if(saved&&saved.length>=2&&saved.every((p,i)=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.d)&&(i===0||p.d>=saved[i-1].d))) {
   const last=saved[saved.length-1];
   if(Math.hypot(last.x-at.x,last.y-at.y-16)<.1){
    const onNetwork=(p:Point)=>rescued.some(i=>Math.hypot(p.x-i.x,p.y-i.y-16)<.1)||purchased.some(({a,b})=>{
     const dx=b.x-a.x,dy=b.y-a.y,t=((p.x-a.x)*dx+(p.y-a.y-16)*dy)/(dx*dx+dy*dy);
     return t>=0&&t<=1&&Math.hypot(p.x-a.x-t*dx,p.y-a.y-16-t*dy)<.1;
    });
    let first=0;while(first<saved.length-1&&!onNetwork(saved[first]))first++;
    this.trail=saved.slice(first).map(p=>({...p}));this.distance=last.d;
   }
  }
  this.add(-1,'human',false);
  for(const island of rescued)this.add(island.id,island.animal,false);
 }
 private add(id:number,animal:Species|'human',joining:boolean):void {
  const element=document.createElement('span');element.className=`traveler ${animal==='human'?'human':''}`;element.dataset.actor=String(id);element.style.backgroundImage=`url('${asset(animal)}')`;element.setAttribute('aria-hidden','true');this.root.append(element);
  const size=animal==='human'?{width:40,height:60}:sprites[animal];element.style.width=`${size.width}px`;element.style.height=`${size.height}px`;
  const pathDistance=joining?this.distance:Math.max(this.trail[0].d,this.distance-this.actors.length*32),point=this.at(pathDistance);
  this.actors.push({id,element,animal,lastX:point.x,lastY:point.y,visible:false,pathDistance,joining});
 }
 snapshot():Point[]{return this.trail.map(p=>({...p}));}
 rescue(island:Island,_now:number):void {if(!this.actors.some(a=>a.id===island.id))this.add(island.id,island.animal,true);}
 move(x:number,y:number):void {
  y+=16;const last=this.trail[this.trail.length-1],delta=Math.hypot(x-last.x,y-last.y);if(delta<.05)return;
  this.distance+=delta;this.trail.push({x,y,d:this.distance});
  const retained=(this.actors.length+4)*32;
  while(this.trail.length>2&&this.trail[1].d<this.distance-retained)this.trail.shift();
 }
 private at(distance:number):{x:number;y:number} {
  const points=this.trail;if(points.length===1||distance<=points[0].d)return points[0];
  let lo=0,hi=points.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(points[mid].d<distance)lo=mid;else hi=mid;}
  const a=points[lo],b=points[hi],t=Math.min(1,Math.max(0,(distance-a.d)/(b.d-a.d||1)));
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
 }
 draw(now:number,camera:{x:number;y:number},width:number,height:number):void {
  const dt=this.lastFrame?Math.min(64,Math.max(0,now-this.lastFrame)):0;this.lastFrame=now;
  for(let i=0;i<this.actors.length;i++) {
   const actor=this.actors[i],desired=Math.max(this.trail[0].d,this.distance-i*32);
   if(actor.joining&&!this.reduced()){
    const delta=desired-actor.pathDistance,step=TRAVEL_SPEED*dt/1000;
    actor.pathDistance+=Math.sign(delta)*Math.min(Math.abs(delta),step);
    if(Math.abs(desired-actor.pathDistance)<.001)actor.joining=false;
   }else {actor.pathDistance=desired;actor.joining=false;}
   // Both following and joining sample the traveled polyline; no diagonal blend.
   const point=this.at(actor.pathDistance);
   const visible=point.x>camera.x-50&&point.x<camera.x+width+50&&point.y>camera.y-20&&point.y<camera.y+height+90;
   if(actor.visible!==visible){actor.element.hidden=!visible;actor.visible=visible;}
   const dx=point.x-actor.lastX,dy=point.y-actor.lastY,walking=Math.hypot(dx,dy)>.05&&!this.reduced();
   if(visible){const flying=actor.animal!=='human'&&sprites[actor.animal].flying,size=actor.animal==='human'?{width:40,height:60}:sprites[actor.animal];
    const row=walking?(Math.abs(dx)>Math.abs(dy)?dx>0?2:1:dy>0?0:3):0,frame=(walking||flying)&&!this.reduced()?Math.floor(now/150)%4:0;
    actor.element.style.transform=`translate(${point.x-size.width/2}px,${point.y-size.height}px)`;actor.element.style.backgroundPosition=`${-frame*size.width}px ${-row*size.height}px`;actor.element.style.zIndex=String(Math.round(point.y*10)+(actor.id===-1?1:0));
   }
   actor.lastX=point.x;actor.lastY=point.y;
  }
 }
}
