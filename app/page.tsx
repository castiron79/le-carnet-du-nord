"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { scaleIngredientText, updateRecipePrompt } from "./portion-scaling.mjs";
import { renderQuantityText, portionNotice, type QuantityManifest } from "./quantity-references.mjs";
import TimerOverview from "./TimerOverview";
import SpotifyButton from "./SpotifyButton";
import StepTimer from './StepTimer';
import type {StepTimerDefinition} from './step-timers.mjs';

type Recipe = {
  id: string; title: string; subtitle: string; swedishTitle: string; description: string;
  publishedAt?: string; updatedAt?: string;
  protein: string; carb: string; category: string; tags?: string[]; allergens?: string[]; storage?: string; sommelier?: string; nutritionMethod?: string; image?: string;
  prep: number; active: number; totalMinutes?: number; total: string; servings: number; occasion: string;
  macros: { kcal: number; protein: number; carbs: number; fat: number; fiber: number };
  ingredients: { heading: string; items: string[] }[];
  quantities?: QuantityManifest;
  steps: { title: string; items: string[]; timers?:StepTimerDefinition[]; illustrations?: { kind: "action" | "result" | "detail"; file: string; alt: string; caption: string }[] }[];
  tips: string[]; why: string[];
};

const seedRecipes: Recipe[] = [
  { id:"gyros-i-pita", title:"GYROS I PITA", subtitle:"MED FETA & VITLÖKSSÅS", swedishTitle:"Gyros i pita med feta och vitlökssås", description:"Varm pita fylld med kryddig gyros, krispiga grönsaker, snabbpicklad rödlök, fetaost och krämig vitlökssås.", protein:"Gyros", carb:"Pitabröd", category:"Snabb middag", tags:["grekiskt","vardag"], allergens:["gluten","mjölk"], storage:"Förvara kött, sås och grönsaker var för sig i kylskåp i upp till 2 dagar.", sommelier:"Ett krispigt, kallt mineralvatten med citron eller en torr, lättsam lager.", prep:15, active:15, totalMinutes:30, total:"30 min", servings:2, occasion:"Vardag",
    macros:{kcal:540,protein:38,carbs:42,fat:28,fiber:6}, ingredients:[{heading:"Gyros",items:["250–300 g gyroskebab","2 pitabröd","Några droppar citron"]},{heading:"Grönsaker & tillbehör",items:["2 nävar sallad","1 tomat","10 cm gurka","½ rödlök","40–50 g fetaost"]},{heading:"Vitlökssås",items:["150 g grekisk yoghurt","1 vitlöksklyfta","1 tsk olivolja","½ tsk citronjuice"]}], steps:[{title:"Snabbpickla rödlöken",items:["Blanda vinäger, vatten, socker och salt.","Vänd ner rödlöken och låt stå."]},{title:"Gör vitlökssåsen",items:["Blanda yoghurt, vitlök, olja och citron.","Smaka av med salt och peppar."]},{title:"Stek och bygg",items:["Stek gyrosen med krispiga kanter.","Värm bröden och fyll med alla tillbehör."]}], tips:["Servera extra sås vid bordet."], why:["Picklad lök balanserar fettet.","Fetaost ger sälta och frisk syra."] },
  { id:"le-filet-de-renne", title:"LE FILET DE RENNE", subtitle:"DU NORD", swedishTitle:"Renytterfilé med rödvinssås", description:"En hyllning till nordiska skogar och franska smaker – mör renytterfilé, silkeslen rödvinssås och rostade grönsaker.", protein:"Ren", carb:"Potatis", category:"Helgmiddag", tags:["vilt","helg"], allergens:["mjölk"], storage:"Kyl rester snabbt och ät inom 2 dagar. Värm köttet varsamt så att det förblir saftigt.", sommelier:"En kryddig Syrah från norra Rhône eller en mogen Rioja Reserva.", prep:15, active:45, totalMinutes:60, total:"1 tim", servings:2, occasion:"Helg",
    macros:{kcal:550,protein:43,carbs:37,fat:20,fiber:6}, ingredients:[{heading:"Renytterfilé",items:["300–400 g renytterfilé","1 msk neutral olja","1 msk smör","Vitlök och färsk timjan"]},{heading:"Rödvinssås",items:["1 schalottenlök","2 dl rödvin","1 dl kalvfond","1 tsk tomatpuré"]},{heading:"Rostade grönsaker",items:["400 g nypotatis","3–4 morötter","200 g brysselkål","Olivolja och timjan"]}], steps:[{title:"Stek renytterfilén",items:["Bryn köttet runt om och ös med smör.","Låt vila till 52–54°C kärntemperatur."]},{title:"Koka rödvinssåsen",items:["Reducera vin och lök till hälften.","Tillsätt fond och montera med smör."]},{title:"Rosta och servera",items:["Rosta grönsakerna gyllene i 225°C.","Skiva köttet och servera med såsen."]}], tips:["Häll lite extra sås över köttet vid servering."], why:["Ren är mört och viltsmakande.","Rödvinssåsen ger djup och syra."] },
  { id:"civet-delan", title:"CIVET D’ÉLAN", subtitle:"DES FORÊTS DU NORD", swedishTitle:"Älggryta med enbär och rönnbärsgelé", description:"En mustig vilträtt där mört älgkött får koka länge i rödvin med enbär, timjan, rotfrukter och äpple.", protein:"Älg", carb:"Potatis", category:"Långkok", tags:["vilt","långkok"], allergens:[], storage:"Grytan blir ännu godare dagen efter och håller 3–4 dagar i kyl eller 3 månader i frys.", sommelier:"En fyllig Côtes du Rhône med mörka bär och pepprig kryddighet.", prep:25, active:25, totalMinutes:210, total:"3–4 tim", servings:6, occasion:"Middagsrätt",
    macros:{kcal:580,protein:46,carbs:40,fat:22,fiber:6}, ingredients:[{heading:"Älggryta",items:["800 g älggrytbitar","2 gula lökar","3 morötter","2 palsternackor","1 liten rotselleri"]},{heading:"Kryddor & vätska",items:["6–8 enbär","3 lagerblad","3 kvistar timjan","2 dl rödvin","5 dl kalvfond"]},{heading:"Syra & sötma",items:["1 syrligt äpple","1 msk rönnbärsgelé"]}], steps:[{title:"Bryn köttet",items:["Torka köttet och bryn i omgångar.","Ta upp köttet och lägg åt sidan."]},{title:"Bygg grytan",items:["Fräs grönsaker och kryddor.","Tillsätt vin, fond och kött."]},{title:"Koka långsamt",items:["Sjud under lock i 3–4 timmar.","Avsluta med äpple och rönnbärsgelé."]}], tips:["Grytan blir ännu godare dagen efter.","Servera med rustikt potatismos."], why:["Lång koktid gör älgköttet mört.","Enbär och timjan ger viltkaraktär."] },
  { id:"poulet-au-citron", title:"POULET AU CITRON", subtitle:"ET À L’ESTRAGON", swedishTitle:"Citronkyckling med dragon", description:"Gyllene kyckling i en ljus, örtig citronsås med smör och dragon.", protein:"Kyckling", carb:"Pasta", category:"Vardag", tags:["vardag","snabbt"], allergens:["gluten","mjölk"], storage:"Förvara kyckling och pasta i kyl i upp till 3 dagar.", sommelier:"En frisk Chablis eller en lättdrucken Pinot Blanc.", prep:10, active:25, totalMinutes:35, total:"35 min", servings:4, occasion:"Vardag", macros:{kcal:610,protein:44,carbs:58,fat:22,fiber:4}, ingredients:[{heading:"Kyckling",items:["600 g kycklinglårfilé","1 citron","2 dl matlagningsgrädde","Färsk dragon"]},{heading:"Tillbehör",items:["320 g tagliatelle","Sallad efter säsong"]}], steps:[{title:"Bryn",items:["Bryn kycklingen gyllene."]},{title:"Koka såsen",items:["Tillsätt citron, grädde och dragon."]},{title:"Servera",items:["Vänd ihop med nykokt pasta."]}], tips:["Spara lite pastavatten till såsen."],why:["Citronen bryter gräddens fyllighet."] },
  { id:"saumon-roti", title:"SAUMON RÔTI", subtitle:"À L’ANETH", swedishTitle:"Ugnslax med dill och potatis", description:"Saftig lax, brynt smör, dill och rostad småpotatis i enkel nordisk kostym.", protein:"Lax", carb:"Potatis", category:"Snabb middag", tags:["vardag","nordiskt"], allergens:["fisk","mjölk"], storage:"Förvara i kyl vid högst 4 °C och ät inom 2 dagar.", sommelier:"En torr Riesling med hög syra eller ett glas svalt vitt från Loire.", prep:10, active:20, totalMinutes:30, total:"30 min", servings:4, occasion:"Vardag", macros:{kcal:570,protein:39,carbs:45,fat:26,fiber:5}, ingredients:[{heading:"Lax",items:["600 g laxfilé","1 citron","1 knippe dill"]},{heading:"Potatis",items:["800 g småpotatis","1 msk olivolja"]}], steps:[{title:"Rosta",items:["Rosta potatisen i 225°C."]},{title:"Baka laxen",items:["Baka laxen till 48–50°C."]},{title:"Servera",items:["Toppa med dill och citron."]}],tips:["En kall yoghurtsås passar bra."],why:["Brynt smör och dill är klassiskt till lax."] },
  { id:"crepes-aux-myrtilles", title:"CRÊPES AUX MYRTILLES", subtitle:"DU MATIN", swedishTitle:"Blåbärspannkakor", description:"Fluffiga små pannkakor med blåbär, lättvispad crème fraîche och lönnsirap.", protein:"Ägg", carb:"Bröd", category:"Frukost", tags:["frukost","sött"], allergens:["gluten","mjölk","ägg"], storage:"Förvara svalt i upp till 2 dagar och värm varsamt i torr panna.", sommelier:"Nymalet bryggkaffe eller ett mjukt Earl Grey med bergamott.", prep:10, active:15, totalMinutes:25, total:"25 min", servings:3, occasion:"Frukost", macros:{kcal:430,protein:13,carbs:61,fat:15,fiber:5}, ingredients:[{heading:"Smet",items:["2,5 dl vetemjöl","2,5 dl mjölk","1 ägg","2 tsk bakpulver"]},{heading:"Servering",items:["2 dl blåbär","Crème fraîche","Lönnsirap"]}],steps:[{title:"Blanda",items:["Vispa ihop en slät smet."]},{title:"Stek",items:["Stek små pannkakor i smör."]},{title:"Servera",items:["Toppa med blåbär."]}],tips:["Vänd pannkakan när bubblor syns."],why:["Bakpulvret gör dem höga och mjuka."] }
];

