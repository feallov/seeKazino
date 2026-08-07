var NFT_RC={common:'#8B9099',uncommon:'#4ADE80',rare:'#60A5FA',epic:'#A78BFA',legendary:'#F59E0B'};
var NFT_RL={common:'Обычный',uncommon:'Необычный',rare:'Редкий',epic:'Эпический',legendary:'Легендарный'};
var NFT_RATE={common:1,uncommon:5,rare:15,epic:40,legendary:100};
function nftArt(n){
var c1=(n.colors&&n.colors[0])||'#22C55E',rc=NFT_RC[n.rarity]||'#8B9099',h=0,i;
for(i=0;i<n.id.length;i++)h=(h*31+n.id.charCodeAt(i))>>>0;
var sh='';for(i=0;i<6;i++){sh+="<circle cx='"+(15+((h>>(i*3))%70))+"' cy='"+(15+((h>>(i*2+1))%70))+"' r='"+(6+((h>>i)%14))+"' fill='"+(i%2?c1:'#0B0D10')+"' opacity='0.4'/>";}
return 'data:image/svg+xml;utf8,'+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='"+c1+"'/><stop offset='1' stop-color='#0B0D10'/></linearGradient></defs><rect width='120' height='120' fill='url(#g)'/>"+sh+"<rect x='5' y='5' width='110' height='110' fill='none' stroke='"+rc+"' stroke-width='4'/><polygon points='60,32 80,55 60,78 40,55' fill='"+rc+"' opacity='0.95'/></svg>");
}
var NFT_API={
  state:async(n)=>{var r=await fetch('/api/nfts?nick='+encodeURIComponent(n));return r.json()},
  activate:async(n,id)=>{var r=await fetch('/api/nft/activate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nick:n,id:id})});return r.json()},
  deactivate:async(n,id)=>{var r=await fetch('/api/nft/deactivate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nick:n,id:id})});return r.json()},
  claim:async(n,id)=>{var r=await fetch('/api/nft/claim',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nick:n,id:id})});return r.json()}
};

async function renderNFTs(){
  var grid=document.getElementById('nftGrid');
  if(!grid||!Store.getUser())return;
  var user=Store.getUser();
  var data=await NFT_API.state(user.nick);
  grid.innerHTML='';
  var ids=Object.keys(data.nfts||{});
  if(!ids.length){grid.innerHTML='<p class="section-sub">Пока нет NFT — открывай кейсы в магазине! 🎁</p>';return}
  var active=data.active||[];
  ids.forEach(function(id){
    var n=data.nfts[id];
    var meta=window.NFT_BY_ID&&NFT_BY_ID[id];
    if(!meta)return;
    var isActive=active.indexOf(id)>=0;
    var acc=data.accrued&&data.accrued[id]?data.accrued[id]:0;
    var d=document.createElement('div');
    d.className='nft-item rarity-'+meta.rarity;
    d.innerHTML='<img class="nft-img" src="'+nftArt(meta)+'">'
      +'<span class="nft-name">'+meta.name+'</span>'
      +'<span class="nft-rarity" style="color:'+NFT_RC[meta.rarity]+'">'+NFT_RL[meta.rarity]+' · $'+meta.rate+'/мин</span>'
      +(isActive?'<span class="nft-acc" id="acc_'+id+'">+$'+acc.toFixed(0)+'</span><button class="btn btn-primary btn-sm nft-claim" data-id="'+id+'">Получить</button><button class="btn btn-ghost btn-sm nft-deact" data-id="'+id+'">Убрать</button>'
      :'<button class="btn btn-ghost btn-sm nft-act" data-id="'+id+'">В профиль</button>');
    grid.appendChild(d);
  });
  grid.querySelectorAll('.nft-claim').forEach(function(b){b.onclick=async function(){var r=await NFT_API.claim(user.nick,b.dataset.id);if(r.success){Store.setUser(r.user);updateBalanceDisplay();alert('+$'+r.amount);renderNFTs()}}});
  grid.querySelectorAll('.nft-act').forEach(function(b){b.onclick=async function(){var r=await NFT_API.activate(user.nick,b.dataset.id);if(!r.success)return alert(r.error);Store.setUser(r.user);renderNFTs()}});
  grid.querySelectorAll('.nft-deact').forEach(function(b){b.onclick=async function(){var r=await NFT_API.deactivate(user.nick,b.dataset.id);if(!r.success)return alert(r.error);Store.setUser(r.user);renderNFTs()}});
}

document.addEventListener('DOMContentLoaded',function(){
  if(!document.getElementById('nftGrid'))return;
  renderNFTs();
  setInterval(renderNFTs,15000);
});
window.NFT_BY_ID={};
async function loadNFTMeta(){
  if(Object.keys(NFT_BY_ID).length)return;
  var r=await fetch('/api/shop');
  var d=await r.json();
  (d.cases||[]).forEach(function(c){
    c.nfts.forEach(function(n){
      NFT_BY_ID[n.id]={id:n.id,name:n.name,rarity:n.rarity,rate:NFT_RATE[n.rarity],colors:c.colors};
    });
  });
}

(function(){
  var oldInit=renderNFTs;
  window.renderNFTs=async function(){await loadNFTMeta();return oldInit()};
})();
