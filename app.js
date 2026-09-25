const SUPABASE_URL = "https://ryprjszaqfwaicxjijiz.supabase.co";
const SUPABASE_KEY = "sb_publishable_aIi2I2TApuGoQJ7zN6pqWQ_ou3X1PfA";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let reels = [];
const state = { query: "", category: "Todos", sort: "number", current: null };
const $ = (id) => document.getElementById(id);
const grid = $("reelGrid");
const filters = $("filters");
const palette = ["#f7deb1","#ffd1d9","#ddd2ff","#ccebdc","#d9e8ff"];
const externalOnly = new Set([2,3,4,20,26,27,28,31,45]);

const compact = (n) => new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 }).format(n || 0);
const full = (n) => new Intl.NumberFormat("es-CO").format(n || 0);
const hookOf = (text) => (text.match(/Hook:\s*([\s\S]*?)(?=\n\n(?:Desarrollo|Cierre))/i)?.[1] || text).trim();
let categories = ["Todos"];

function renderFilters(){
  filters.innerHTML = categories.map(c => `<button class="filter ${c===state.category?'active':''}" data-category="${c}">${c}</button>`).join("");
}
function visibleReels(){
  const q = state.query.toLocaleLowerCase("es");
  const list = reels.filter(r => (state.category === "Todos" || r.category === state.category) && (!q || `${r.title} ${r.structure} ${r.tip}`.toLocaleLowerCase("es").includes(q)));
  return list.sort((a,b) => state.sort === "views" ? b.views-a.views : state.sort === "ratio" ? b.ratio-a.ratio : a.id-b.id);
}
function renderGrid(){
  const list = visibleReels();
  $("resultCount").textContent = `${list.length} ${list.length===1?'idea':'ideas'}`;
  $("emptyState").hidden = list.length > 0;
  grid.innerHTML = list.map((r,i) => `<button class="reel-card" style="--wash:${palette[(r.id-1)%palette.length]}" data-id="${r.id}">
    <div class="card-top"><span class="card-number">REEL ${String(r.id).padStart(2,'0')}</span><span class="card-play">▶</span></div>
    <h2>${r.title}</h2><p class="hook-preview">${hookOf(r.structure)}</p>
    <div class="card-foot"><span class="tag">${r.category}</span><span class="metric">${compact(r.views)}<small>views</small></span></div>
  </button>`).join("");
}
function structureParts(text){
  const chunks=text.split(/\n\n+/).filter(Boolean); let parts=[];
  chunks.forEach(chunk=>{const m=chunk.match(/^([^:]+):\s*([\s\S]*)$/);if(m)parts.push({label:m[1],body:m[2]});else if(parts.length)parts[parts.length-1].body += ` ${chunk}`;});
  return parts.map(p=>`<section class="structure-part"><h3>${p.label}</h3><p>${p.body}</p></section>`).join("");
}
function renderPlayer(r){
  const player=$("reelPlayer");
  const opensOriginal=externalOnly.has(r.id);
  player.innerHTML=`<button class="poster" id="playReel" aria-label="${opensOriginal?'Abrir':'Reproducir'} ${r.title}"><img src="${r.posterUrl}" alt="Fotograma inicial del reel ${r.id}"><span class="poster-shade"></span><span class="poster-label">REEL ${String(r.id).padStart(2,'0')}</span><span class="poster-play">${opensOriginal?'↗':'▶'}</span><span class="poster-cta">${opensOriginal?'Ver reel original':'Reproducir video'}</span></button>`;
  $("playReel").addEventListener("click",()=>{
    if(opensOriginal){window.open(r.source.trim(),"_blank","noopener,noreferrer");return;}
    player.innerHTML=`<iframe id="reelFrame" title="Reel de Instagram" src="${r.reel}" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>`;
  });
}
function openReel(id, push=true){
  const r=reels.find(x=>x.id===Number(id)); if(!r)return; state.current=r.id;
  $("libraryView").hidden=true; $("detailView").hidden=false; $("detailView").classList.remove("fade-in"); void $("detailView").offsetWidth; $("detailView").classList.add("fade-in");
  $("detailNumber").textContent=`REEL ${String(r.id).padStart(2,'0')} · ${r.category}`; $("detailTitle").textContent=r.title; renderPlayer(r); $("instagramLink").href=r.reel.replace('/embed/','/');
  $("structureContent").innerHTML=structureParts(r.structure); $("tipContent").textContent=r.tip; $("viewsValue").textContent=full(r.views); $("followersValue").textContent=full(r.followers); $("ratioValue").textContent=`${r.ratio.toLocaleString('es-CO',{maximumFractionDigits:1})}x`;
  $("navPosition").textContent=`${r.id} / ${reels.length}`; $("prevButton").disabled=r.id===1; $("nextButton").disabled=r.id===reels.length;
  if(push)history.pushState({id:r.id},"",`#reel-${r.id}`); window.scrollTo({top:0,behavior:'smooth'});
}
function showLibrary(push=true){state.current=null;$("detailView").hidden=true;$("reelPlayer").innerHTML="";$("libraryView").hidden=false;if(push)history.pushState({},"",location.pathname);window.scrollTo({top:0,behavior:'smooth'});}
filters.addEventListener("click",e=>{const b=e.target.closest("button[data-category]");if(!b)return;state.category=b.dataset.category;renderFilters();renderGrid();});
grid.addEventListener("click",e=>{const c=e.target.closest("[data-id]");if(c)openReel(c.dataset.id);});
$("searchInput").addEventListener("input",e=>{state.query=e.target.value;renderGrid();});
$("sortSelect").addEventListener("change",e=>{state.sort=e.target.value;renderGrid();});
$("backButton").addEventListener("click",()=>showLibrary());$("homeButton").addEventListener("click",()=>showLibrary());
$("prevButton").addEventListener("click",()=>openReel(state.current-1));$("nextButton").addEventListener("click",()=>openReel(state.current+1));
window.addEventListener("popstate",()=>{const m=location.hash.match(/#reel-(\d+)/);m?openReel(m[1],false):showLibrary(false);});
document.addEventListener("keydown",e=>{if(state.current&&e.key==="ArrowRight"&&state.current<reels.length)openReel(state.current+1);if(state.current&&e.key==="ArrowLeft"&&state.current>1)openReel(state.current-1);if(state.current&&e.key==="Escape")showLibrary();});
const authView=$("authView"), appShell=$("appShell"), authMessage=$("authMessage");
const showMessage=(message,error=false)=>{authMessage.textContent=message;authMessage.classList.toggle("error",error);};

async function loadLibrary(){
  appShell.hidden=false; authView.hidden=true;
  const {data,error}=await supabaseClient.from("reels").select("*").order("id");
  if(error){appShell.hidden=true;authView.hidden=false;showMessage("No pudimos cargar la biblioteca. Intenta nuevamente.",true);return;}
  const paths=data.map(r=>r.poster_path);
  const {data:signed}=await supabaseClient.storage.from("reel-posters").createSignedUrls(paths,3600);
  const urlByPath=new Map((signed||[]).map(x=>[x.path,x.signedUrl]));
  reels=data.map(r=>({...r,posterUrl:urlByPath.get(r.poster_path)||""}));
  categories=["Todos",...new Set(reels.map(r=>r.category))];
  renderFilters(); renderGrid();
  const initial=location.hash.match(/#reel-(\d+)/); if(initial)openReel(initial[1],false);
}

function showPasswordSetup(){
  $("loginForm").hidden=true; $("forgotButton").hidden=true; $("passwordForm").hidden=false;
  $("authCopy").textContent="Crea una contraseña personal de mínimo 8 caracteres para activar tu acceso.";
  authView.hidden=false; appShell.hidden=true;
}

$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault(); showMessage("Verificando acceso…"); $("loginButton").disabled=true;
  const {error}=await supabaseClient.auth.signInWithPassword({email:$("emailInput").value.trim(),password:$("passwordInput").value});
  $("loginButton").disabled=false;
  if(error){showMessage("Correo o contraseña incorrectos.",true);return;}
  showMessage(""); await loadLibrary();
});

$("forgotButton").addEventListener("click",async()=>{
  const email=$("emailInput").value.trim();
  if(!email){showMessage("Escribe primero tu correo electrónico.",true);return;}
  const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:"https://digitalmaster.site/?reset=1"});
  showMessage(error?"No pudimos enviar el correo. Intenta nuevamente.":"Te enviamos un enlace para cambiar tu contraseña.",!!error);
});

