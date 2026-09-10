import {supabase} from './supabase';
export async function requireRentalOwner(owner:string){
 if(!supabase||!owner)throw new Error('Rental account unavailable');
 const {data,error}=await supabase.auth.getUser();
 if(error||data.user?.id!==owner)throw new Error('Rental account changed');
 return supabase;
}
/** Domain lot IDs are local_id; related cloud tables reference the database primary key. */
export async function resolveRentalCloudId(localId:string,owner:string):Promise<string>{
 const client=await requireRentalOwner(owner);
 if(!localId)throw new Error('Rental lot required');
 let result=await client.from('rental_lots').select('id,local_id,user_id').eq('user_id',owner).eq('local_id',localId).maybeSingle();
 if(result.error)throw new Error('Rental lot unavailable');
 if(!result.data){
  // Legacy lots without local_id are exposed by their database ID.
  result=await client.from('rental_lots').select('id,local_id,user_id').eq('user_id',owner).eq('id',localId).is('local_id',null).maybeSingle();
 }
 if(result.error||!result.data||result.data.user_id!==owner||typeof result.data.id!=='string'||!result.data.id||(result.data.local_id!==localId&&!(result.data.local_id===null&&result.data.id===localId)))throw new Error('Rental lot unavailable');
 await requireRentalOwner(owner);
 return result.data.id;
}