type Note = { id?:number; text:string; date:string; status?:"open"|"resolved" };
type SortMode = "name" | "newest" | "fastest" | "rating" | "cooked";
type SyncStatus = { state:string; message:string; last_sync?:string|null; revision?:string|null };
const newestFirst=(a:Recipe,b:Recipe)=>(b.publishedAt||b.updatedAt||"").localeCompare(a.publishedAt||a.updatedAt||"")||a.swedishTitle.localeCompare(b.swedishTitle,"sv",{sensitivity:"base"});

function formatDuration(recipe: Recipe) {
  if (typeof recipe.totalMinutes === "number" && recipe.totalMinutes > 0) {
    if (recipe.totalMinutes >= 60) {
      const hours = Math.floor(recipe.totalMinutes / 60);
      const mins = recipe.totalMinutes % 60;
      return mins ? `${hours} tim ${mins} min` : `${hours} tim`;
    }
    return `${recipe.totalMinutes} min`;
  }
  return recipe.total;
}

function estimatedMinutes(recipe: Recipe) {
  if (typeof recipe.totalMinutes === "number" && recipe.totalMinutes > 0) return recipe.totalMinutes;
  const parsed = Number.parseInt(recipe.total, 10);
  return Number.isFinite(parsed) ? parsed : 9999;
}

function formatIngredientLine(recipe: Recipe, item: string, servings: number) {
  return recipe.quantities
    ? renderQuantityText(item, recipe.quantities, servings / recipe.servings)
    : scaleIngredientText(item, servings / recipe.servings);
}

function FavoriteButton({active,onClick,label="Spara som favorit",className=""}:{active:boolean;onClick:()=>void;label?:string;className?:string}) {
  return <button type="button" className={`favoriteButton ${active?"active":""} ${className}`} onClick={onClick} aria-pressed={active} aria-label={active?"Ta bort från favoriter":label} title={active?"Ta bort från favoriter":label}><span aria-hidden="true">{active?"♥":"♡"}</span></button>;
}

