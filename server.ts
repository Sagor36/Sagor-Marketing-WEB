import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment.');

type AuthedRequest = Request & { supabase?: SupabaseClient; userId?: string; userRole?: string; userEmail?: string; userName?: string };
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 40 }, fileFilter: (_req, file, cb) => {
  cb(null, ['image/png','image/jpeg','image/jpg','image/webp','image/gif'].includes(file.mimetype.toLowerCase()));
}});
const validCategories = new Set(['instagram','email','facebook','campaign']);
function escapeCsvField(value: string | number) { const s=String(value??''); return s.includes(',')||s.includes('"')||s.includes('\n')?`"${s.replace(/"/g,'""')}"`:s; }
function filterRows(rows: any[], query: Record<string, unknown>) {
  const memberId=String(query.memberId||''), category=String(query.category||''), from=String(query.dateFrom||''), to=String(query.dateTo||''), search=String(query.search||'').toLowerCase();
  return rows.filter(r=>(!memberId||memberId==='all'||(r.submittedById||r.memberId)===memberId)&&(!category||category==='all'||r.category===category)&&(!from||String(r.submittedAt).slice(0,10)>=from)&&(!to||String(r.submittedAt).slice(0,10)<=to)&&(!search||`${r.memberName} ${r.category} ${r.description} ${r.id}`.toLowerCase().includes(search)));
}
const app=express();
const port=Number(process.env.PORT)||3000;
 app.use(express.json({limit:'2mb'}));
 app.get('/api/health',(_req,res)=>res.json({status:'ok',service:'sagor-marketing-team',database:'supabase'}));
 app.use('/api', async (req:AuthedRequest,res:Response,next:NextFunction)=>{
   if (req.path==='/health') return next();
   const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
   if(!token) return res.status(401).json({error:'Please sign in to continue.'});
   const client=createClient(SUPABASE_URL!,SUPABASE_KEY!,{auth:{persistSession:false},global:{headers:{Authorization:`Bearer ${token}`}}});
   const {data,error}=await client.auth.getUser(token);
   if(error||!data.user) return res.status(401).json({error:'Your session is invalid or expired. Please sign in again.'});
   const {data:profile}=await client.from('profiles').select('role,full_name,email').eq('id',data.user.id).maybeSingle();
   req.supabase=client; req.userId=data.user.id; req.userRole=profile?.role||'member'; req.userEmail=profile?.email||data.user.email||''; req.userName=profile?.full_name||String(data.user.user_metadata?.full_name||'Team Member'); next();
 });
 const adminOnly=(req:AuthedRequest,res:Response,next:NextFunction)=>{if(req.userRole!=='admin')return res.status(403).json({error:'Admin permission is required.'});next();};
 app.get('/api/bootstrap',async(req:AuthedRequest,res)=>{
   const db=req.supabase!;
   const [membersQ,subsQ,settingsQ,profileQ]=await Promise.all([
     db.from('team_members').select('*').order('created_at'),
     db.from('submissions').select('*').order('submitted_at',{ascending:false}).limit(500),
     db.from('team_settings').select('*').eq('id',1).maybeSingle(),
     db.from('profiles').select('*').eq('id',req.userId).maybeSingle()
   ]);
   const err=membersQ.error||subsQ.error||settingsQ.error||profileQ.error;if(err)return res.status(500).json({error:err.message});
   const members=(membersQ.data||[]).map((m:any)=>({id:m.id,code:m.code,name:m.name,role:m.role,avatarUrl:m.avatar_url||''}));
   const creatorIds=[...new Set((subsQ.data||[]).map((s:any)=>s.created_by).filter(Boolean))]; const creatorRows=creatorIds.length&&req.userRole==='admin'?(await db.from('profiles').select('id,email,full_name').in('id',creatorIds)).data||[]:[]; const creatorMap=new Map(creatorRows.map((p:any)=>[p.id,p]));
   const submissions=(subsQ.data||[]).map((s:any)=>{const creator:any=creatorMap.get(s.created_by);return {id:s.id,memberId:s.member_id,memberName:s.member_name,memberEmail:creator?.email||s.member_email||'',submittedById:s.created_by,category:s.category,quantity:s.quantity,description:s.description||'',screenshots:(s.screenshots||[]).map((x:any)=>({...x,verificationStatus:x.verificationStatus||'pending'})),submittedAt:s.submitted_at};});
   const st=settingsQ.data||{};
   res.json({members,submissions,settings:{teamName:st.team_name||'SAGOR MARKETING TEAM',tagline:st.tagline||'Grow Together • Achieve More',dailyActivityTarget:st.daily_activity_target||50,weeklyActivityTarget:st.weekly_activity_target||250,compactTables:!!st.compact_tables},profile:profileQ.data?{...profileQ.data,email:req.userRole==='admin'?profileQ.data.email:undefined}:null});
 });
 app.get('/api/submissions',async(req:AuthedRequest,res)=>{const {data,error}=await req.supabase!.from('submissions').select('*').order('submitted_at',{ascending:false}).limit(1000);if(error)return res.status(500).json({error:error.message});res.json({submissions:filterRows((data||[]).map((s:any)=>({id:s.id,memberId:s.member_id,memberName:s.member_name,memberEmail:s.member_email||'',submittedById:s.created_by,category:s.category,quantity:s.quantity,description:s.description||'',screenshots:(s.screenshots||[]).map((x:any)=>({...x,verificationStatus:x.verificationStatus||'pending'})),submittedAt:s.submitted_at})),req.query as any)});});
 app.post('/api/submissions/batch',upload.fields([{name:'files_instagram',maxCount:10},{name:'files_email',maxCount:10},{name:'files_facebook',maxCount:10},{name:'files_campaign',maxCount:10}]),async(req:AuthedRequest,res)=>{
   const db=req.supabase!; let items:any[];try{items=JSON.parse(String(req.body.items||'[]'));}catch{return res.status(400).json({error:'Malformed submission payload.'});}
   if(!Array.isArray(items)||!items.length)return res.status(400).json({error:'No marketing categories provided.'});
   const memberId=String(req.body.memberId||'member-01');const {data:member,error:memberErr}=await db.from('team_members').select('*').eq('id',memberId).single();if(memberErr||!member)return res.status(400).json({error:'Team submission profile is unavailable.'});
   const files=(req.files||{}) as Record<string,Express.Multer.File[]>;const created:any[]=[];
   for(const item of items){if(!validCategories.has(item.category))return res.status(400).json({error:'Unsupported marketing category.'});const quantity=Number(item.quantity);if(!Number.isInteger(quantity)||quantity<0)return res.status(400).json({error:'Quantity must be a whole number.'});const group=files[`files_${item.category}`]||[];const screenshots:any[]=[];
     for(const file of group){const ext=(file.originalname.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');const objectPath=`${req.userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;const {error:upErr}=await db.storage.from('marketing-screenshots').upload(objectPath,file.buffer,{contentType:file.mimetype,upsert:false});if(upErr)return res.status(500).json({error:`Screenshot upload failed: ${upErr.message}`});const {data:urlData}=db.storage.from('marketing-screenshots').getPublicUrl(objectPath);screenshots.push({id:`img-${Math.random().toString(36).slice(2)}`,filename:objectPath,originalName:file.originalname,mimeType:file.mimetype,sizeBytes:file.size,url:urlData.publicUrl});}
     const description=String(item.description||'').trim().slice(0,1500);if(quantity===0&&!screenshots.length&&!description)continue;if(quantity<=0&&screenshots.length)return res.status(400).json({error:'Enter a quantity greater than zero when attaching screenshots.'});
     const row={id:`SUB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,member_id:member.id,member_name:req.userName||member.name,member_email:req.userEmail||'',category:item.category,quantity,description,screenshots,submitted_at:new Date().toISOString(),created_by:req.userId};const {data:inserted,error}=await db.from('submissions').insert(row).select('*').single();if(error)return res.status(500).json({error:error.message});created.push({id:inserted.id,memberId:inserted.member_id,memberName:inserted.member_name,memberEmail:req.userEmail||'',submittedById:req.userId,category:inserted.category,quantity:inserted.quantity,description:inserted.description,screenshots:(inserted.screenshots||[]).map((x:any)=>({...x,verificationStatus:x.verificationStatus||'pending'})),submittedAt:inserted.submitted_at});
   }
   if(!created.length)return res.status(400).json({error:'Enter at least one marketing quantity greater than zero.'});const {data:all,error}=await db.from('submissions').select('*').order('submitted_at',{ascending:false}).limit(500);if(error)return res.status(500).json({error:error.message});res.status(201).json({created,submissions:(all||[]).map((s:any)=>({id:s.id,memberId:s.member_id,memberName:s.member_name,memberEmail:s.member_email||'',submittedById:s.created_by,category:s.category,quantity:s.quantity,description:s.description||'',screenshots:(s.screenshots||[]).map((x:any)=>({...x,verificationStatus:x.verificationStatus||'pending'})),submittedAt:s.submitted_at}))});
 });
 app.patch('/api/submissions/:id/images/:imageId',adminOnly,async(req:AuthedRequest,res)=>{const db=req.supabase!;const {data:row,error}=await db.from('submissions').select('screenshots').eq('id',req.params.id).single();if(error||!row)return res.status(404).json({error:'Submission not found.'});const status=String(req.body.status||'');if(!['pending','real','fake'].includes(status))return res.status(400).json({error:'Invalid verification status.'});const shots=(row.screenshots||[]).map((x:any)=>x.id===req.params.imageId?{...x,verificationStatus:status,verifiedAt:new Date().toISOString()}:x);const {error:updateError}=await db.from('submissions').update({screenshots:shots}).eq('id',req.params.id);if(updateError)return res.status(500).json({error:updateError.message});res.json({screenshots:shots});});
 app.delete('/api/submissions/:id/images/:imageId',adminOnly,async(req:AuthedRequest,res)=>{const db=req.supabase!;const {data:row,error}=await db.from('submissions').select('screenshots').eq('id',req.params.id).single();if(error||!row)return res.status(404).json({error:'Submission not found.'});const shots=row.screenshots||[];const target=shots.find((x:any)=>x.id===req.params.imageId);if(!target)return res.status(404).json({error:'Image not found.'});if(target.filename)await db.storage.from('marketing-screenshots').remove([target.filename]);const remaining=shots.filter((x:any)=>x.id!==req.params.imageId);const {error:updateError}=await db.from('submissions').update({screenshots:remaining}).eq('id',req.params.id);if(updateError)return res.status(500).json({error:updateError.message});res.json({screenshots:remaining});});
 app.delete('/api/submissions/:id',adminOnly,async(req:AuthedRequest,res)=>{const db=req.supabase!;const {data:old}=await db.from('submissions').select('screenshots').eq('id',req.params.id).maybeSingle();const paths=(old?.screenshots||[]).map((x:any)=>x.filename).filter(Boolean);if(paths.length)await db.storage.from('marketing-screenshots').remove(paths);const {error}=await db.from('submissions').delete().eq('id',req.params.id);if(error)return res.status(500).json({error:error.message});const {data}=await db.from('submissions').select('*').order('submitted_at',{ascending:false});res.json({deletedId:req.params.id,submissions:(data||[]).map((s:any)=>({id:s.id,memberId:s.member_id,memberName:s.member_name,memberEmail:s.member_email||'',submittedById:s.created_by,category:s.category,quantity:s.quantity,description:s.description||'',screenshots:(s.screenshots||[]).map((x:any)=>({...x,verificationStatus:x.verificationStatus||'pending'})),submittedAt:s.submitted_at}))});});
 app.patch('/api/members/:id',adminOnly,async(req:AuthedRequest,res)=>{const name=String(req.body.name||'').trim().slice(0,60),role=String(req.body.role||'').trim().slice(0,80);if(!name)return res.status(400).json({error:'Member name cannot be empty.'});const db=req.supabase!;const {error}=await db.from('team_members').update({name,role}).eq('id',req.params.id);if(error)return res.status(500).json({error:error.message});await db.from('submissions').update({member_name:name}).eq('member_id',req.params.id);const [m,s]=await Promise.all([db.from('team_members').select('*'),db.from('submissions').select('*').order('submitted_at',{ascending:false})]);res.json({members:(m.data||[]).map((x:any)=>({id:x.id,code:x.code,name:x.name,role:x.role,avatarUrl:x.avatar_url||''})),submissions:(s.data||[]).map((x:any)=>({id:x.id,memberId:x.member_id,memberName:x.member_name,category:x.category,quantity:x.quantity,description:x.description||'',screenshots:x.screenshots||[],submittedAt:x.submitted_at}))});});
 app.patch('/api/settings',adminOnly,async(req:AuthedRequest,res)=>{const db=req.supabase!;const payload={id:1,team_name:'SAGOR MARKETING TEAM',tagline:'Grow Together • Achieve More',daily_activity_target:Math.max(1,Math.round(Number(req.body.dailyActivityTarget)||50)),weekly_activity_target:Math.max(1,Math.round(Number(req.body.weeklyActivityTarget)||250)),compact_tables:!!req.body.compactTables};const {data,error}=await db.from('team_settings').upsert(payload).select('*').single();if(error)return res.status(500).json({error:error.message});res.json({settings:{teamName:data.team_name,tagline:data.tagline,dailyActivityTarget:data.daily_activity_target,weeklyActivityTarget:data.weekly_activity_target,compactTables:data.compact_tables}});});
 app.get('/api/export/csv',async(req:AuthedRequest,res)=>{const {data,error}=await req.supabase!.from('submissions').select('*').order('submitted_at',{ascending:false}).limit(5000);if(error)return res.status(500).json({error:error.message});const rows=filterRows((data||[]).map((s:any)=>({id:s.id,memberId:s.member_id,memberName:s.member_name,memberEmail:s.member_email||'',submittedById:s.created_by,category:s.category,quantity:s.quantity,description:s.description||'',screenshots:(s.screenshots||[]).map((x:any)=>({...x,verificationStatus:x.verificationStatus||'pending'})),submittedAt:s.submitted_at})),req.query as any);const headers=['Submission ID','Account Name','Account Email','Category','Quantity','Screenshots Count','Real Images','Fake Images','Pending Images','Screenshot Files','Description','Submitted At'];const csv=[headers.join(','),...rows.map((r:any)=>[r.id,r.memberName,r.memberEmail||'',r.category,r.quantity,r.screenshots.length,r.screenshots.filter((x:any)=>x.verificationStatus==='real').length,r.screenshots.filter((x:any)=>x.verificationStatus==='fake').length,r.screenshots.filter((x:any)=>!x.verificationStatus||x.verificationStatus==='pending').length,r.screenshots.map((x:any)=>x.originalName).join('; '),r.description,r.submittedAt].map(escapeCsvField).join(','))].join('\n');res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="sagor-marketing-report-${new Date().toISOString().slice(0,10)}.csv"`);res.send(csv);});
 app.use((err:unknown,_req:Request,res:Response,_next:NextFunction)=>{res.status(400).json({error:err instanceof Error?err.message:'Request failed.'});});
if (!process.env.VERCEL) {
  (async () => {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer } = await import('vite');
      const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
      app.use(vite.middlewares);
    } else {
      const dist = path.resolve(__dirname, 'dist');
      app.use(express.static(dist));
      app.get('*', (_req, res) => res.sendFile(path.resolve(dist, 'index.html')));
    }
    app.listen(port, '0.0.0.0', () => console.log(`SAGOR MARKETING TEAM running at http://localhost:${port}`));
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { app };
export default app;