$("passwordForm").addEventListener("submit",async e=>{
  e.preventDefault(); const password=$("newPasswordInput").value;
  if(password!==$("confirmPasswordInput").value){showMessage("Las contraseñas no coinciden.",true);return;}
  const {error}=await supabaseClient.auth.updateUser({password});
  if(error){showMessage("No pudimos guardar la contraseña. El enlace puede haber expirado.",true);return;}
  history.replaceState({},"",location.pathname); showMessage(""); $("passwordForm").hidden=true; await loadLibrary();
});

$("logoutButton").addEventListener("click",async()=>{await supabaseClient.auth.signOut();location.href=location.pathname;});

supabaseClient.auth.onAuthStateChange((event,session)=>{
  if(event==="PASSWORD_RECOVERY" || event==="USER_UPDATED") showPasswordSetup();
  else if(event==="SIGNED_OUT"){authView.hidden=false;appShell.hidden=true;}
});

(async()=>{
  const {data:{session}}=await supabaseClient.auth.getSession();
  const hasRecovery=location.search.includes("reset=1")||location.hash.includes("type=recovery")||location.hash.includes("type=invite");
  if(session&&hasRecovery)showPasswordSetup();else if(session)await loadLibrary();else{authView.hidden=false;appShell.hidden=true;}
})();