function RecipeInstructions({recipeId,steps,quantities,factor,notice}:{recipeId:string;steps:Recipe["steps"];quantities?:QuantityManifest;factor:number;notice:string}) {
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  const pictures=steps.flatMap((step,i)=>(step.illustrations||[]).map((_,j)=>`${i}-${j}`));
  const setAll=(visible:boolean)=>setExpanded(visible?Object.fromEntries(pictures.map(key=>[key,true])):{});
  const toggle=(key:string)=>setExpanded(current=>({...current,[key]:!current[key]}));
  return <>
    <div className="methodHeading"><h3>Gör så här</h3>{pictures.length>0&&<div className="illustrationBulkActions"><button type="button" onClick={()=>setAll(true)}>Visa alla illustrationer</button><button type="button" onClick={()=>setAll(false)}>Dölj alla</button></div>}</div>
    {notice&&<p className="portionNotice" role="status">{notice}</p>}
    {steps.some(step=>step.timers?.length)&&<p className="visualTimerHint">Timern fortsätter på Green även när skärmen är avstängd.</p>}
    {steps.map((step,i)=><section className="step" key={i}><i>{i+1}</i><div className="stepContents"><h4>{renderQuantityText(step.title,quantities,factor)}</h4><ul>{step.items.map((value,j)=><li key={j}>{renderQuantityText(value,quantities,factor)}</li>)}</ul><div className="stepControls">{(step.timers||[]).slice(0,-1).map(timer=><StepTimer key={timer.id} recipeId={recipeId} timer={timer} showLabel/>)}<div className="stepControlRow">{(step.timers||[]).slice(-1).map(timer=><StepTimer key={timer.id} recipeId={recipeId} timer={timer} showLabel={(step.timers?.length||0)>1}/>)}{(step.illustrations||[]).map((picture,j)=>{
      const id=`illustration-${i+1}-${j+1}`,key=`${i}-${j}`,visible=Boolean(expanded[key]);
      const verb=picture.kind==="result"?"Visa hur det ska se ut":"Visa illustration";
      return <button key={key} type="button" className="illustrationToggle" aria-label={visible?"Dölj illustration":verb} title={visible?"Dölj illustration":verb} aria-expanded={visible} aria-controls={id} onClick={()=>toggle(key)}><span className="illustrationLabel">{visible?"Dölj illustration":verb}</span><span aria-hidden="true" className="illustrationSymbol">▧ {visible?"−":"+"}</span></button>;
    })}</div></div>{(step.illustrations||[]).map((picture,j)=>{
      const id=`illustration-${i+1}-${j+1}`,key=`${i}-${j}`,visible=Boolean(expanded[key]);
      return <div className="stepIllustration" key={key}>
        <div className="illustrationPanel" id={id} hidden={!visible}>{visible&&<figure><img src={picture.file} alt={picture.alt} loading="lazy" decoding="async"/>{picture.caption&&<figcaption>{picture.caption}</figcaption>}</figure>}</div>
      </div>;
    })}</div></section>)}
  </>;
}

const FRENCH_PARTICLES = new Set(["au","aux","à","la","le","les","de","des","du","d'","en","et","med","och","i","av","som","pour","sur","sans"]);

function toMenuWord(word: string, index: number) {
  if (!word) return word;
  const lower = word.toLocaleLowerCase("fr");
  if (index > 0 && FRENCH_PARTICLES.has(lower)) return lower;
  return lower.charAt(0).toLocaleUpperCase("fr") + lower.slice(1);
}

function FrenchMenuTitle({ text }: { text: string }) {
  const tokens = text.split(/(\s+)/);
  let wordIndex = 0;
  return (
    <span className="frenchMenuTitle">
      {tokens.map((token, idx) => {
        if (/^\s+$/.test(token)) return token;
        const currentIndex = wordIndex++;
        const lower = token.toLocaleLowerCase("fr");
        if (currentIndex > 0 && FRENCH_PARTICLES.has(lower)) {
          return <em key={idx}>{lower}</em>;
        }
        return <span key={idx}>{toMenuWord(token, currentIndex)}</span>;
      })}
    </span>
  );
}

function RecipeCarousel({recipes,ratings,onSelect,label}:{recipes:Recipe[];ratings:Record<string,number>;onSelect:(recipe:Recipe)=>void;label:string}) {
  const track=useRef<HTMLDivElement>(null);
  const scroll=(direction:number)=>track.current?.scrollBy({left:direction*track.current.clientWidth,behavior:"smooth"});
  return <div className="carousel">
    <button type="button" className="carouselArrow previous" onClick={()=>scroll(-1)} aria-label={`Visa föregående recept i ${label}`}>‹</button>
    <div className="recipeCarousel" ref={track} aria-label={label}>{recipes.slice(0,12).map((recipe,index)=><button className={`recipeTile tile${index+1}`} key={recipe.id} onClick={()=>onSelect(recipe)}><div className="tileImage">{recipe.image?<img src={recipe.image} alt=""/>:<span>{recipe.protein.slice(0,1)}</span>}<em>{ratings[recipe.id]?`${ratings[recipe.id]} ★`:"NYTT"}</em></div><div className="tileCopy"><small>{formatDuration(recipe)}</small><h3><FrenchMenuTitle text={recipe.title}/></h3><p>{recipe.swedishTitle}</p></div></button>)}</div>
    <button type="button" className="carouselArrow next" onClick={()=>scroll(1)} aria-label={`Visa fler recept i ${label}`}>›</button>
  </div>;
}

