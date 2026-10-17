import { test, expect } from '@playwright/test';
import { firstHit, type Surface } from '../src/physics/collision';

// Minimal measured rectangles with the same vertex/bounds contract as static Matter bodies.
function rect(x:number,y:number,w:number,h:number,kind:Surface['kind']='terrain'):Surface {
  return { enabled:true,kind,body:{
    bounds:{min:{x,y},max:{x:x+w,y:y+h}},
    vertices:[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}],
  } as Surface['body'] };
}

test('a fast droplet cannot tunnel through a thin bridge to a prop behind it',()=>{
  const bridge=rect(40,0,2,20,'bridge'),prop=rect(70,0,20,20,'prop');
  const hit=firstHit({x:0,y:10},{x:120,y:10},[prop,bridge]);
  expect(hit?.surface).toBe(bridge);expect(hit?.point).toEqual({x:40,y:10});
  expect(hit?.t).toBeCloseTo(1/3);
});

test('extinguished sensors stop intercepting water; the next solid surface still does',()=>{
  const prop=rect(20,0,20,20,'prop'),terrain=rect(70,0,20,20);
  prop.enabled=false;
  expect(firstHit({x:0,y:10},{x:100,y:10},[prop,terrain])?.surface).toBe(terrain);
  expect(firstHit({x:0,y:30},{x:100,y:30},[prop,terrain])).toBeNull();
});

test('descending water hits the top of the correct platform and parallel misses are stable',()=>{
  const platform=rect(30,40,50,10);
  const hit=firstHit({x:20,y:0},{x:60,y:80},[platform]);
  expect(hit?.point).toEqual({x:40,y:40});
  expect(firstHit({x:20,y:20},{x:100,y:20},[platform])).toBeNull();
  expect(firstHit({x:0,y:0},{x:0,y:0},[platform])).toBeNull();
});