export default function Home() {
  const [archiveView,setArchiveView]=useState<"list"|"grid">(()=>{if(typeof window==="undefined")return "list";try{return localStorage.getItem("carnet-archive-view")==="grid"?"grid":"list";}catch{return "list";}});
  const [theme,setTheme]=useState<"light"|"dark">(()=>{if(typeof window==="undefined")return "light";try{return localStorage.getItem("carnet-theme")==="dark"?"dark":"light";}catch{return "light";}});
  useEffect(()=>{document.documentElement.dataset.theme=theme;},[theme]);
  function changeArchiveView(view:"list"|"grid"){setArchiveView(view);try{localStorage.setItem("carnet-archive-view",view);}catch{void 0;}}
  function toggleTheme(){const next=theme==="dark"?"light":"dark";setTheme(next);try{localStorage.setItem("carnet-theme",next);}catch{void 0;}}
  const [recipes,setRecipes]=useState<Recipe[]>(seedRecipes);
  const recipesRef=useRef<Recipe[]>(seedRecipes);
  const [query,setQuery]=useState(""); const [protein,setProtein]=useState("Alla"); const [carb,setCarb]=useState("Alla"); const [selected,setSelected]=useState<Recipe|null>(null); const [showAll,setShowAll]=useState(false);
  const [sortBy,setSortBy]=useState<SortMode>("name"); const [sortAsc,setSortAsc]=useState(true);
  const [archiveName,setArchiveName]=useState(""); const [archiveProtein,setArchiveProtein]=useState("Alla"); const [archiveCarb,setArchiveCarb]=useState("Alla"); const [archiveTag,setArchiveTag]=useState("Alla"); const [archiveOccasion,setArchiveOccasion]=useState("Alla"); const [archiveMaxTime,setArchiveMaxTime]=useState<"Alla"|"30"|"60">("Alla"); const [favoritesOnly,setFavoritesOnly]=useState(false);
  const [checkedIngredients,setCheckedIngredients]=useState<Record<string,boolean>>({});
  const [cooked,setCooked]=useState<Record<string,{count:number;lastCookedAt:string|null}>>(()=>{if(typeof window==="undefined")return {};try{return JSON.parse(localStorage.getItem("carnet-cooked")||"{}");}catch{return {};}});
  const [ratings,setRatings]=useState<Record<string,number>>(()=>{if(typeof window==="undefined")return {};try{return JSON.parse(localStorage.getItem("carnet-ratings")||"{}");}catch{return {};}}); const [notes,setNotes]=useState<Record<string,Note[]>>(()=>{if(typeof window==="undefined")return {};try{return JSON.parse(localStorage.getItem("carnet-notes")||"{}");}catch{return {};}}); const [commentOpen,setCommentOpen]=useState(false); const [draft,setDraft]=useState("");
  const [favorites,setFavorites]=useState<Record<string,string>>(()=>{if(typeof window==="undefined")return {};try{return JSON.parse(localStorage.getItem("carnet-favorites")||"{}");}catch{return {};}});
  const [displayServings,setDisplayServings]=useState(1); const [copyState,setCopyState]=useState<"idle"|"copied"|"fallback">("idle"); const [ingredientCopyState,setIngredientCopyState]=useState<"idle"|"copied">("idle");
  const [keepAwake,setKeepAwake]=useState(false);
  const wakeLockRef=useRef<{release:()=>Promise<void>}|null>(null);
  const [sync,setSync]=useState<SyncStatus>({state:"idle",message:"Kontrollerar receptarkivet…"}); const [syncing,setSyncing]=useState(false);

  function applyHash(list:Recipe[]){
    if(typeof window==="undefined")return;
    const hash=window.location.hash;
    if(hash.startsWith("#recept=")){
      const id=decodeURIComponent(hash.slice("#recept=".length));
      const match=list.find(item=>item.id===id);
      if(match){
        setSelected(match);
        setDisplayServings(match.servings||1);
        setCopyState("idle");
        setIngredientCopyState("idle");
        setCommentOpen(false);
        setDraft("");
        setCheckedIngredients({});
        return;
      }
    }
    setSelected(null);
    setKeepAwake(false);
    if(hash==="#alla")setShowAll(true);
    else if(!hash)setShowAll(false);
  }

  useEffect(()=>{
    let active=true;
    fetch("api/recipes").then(r=>r.ok?r.json():Promise.reject()).then(data=>{
      if(active&&Array.isArray(data)&&data.length){
        recipesRef.current=data;
        setRecipes(data);
        applyHash(data);
      }
    }).catch(()=>{
      if(active)applyHash(recipesRef.current);
    });
    const onHash=()=>{applyHash(recipesRef.current);};
    window.addEventListener("hashchange",onHash);
    window.addEventListener("popstate",onHash);
    return()=>{active=false;window.removeEventListener("hashchange",onHash);window.removeEventListener("popstate",onHash);};
  },[]);

  useEffect(()=>{
    if(!keepAwake||!selected){
      wakeLockRef.current?.release().catch(()=>{void 0;});
      wakeLockRef.current=null;
      return;
    }
    let cancelled=false;
    const requestLock=async()=>{
      try{
        const nav=navigator as Navigator&{wakeLock?:{request:(type:"screen")=>Promise<{release:()=>Promise<void>;addEventListener?:(type:string,listener:()=>void)=>void}>}};
        if(!nav.wakeLock)return;
        const sentinel=await nav.wakeLock.request("screen");
        if(cancelled){await sentinel.release().catch(()=>{void 0;});return;}
        wakeLockRef.current=sentinel;
        sentinel.addEventListener?.("release",()=>{if(!cancelled&&document.visibilityState==="hidden")wakeLockRef.current=null;});
      }catch{if(!cancelled)setKeepAwake(false);}
    };
    const onVisibility=()=>{if(document.visibilityState==="visible"&&keepAwake&&!wakeLockRef.current)void requestLock();};
    void requestLock();
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{cancelled=true;document.removeEventListener("visibilitychange",onVisibility);wakeLockRef.current?.release().catch(()=>{void 0;});wakeLockRef.current=null;};
  },[keepAwake,selected]);

  useEffect(()=>{ fetch("api/sync").then(r=>r.ok?r.json():Promise.reject()).then(setSync).catch(()=>setSync({state:"local",message:"Lokal förhandsvisning"})); },[]);
  useEffect(()=>{ fetch("api/states").then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(data.ratings)setRatings(data.ratings);if(data.favorites)setFavorites(data.favorites);if(data.cooked)setCooked(data.cooked);}).catch(()=>{}); },[]);
  useEffect(()=>{ if(!selected)return; fetch(`api/state/${selected.id}`).then(r=>r.ok?r.json():Promise.reject()).then(data=>{setRatings(current=>({...current,[selected.id]:data.rating||0}));setFavorites(current=>{const next={...current};if(data.favorite)next[selected.id]=data.favorite_updated_at||new Date().toISOString();else delete next[selected.id];return next;});if(data.cooked)setCooked(current=>({...current,[selected.id]:data.cooked}));setNotes(current=>({...current,[selected.id]:data.notes||[]}));}).catch(()=>{}); },[selected]);
  const proteins=["Alla",...new Set(recipes.map(r=>r.protein))], carbs=["Alla",...new Set(recipes.map(r=>r.carb))], occasions=["Alla",...new Set(recipes.map(r=>r.occasion))], allTags=["Alla",...new Set(recipes.flatMap(r=>r.tags||[]).sort((a,b)=>a.localeCompare(b,"sv")))];
  const filtered=useMemo(()=>recipes.filter(r=>{const q=query.toLowerCase().trim(); return (protein==="Alla"||r.protein===protein)&&(carb==="Alla"||r.carb===carb)&&(!q||`${r.title} ${r.swedishTitle} ${r.protein} ${r.carb} ${(r.tags||[]).join(" ")}`.toLowerCase().includes(q));}).sort(newestFirst),[query,protein,carb,recipes]);
  const archive=useMemo(()=>recipes.filter(recipe=>{
    const name=archiveName.toLocaleLowerCase("sv").trim();
    const searchable=name?`${recipe.swedishTitle} ${recipe.title} ${recipe.protein} ${recipe.carb} ${(recipe.tags||[]).join(" ")} ${recipe.ingredients.flatMap(g=>g.items).map(item=>renderQuantityText(item,recipe.quantities)).join(" ")}`.toLocaleLowerCase("sv"):"";
    const mins=estimatedMinutes(recipe);
    const timeMatch=archiveMaxTime==="Alla"||(archiveMaxTime==="30"?mins<=30:mins<=60);
    return (!favoritesOnly||Boolean(favorites[recipe.id]))&&(!name||searchable.includes(name))&&(archiveProtein==="Alla"||recipe.protein===archiveProtein)&&(archiveCarb==="Alla"||recipe.carb===archiveCarb)&&(archiveTag==="Alla"||(recipe.tags||[]).includes(archiveTag))&&(archiveOccasion==="Alla"||recipe.occasion===archiveOccasion)&&timeMatch;
  }).sort((a,b)=>{
    if(sortBy==="newest")return newestFirst(a,b);
    if(sortBy==="fastest")return estimatedMinutes(a)-estimatedMinutes(b)||a.swedishTitle.localeCompare(b.swedishTitle,"sv",{sensitivity:"base"});
    if(sortBy==="rating")return (ratings[b.id]||0)-(ratings[a.id]||0)||a.swedishTitle.localeCompare(b.swedishTitle,"sv",{sensitivity:"base"});
    if(sortBy==="cooked")return (cooked[b.id]?.count||0)-(cooked[a.id]?.count||0)||((cooked[b.id]?.lastCookedAt||"").localeCompare(cooked[a.id]?.lastCookedAt||""))||a.swedishTitle.localeCompare(b.swedishTitle,"sv",{sensitivity:"base"});
    return sortAsc?a.swedishTitle.localeCompare(b.swedishTitle,"sv",{sensitivity:"base"}):b.swedishTitle.localeCompare(a.swedishTitle,"sv",{sensitivity:"base"});
  }),[recipes,archiveName,archiveProtein,archiveCarb,archiveTag,archiveOccasion,archiveMaxTime,sortBy,sortAsc,favoritesOnly,favorites,ratings,cooked]);
  const favoriteRecipes=useMemo(()=>recipes.filter(recipe=>favorites[recipe.id]).sort((a,b)=>favorites[b.id].localeCompare(favorites[a.id])).slice(0,12),[recipes,favorites]);
  const importantIngredients=(recipe:Recipe)=>recipe.ingredients.flatMap(group=>group.items).slice(0,3).map(text=>renderQuantityText(text,recipe.quantities)).join(" · ");
  function pushHash(nextHash:string){if(typeof window==="undefined")return;const target=nextHash||(window.location.pathname+window.location.search);if((window.location.hash||"")!==nextHash)window.history.pushState(null,"",target);}
  function selectRecipe(recipe:Recipe|null,syncHistory=true){setSelected(recipe);setDisplayServings(recipe?.servings||1);setCopyState("idle");setIngredientCopyState("idle");setCommentOpen(false);setDraft("");setCheckedIngredients({});if(!recipe)setKeepAwake(false);if(syncHistory)pushHash(recipe?`#recept=${encodeURIComponent(recipe.id)}`:(showAll?"#alla":""));}
  function goHome(){selectRecipe(null);setShowAll(false);setQuery("");setProtein("Alla");setCarb("Alla");if(typeof window!=="undefined"&&window.location.hash)window.history.replaceState(null,"",window.location.pathname+window.location.search);window.scrollTo({top:0,behavior:"smooth"});}
  function toggleIngredient(key:string){setCheckedIngredients(current=>({...current,[key]:!current[key]}));}
  function markCookedToday(id:string){const current=cooked[id]||{count:0,lastCookedAt:null};const optimistic={count:current.count+1,lastCookedAt:new Date().toISOString()};const next={...cooked,[id]:optimistic};setCooked(next);try{localStorage.setItem("carnet-cooked",JSON.stringify(next));}catch{void 0;}fetch("api/cooked",{method:"POST",headers:{"Content-Type":"application/json","X-Carnet-Request":"1"},body:JSON.stringify({recipe_id:id})}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(typeof data.count==="number"){setCooked(prev=>{const updated={...prev,[id]:{count:data.count,lastCookedAt:data.lastCookedAt||optimistic.lastCookedAt}};try{localStorage.setItem("carnet-cooked",JSON.stringify(updated));}catch{void 0;}return updated;});}}).catch(()=>{});}
  function rate(id:string,value:number){const next={...ratings,[id]:value};setRatings(next);localStorage.setItem("carnet-ratings",JSON.stringify(next));fetch("api/ratings",{method:"POST",headers:{"Content-Type":"application/json","X-Carnet-Request":"1"},body:JSON.stringify({recipe_id:id,rating:value})}).catch(()=>{});}
  function toggleFavorite(id:string){const active=Boolean(favorites[id]);const next={...favorites};if(active)delete next[id];else next[id]=new Date().toISOString();setFavorites(next);localStorage.setItem("carnet-favorites",JSON.stringify(next));fetch("api/favorites",{method:"POST",headers:{"Content-Type":"application/json","X-Carnet-Request":"1"},body:JSON.stringify({recipe_id:id,favorite:!active})}).catch(()=>{});}
  function submitNote(event:FormEvent){event.preventDefault();if(!selected||!draft.trim())return;const trimmed=draft.trim();const note:Note={text:trimmed,date:new Date().toLocaleDateString("sv-SE"),status:"open"};const next={...notes,[selected.id]:[...(notes[selected.id]||[]),note]};setNotes(next);localStorage.setItem("carnet-notes",JSON.stringify(next));const recipeId=selected.id;fetch("api/notes",{method:"POST",headers:{"Content-Type":"application/json","X-Carnet-Request":"1"},body:JSON.stringify({recipe_id:recipeId,kind:"comment",text:trimmed})}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(typeof data.id==="number"){setNotes(current=>{const list=[...(current[recipeId]||[])];const idx=list.findIndex(item=>!item.id&&item.text===trimmed);if(idx>=0)list[idx]={id:data.id,text:trimmed,date:data.date||note.date,status:data.status||"open"};const updated={...current,[recipeId]:list};try{localStorage.setItem("carnet-notes",JSON.stringify(updated));}catch{void 0;}return updated;});}}).catch(()=>{});setDraft("");setCommentOpen(false);}
  function updateNoteStatus(recipeId:string,index:number,note:Note,status:"open"|"resolved"|"deleted"){setNotes(current=>{const list=[...(current[recipeId]||[])];if(status==="deleted")list.splice(index,1);else if(list[index])list[index]={...list[index],status};const updated={...current,[recipeId]:list};try{localStorage.setItem("carnet-notes",JSON.stringify(updated));}catch{void 0;}return updated;});if(typeof note.id==="number"){fetch("api/notes/status",{method:"POST",headers:{"Content-Type":"application/json","X-Carnet-Request":"1"},body:JSON.stringify({recipe_id:recipeId,note_id:note.id,status})}).catch(()=>{});}}
  async function copyUpdateContext(){if(!selected)return;const text=updateRecipePrompt(selected);try{await navigator.clipboard.writeText(text);setCopyState("copied");window.setTimeout(()=>setCopyState("idle"),2200);}catch{setCopyState("fallback");}}
  async function copyIngredientsList(){if(!selected)return;const anyChecked=Object.values(checkedIngredients).some(Boolean);const lines=[`${selected.swedishTitle} (${displayServings} ${displayServings===1?"portion":"portioner"})`,""];for(const group of selected.ingredients){const items=group.items.map((item,index)=>({text:formatIngredientLine(selected,item,displayServings),checked:Boolean(checkedIngredients[`${group.heading}-${index}`])})).filter(entry=>!anyChecked||!entry.checked);if(!items.length)continue;if(selected.ingredients.length>1)lines.push(group.heading);for(const entry of items)lines.push(`- ${entry.text}`);lines.push("");}try{await navigator.clipboard.writeText(lines.join("\n").trim());setIngredientCopyState("copied");window.setTimeout(()=>setIngredientCopyState("idle"),2200);}catch{void 0;}}
  function syncNow(){setSyncing(true);fetch("api/sync",{method:"POST",headers:{"Content-Type":"application/json","X-Carnet-Request":"1"},body:"{}"}).then(async response=>{const status=await response.json();setSync(status);if(response.ok)return fetch("api/recipes");throw new Error(status.message);}).then(response=>response.json()).then(data=>{if(Array.isArray(data)&&data.length){recipesRef.current=data;setRecipes(data);}}).catch(error=>setSync({state:"error",message:error instanceof Error?error.message:"Synkroniseringen misslyckades"})).finally(()=>setSyncing(false));}
  const hasAnyChecked=Object.values(checkedIngredients).some(Boolean);
  const wakeAvailable=typeof navigator!=="undefined"&&"wakeLock"in navigator;
  return <main>
    <header className="masthead"><button className="wordmark" onClick={goHome}><span className="crown">♛</span><b>LE CARNET DU NORD</b><small>RECETTES DE LA MAISON</small></button><div className="syncArea"><span className={`syncState ${sync.state}`} title={sync.message}>● {sync.state==="current"?"RECEPTEN ÄR AKTUELLA":sync.state==="error"?"SYNKFEL":"PRIVAT ARKIV"}</span><button type="button" className="themeToggle" onClick={toggleTheme} aria-pressed={theme==="dark"}>{theme==="dark"?"☀ Ljust tema":"☾ Mörkt tema"}</button><button onClick={syncNow} disabled={syncing} aria-label="Hämta nya recept från GitHub">{syncing?"Hämtar…":"Uppdatera recept"}</button></div></header>
    {!selected ? <>
      {!showAll && <section className="homeHero clickableHero"><button type="button" className="heroHomeButton" onClick={goHome} aria-label="Återställ sökning och visa de senaste recepten" title="Återställ sökning och visa de senaste recepten"/><div className="heroIntro"><p className="kicker">NORDISKA RÅVAROR · FRANSK SJÄL</p><h1>Vad vill du<br/><i>laga idag?</i></h1></div><div className="searchPanel"><label><span>SÖK I REPERTOAREN</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Namn, protein eller kolhydrat"/></label><div className="selects"><label>PROTEIN<select value={protein} onChange={e=>setProtein(e.target.value)}>{proteins.map(x=><option key={x}>{x}</option>)}</select></label><span>+</span><label>KOLHYDRAT<select value={carb} onChange={e=>setCarb(e.target.value)}>{carbs.map(x=><option key={x}>{x}</option>)}</select></label></div></div></section>}
      <section className={`latest ${showAll?"archiveMode":""}`}>
        <div className="latestHead">
          <div><p className="kicker">{showAll?"HELA REPERTOAREN":"SENAST UR KÖKET"}</p><h2>{showAll?"Toutes les recettes":"Les dernières recettes"}</h2></div>
          <div className="archiveToggle">{showAll&&<span>{archive.length} recept</span>}<button onClick={()=>{const next=!showAll;if(next){setArchiveName(query);setArchiveProtein(protein);setArchiveCarb(carb);setArchiveTag("Alla");setArchiveOccasion("Alla");setArchiveMaxTime("Alla");}setShowAll(next);pushHash(next?"#alla":"");requestAnimationFrame(()=>document.querySelector(".latest")?.scrollIntoView({behavior:"smooth"}))}}>{showAll?"Visa de senaste":"Visa alla recept"}</button></div>
        </div>
        {!showAll?<div className="homeShelves"><RecipeCarousel recipes={filtered} ratings={ratings} onSelect={recipe=>{selectRecipe(recipe);scrollTo(0,0)}} label="De senaste recepten"/><section className="favoriteShelf"><div className="shelfHead"><div><p className="kicker">MINA FAVORITER</p><h2>Mes recettes favorites</h2></div></div>{favoriteRecipes.length?<RecipeCarousel recipes={favoriteRecipes} ratings={ratings} onSelect={recipe=>{selectRecipe(recipe);scrollTo(0,0)}} label="Mina favoriter"/>:<div className="emptyFavorites">Favoritmarkera ett recept med hjärtat så visas det här.</div>}</section></div>:
        <div className="archive">
          <div className="archiveTools">
            <div className="archiveFilters" aria-label="Filtrera alla recept">
              <label><span>SÖK</span><input value={archiveName} onChange={event=>setArchiveName(event.target.value)} placeholder="Namn, ingrediens eller tagg"/></label>
              <label><span>PROTEIN</span><select value={archiveProtein} onChange={event=>setArchiveProtein(event.target.value)}>{proteins.map(value=><option key={value}>{value}</option>)}</select></label>
              <label><span>KOLHYDRAT</span><select value={archiveCarb} onChange={event=>setArchiveCarb(event.target.value)}>{carbs.map(value=><option key={value}>{value}</option>)}</select></label>
              <label><span>TAGGAR</span><select value={archiveTag} onChange={event=>setArchiveTag(event.target.value)}>{allTags.map(value=><option key={value}>{value}</option>)}</select></label>
              <label><span>MÅLTIDSTYP</span><select value={archiveOccasion} onChange={event=>setArchiveOccasion(event.target.value)}>{occasions.map(value=><option key={value}>{value}</option>)}</select></label>
              <label><span>TID</span><select value={archiveMaxTime} onChange={event=>setArchiveMaxTime(event.target.value as "Alla"|"30"|"60")}><option value="Alla">Alla tider</option><option value="30">Snabbt (≤ 30 min)</option><option value="60">Under 60 min</option></select></label>
            </div>
            <div className="archiveSort" aria-label="Sortera och filtrera recept"><span>SORTERA EFTER</span><button className={sortBy==="name"?"active":""} onClick={()=>{if(sortBy==="name")setSortAsc(value=>!value);else{setSortBy("name");setSortAsc(true);}}}>{sortBy==="name"?(sortAsc?"Namn A–Ö ↑":"Namn Ö–A ↓"):"Namn A–Ö"}</button><button className={sortBy==="newest"?"active":""} onClick={()=>setSortBy("newest")}>Senast tillagd</button><button className={sortBy==="fastest"?"active":""} onClick={()=>setSortBy("fastest")}>Snabbast</button><button className={sortBy==="rating"?"active":""} onClick={()=>setSortBy("rating")}>Högst betyg</button><button className={sortBy==="cooked"?"active":""} onClick={()=>setSortBy("cooked")}>Mest lagad</button><button className={`favoritesFilter ${favoritesOnly?"active":""}`} onClick={()=>setFavoritesOnly(value=>!value)} aria-pressed={favoritesOnly}>Favoriter</button>{(archiveName||archiveProtein!=="Alla"||archiveCarb!=="Alla"||archiveTag!=="Alla"||archiveOccasion!=="Alla"||archiveMaxTime!=="Alla"||favoritesOnly)&&<button className="clearFilters" onClick={()=>{setArchiveName("");setArchiveProtein("Alla");setArchiveCarb("Alla");setArchiveTag("Alla");setArchiveOccasion("Alla");setArchiveMaxTime("Alla");setFavoritesOnly(false)}}>✕ Rensa filter</button>}</div>
          </div>
          <div className="archiveViewToggle" role="group" aria-label="Visa recepten som"><button aria-pressed={archiveView==="list"} onClick={()=>changeArchiveView("list")}>☰ Lista</button><button aria-pressed={archiveView==="grid"} onClick={()=>changeArchiveView("grid")}>▦ Kort</button></div>
          {archiveView==="list"?<><div className="archiveLabels" aria-hidden="true"><span>Rätt</span><span className="archiveIngredientsLabel">Viktigaste ingredienser</span><span>Total tid</span></div>
          <div className="archiveList">{archive.map((r,index)=><div key={r.id} className="archiveRow"><button className="archiveOpen" onClick={()=>{selectRecipe(r);scrollTo(0,0)}} aria-label={`Öppna ${r.swedishTitle}`}/><span className="archiveNumber">{String(index+1).padStart(2,"0")}</span><span className="archiveThumb">{r.image?<img src={r.image} alt=""/>:<span>{r.protein.slice(0,1)}</span>}</span><span className="archiveName"><b>{r.swedishTitle}</b><small>{r.title}</small></span><span className="archiveIngredients">{importantIngredients(r)}</span><span className="archiveTime">◷ {formatDuration(r)}</span><FavoriteButton active={Boolean(favorites[r.id])} onClick={()=>toggleFavorite(r.id)} className="archiveFavorite"/></div>)}</div></>:<div className="archiveCardGrid">{archive.map(recipe=><article className="archiveCard" key={recipe.id}><button className="cardOpen" onClick={()=>{selectRecipe(recipe);scrollTo(0,0)}} aria-label={`Öppna ${recipe.swedishTitle}`}/><div className="cardImage">{recipe.image?<img src={recipe.image} alt="" loading="lazy"/>:<span aria-hidden="true">♛</span>}</div><div className="cardCopy"><h3>{recipe.swedishTitle}</h3><p className="cardFrench">{recipe.title}</p><p className="cardDescription">{recipe.description}</p></div><div className="cardMeta"><span><span aria-hidden="true">◷</span> {formatDuration(recipe)}</span><span title="Kalorier per portion">{recipe.macros.kcal} kcal</span>{ratings[recipe.id]?<span className="cardRating" title={`Betyg ${ratings[recipe.id]} av 5`}>★ {ratings[recipe.id]}</span>:null}<FavoriteButton active={Boolean(favorites[recipe.id])} onClick={()=>toggleFavorite(recipe.id)}/></div></article>)}</div>}
        </div>}
        {(showAll?archive.length:filtered.length)===0&&<div className="noResults"><b>Inga recept funna</b><span>Prova en annan kombination.</span></div>}
      </section>
    </>:<article className="recipePage">
      <section className="recipeHero"><div className="recipeTitle"><div className="ornament">— ♛ —</div><h1><FrenchMenuTitle text={selected.title}/></h1><h2>{selected.subtitle}</h2><p>{selected.description}</p></div><div className="heroDish">{selected.image?<img src={selected.image} alt={selected.swedishTitle}/>:<span>{selected.protein}</span>}</div></section>
      <section className="facts"><div><i className="factIcon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg></i><b>{formatDuration(selected)}</b><span>Total tid</span></div><div><i className="factIcon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10M7 20h10M8 4c0 4 4 6 4 8s-4 4-4 8M16 4c0 4-4 6-4 8s4 4 4 8"/><path d="M10 17h4"/></svg></i><b>{selected.active} minuter</b><span>Aktiv tid</span></div><div className="portionFact"><i className="factIcon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16a8 8 0 0 1-16 0Z"/><path d="M7 19h10M15 6l-3 6"/></svg></i><b className="portionValue" aria-live="polite">{displayServings} {displayServings===1?"portion":"portioner"}</b><div className="portionControls" aria-label="Ändra antal portioner"><button onClick={()=>setDisplayServings(value=>Math.max(1,value-1))} disabled={displayServings<=1} aria-label="Minska antal portioner">−</button><button onClick={()=>setDisplayServings(value=>Math.min(20,value+1))} disabled={displayServings>=20} aria-label="Öka antal portioner">+</button></div></div><div><i className="factIcon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c2.5 3.5 5 6 5 10a5 5 0 1 1-10 0c0-2.5 1.2-4.5 2.5-6 0 2 1.5 3 2.5 3 .5-2.5 0-5 0-7z"/></svg></i><b>{selected.macros.kcal} kcal</b><span>Per portion</span></div><div><i className="factIcon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round"><path d="M4 16h16"/><path d="M5 16a7 7 0 0 1 14 0"/><circle cx="12" cy="7.5" r="1.2"/><path d="M3 19h18"/></svg></i><b>{selected.occasion}</b><span>Passar som</span></div></section>
      <div className="recipeUtilityBar"><button type="button" className="utilityBack" onClick={()=>{selectRecipe(null);scrollTo(0,0)}}>← Till receptarkivet</button><div className="utilityButtons">{wakeAvailable&&<button type="button" className={`wakeLockToggle ${keepAwake?"active":""}`} aria-pressed={keepAwake} onClick={()=>setKeepAwake(value=>!value)}>{keepAwake?"Skärmen hålls vaken ✓":"Håll skärmen vaken"}</button>}<button type="button" className="printButton" onClick={()=>window.print()}>Skriv ut</button></div></div>
      <section className="recipeBody"><div className="paper ingredients"><div className="ingredientsHead"><h3>Ingredienser</h3><button type="button" className="copyIngredientsBtn" onClick={copyIngredientsList} aria-live="polite">{ingredientCopyState==="copied"?"Kopierat ✓":hasAnyChecked?"Kopiera ej avbockade":"Kopiera ingredienser"}</button></div><p className="ingredientHint">Klicka på en ingrediens för att bocka av</p>{displayServings!==selected.servings&&<p className="portionNotice">Mängder för {displayServings} {displayServings===1?"portion":"portioner"} · original {selected.servings}</p>}{selected.ingredients.map(g=><section key={g.heading}><h4>{g.heading}</h4><ul>{g.items.map((x,index)=>{const key=`${g.heading}-${index}`;const isChecked=Boolean(checkedIngredients[key]);return <li key={key} className={isChecked?"checked":""}><button type="button" className="ingredientButton" aria-pressed={isChecked} onClick={()=>toggleIngredient(key)}>{formatIngredientLine(selected,x,displayServings)}</button></li>;})}</ul></section>)}</div><div className="paper method"><RecipeInstructions key={selected.id} recipeId={selected.id} steps={selected.steps} quantities={selected.quantities} factor={displayServings/selected.servings} notice={portionNotice(displayServings,selected.servings,Boolean(selected.quantities))}/></div><aside><div className="paper"><h3>Serveringstips</h3><ul>{selected.tips.map(x=><li key={x}>{x}</li>)}</ul></div>{selected.sommelier&&<div className="paper sommelier"><h3>L’accord du sommelier</h3><p>{selected.sommelier}</p></div>}{selected.storage&&<div className="paper storage"><h3>Förvaring</h3><p>{selected.storage}</p></div>}{selected.allergens&&<div className="paper allergens"><h3>Allergener</h3>{selected.allergens.length?<ul className="allergenList">{selected.allergens.map(item=><li key={item}>{item}</li>)}</ul>:<p className="allergenNone">Inga deklarerade allergener.</p>}</div>}<div className="paper macros"><h3>Näringsvärde</h3><small>PER PORTION · BERÄKNAT</small>{Object.entries(selected.macros).map(([k,v])=><div key={k}><span>{{kcal:"Kalorier",protein:"Protein",carbs:"Kolhydrater",fat:"Fett",fiber:"Fiber"}[k]}</span><b>{v}{k==="kcal"?" kcal":" g"}</b></div>)}{selected.nutritionMethod&&<details className="nutritionMethod"><summary>Beräkningsgrund</summary><p>{selected.nutritionMethod}</p></details>}</div><div className="why"><h3>Varför det blir så gott</h3>{selected.why.map(x=><p key={x}>✓ {x}</p>)}</div></aside></section>
      <section className="community"><div><p className="kicker">MINA ANTECKNINGAR</p><h2>Smaka, minns, förbättra.</h2><p className="cookedStat">{(cooked[selected.id]?.count||0)>0?`Tillagad ${cooked[selected.id].count} ${cooked[selected.id].count===1?"gång":"gånger"}${cooked[selected.id].lastCookedAt?` · senast ${cooked[selected.id].lastCookedAt!.slice(0,10)}`:""}`:"Aldrig tillagad ännu"}</p></div><div className="recipeReactions"><div className="rating"><span>MITT BETYG</span><div>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>rate(selected.id,n)} className={(ratings[selected.id]||0)>=n?"on":""} aria-label={`${n} stjärnor`}>★</button>)}</div></div><div className="favoriteControl"><span>SPARA SOM FAVORIT</span><FavoriteButton active={Boolean(favorites[selected.id])} onClick={()=>toggleFavorite(selected.id)}/></div></div><div className="actions"><button type="button" onClick={()=>markCookedToday(selected.id)}>Lagad idag ✓</button><button onClick={()=>setCommentOpen(true)}>Lägg till kommentar</button><button className="copyUpdate" onClick={copyUpdateContext} aria-live="polite">{copyState==="copied"?"Kopierat ✓":"Kopiera för uppdatering"}</button></div>{commentOpen&&<form onSubmit={submitNote}><label>Kommentar<textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Skriv din anteckning här…"/></label><div><button type="button" onClick={()=>setCommentOpen(false)}>Avbryt</button><button type="submit">Spara</button></div></form>}{copyState==="fallback"&&<div className="copyFallback"><label>Markera och kopiera texten till chatten<textarea readOnly value={updateRecipePrompt(selected)} onFocus={event=>event.currentTarget.select()}/></label></div>}{(notes[selected.id]||[]).length>0&&<div className="notes">{notes[selected.id].map((n,i)=><div key={n.id??i} className={`noteItem ${n.status==="resolved"?"resolved":""}`}><p><span>{n.date}{n.status==="resolved"?" · Hanterad":""}</span>{n.text}</p><div className="noteActions"><button type="button" onClick={()=>updateNoteStatus(selected.id,i,n,n.status==="resolved"?"open":"resolved")}>{n.status==="resolved"?"Återöppna":"Markera klar"}</button><button type="button" onClick={()=>updateNoteStatus(selected.id,i,n,"deleted")}>Ta bort</button></div></div>)}</div>}</section>
      <button className="back" onClick={()=>{selectRecipe(null);scrollTo(0,0)}}>← Till receptarkivet</button>
    </article>}
    <TimerOverview/><footer><b>LE CARNET DU NORD</b><SpotifyButton/></footer>
  </main>
}

