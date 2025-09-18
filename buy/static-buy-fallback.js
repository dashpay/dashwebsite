// Fallback renderer for Buy page when Vue is unavailable or blocked.
(function(){
  var DBG = { logs: [] };
  function log(){ var m=[].slice.call(arguments).join(' '); DBG.logs.push(m); try{console.log('[BuyFallback]',m);}catch(e){} }
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function qs(s, r){ return (r||document).querySelector(s); }
  function qsa(s, r){ return [].slice.call((r||document).querySelectorAll(s)); }
  function ce(tag, o){ var el=document.createElement(tag); if(o){ if(o.className) el.className=o.className; if(o.text!=null) el.textContent=o.text; if(o.html!=null) el.innerHTML=o.html; if(o.attrs){ for(var k in o.attrs) el.setAttribute(k,o.attrs[k]); } } return el; }
  function parseVendorsAttr(el){ try{ var raw=el.getAttribute('vendors'); return raw?JSON.parse(raw):[]; }catch(e){ return []; } }
  function mapTypeToLabel(t){ switch((t||'').toLowerCase()){ case 'exchange': return 'Exchange'; case 'onramp': return 'Onramp'; case 'dex': return 'DEX'; case 'swap': return 'Swap'; default: return (t||''); } }
  function mapLabelToType(label){ var l=(label||'').toLowerCase(); if(l==='dex') return 'dex'; if(l==='onramp') return 'onramp'; if(l==='swap') return 'swap'; if(l==='exchange') return 'exchange'; return ''; }
  function fetchJSON(url){
    try{
      if(typeof fetch !== 'function') return Promise.resolve(null);
      return fetch(url, {credentials:'same-origin'}).then(function(r){ if(!r.ok) return null; return r.json(); }).catch(function(){ return null; });
    }catch(e){ return Promise.resolve(null); }
  }
  function readJSONFromScript(id){
    try{
      var el = document.getElementById(id);
      if(!el) return null;
      var txt = el.textContent || el.innerHTML || '';
      if(!txt) return null;
      return JSON.parse(txt);
    }catch(e){ return null; }
  }

  function render(){
    if (window.__BUY_FALLBACK_ACTIVE) { log('already initialized; skipping'); return; }
    window.__BUY_FALLBACK_ACTIVE = true;
    window.__BUY_FALLBACK_DEBUG = DBG;
    log('init');
    var root = qs('dash-buyspend[type="buy"]') || qs('dash-buyspend');
    if(!root){
      log('no <dash-buyspend> found');
      // Vanilla mode: operate on pre-rendered markup if present
      var filterBar = qs('.bg-light.py-4.filter-bar');
      var tabsUl = filterBar ? qs('ul.buy-tabs', filterBar) : qs('ul.buy-tabs');
      if(!tabsUl){ log('vanilla: no tabs UL found'); return; }
      var listContainer = qs('.buyspend-items.container');
      if(listContainer && listContainer.getAttribute('data-buy-source')==='json'){
        log('vanilla: detected prior JSON render, aborting');
        return;
      }
      if(!listContainer){ log('vanilla: no list container found'); return; }
      var rows = qsa('.buyspend-item', listContainer);
      var typedRows = rows.filter(function(r){ return !!(r.getAttribute('data-type')||''); });
      if(!rows.length){
        // Build from embedded dataset as ultimate fallback
        log('vanilla: no rows found -> using dataset');
        // Minimal embedded providers list (representative set)
        var EMBED = [
          // Exchange
          {name:"Coinbase",type:"exchange",instantsend:false,chainlocks:true,confirmations:2,currency:["BTC","ETH","USD","EUR"],image:"https://media.dash.org/wp-content/uploads/coinbase.svg",url:"https://www.coinbase.com/"},
          {name:"Coinbase Pro",type:"exchange",instantsend:false,chainlocks:true,confirmations:2,currency:["USD","BTC"],image:"https://media.dash.org/wp-content/uploads/coinbase-pro.svg",url:"https://pro.coinbase.com/"},
          {name:"KuCoin",type:"exchange",instantsend:true,chainlocks:true,confirmations:0,currency:["USDT","BTC","ETH"],image:"https://media.dash.org/wp-content/uploads/kucoin-1.svg",url:"https://www.kucoin.com/"},
          {name:"WhiteBIT",type:"exchange",instantsend:true,chainlocks:true,confirmations:0,currency:["USD","BTC","ETH"],image:"https://media.dash.org/wp-content/uploads/whitebit-2.svg",url:"https://whitebit.com/"},
          // Onramp
          {name:"Topper",type:"onramp",instantsend:false,chainlocks:false,confirmations:1,currency:["USD","BTC","ETH"],image:"https://media.dash.org/wp-content/uploads/buy-topper.png",url:"https://www.topperpay.com/"},
          // DEX
          {name:"Rango",type:"dex",instantsend:false,chainlocks:false,confirmations:1,currency:["USDT","BTC","ETH","LTC","Bridge Aggregator","etc"],image:"https://media.dash.org/wp-content/uploads/buy-rango.png",url:"https://rango.exchange/"},
          {name:"Asgardex",type:"dex",instantsend:false,chainlocks:false,confirmations:1,currency:["USD","BTC","ETH"],image:"https://media.dash.org/wp-content/uploads/buy-asgardex.png",url:"https://www.asgardex.com/"},
          // Swap
          {name:"StealthEX",type:"swap",instantsend:false,chainlocks:false,confirmations:1,currency:["USDT","BTC","ETH","LTC","etc"],image:"https://media.dash.org/wp-content/uploads/photo_2024-08-21_14-41-57.jpg",url:"https://stealthex.io/"},
          {name:"Swapzone",type:"swap",instantsend:false,chainlocks:false,confirmations:1,currency:["USDT","BTC","ETH","LTC","etc"],image:"https://media.dash.org/wp-content/uploads/images.png",url:"https://swapzone.io/"},
          {name:"LetsExchange",type:"swap",instantsend:false,chainlocks:false,confirmations:1,currency:["USDT","BTC","ETH","LTC","etc"],image:"https://media.dash.org/wp-content/uploads/a18a099598a41cbb.png",url:"https://letsexchange.io/"},
          {name:"HoudiniSwap",type:"swap",instantsend:false,chainlocks:false,confirmations:1,currency:["USDT","BTC","ETH","LTC","etc"],image:"https://media.dash.org/wp-content/uploads/845b2219d0d24b999bb661c938e72455.avif",url:"https://houdiniswap.com/"}
        ];

        // Ensure header exists
        var header = qs('.buyspend-header', listContainer);
        if(!header){
          header = ce('div',{className:'buyspend-header d-none d-lg-flex font-weight-bold py-2 border-bottom'});
          header.appendChild(ce('div',{className:'col-lg-3'}));
          header.appendChild(ce('div',{className:'col-lg-3', text:'Features'}));
          header.appendChild(ce('div',{className:'col-lg-2', text:'Deposit time'}));
          header.appendChild(ce('div',{className:'col-lg-2', text:'Trading pairs'}));
          listContainer.appendChild(header);
        }

        function initFrom(DATA){
          // Build tabs from data
          var types = Array.from(new Set(DATA.map(function(x){return (x.type||'').toLowerCase(); })));
          var order=['exchange','onramp','dex','swap']; types = order.filter(function(t){ return types.indexOf(t)!==-1; });
          tabsUl.innerHTML=''; types.forEach(function(t){ var li=ce('li',{text: mapTypeToLabel(t)}); li.setAttribute('data-type', t); tabsUl.appendChild(li); });

          function clearRows(){ qsa('.buyspend-item', listContainer).forEach(function(n){ n.parentNode && n.parentNode.removeChild(n); }); }
          function rowFor(item){
            var row = ce('div',{className:'buyspend-item row py-3 align-items-center border-bottom', attrs:{'data-type': (item.type||'').toLowerCase()}});
            var c1 = ce('div',{className:'col-lg-3 d-flex align-items-center gap-2'}); var img = ce('img',{className:'img-fluid', attrs:{src:item.image||'', alt:item.name||'', style:'max-width:32px;'}}); var name = ce('span',{className:'font-weight-bold', text:item.name||''}); c1.appendChild(img); c1.appendChild(name);
            var c2 = ce('div',{className:'col-lg-3'}); var feats=[]; if(item.chainlocks) feats.push('ChainLocks'); if(item.instantsend) feats.push('InstantSend'); c2.textContent = feats.join(' / ');
            var c3 = ce('div',{className:'col-lg-2'}); var conf = parseFloat(item.confirmations||0); if(!isFinite(conf)) conf = 0; var mins = conf*2.5; c3.textContent = (mins? (mins%1? mins.toFixed(1): String(mins)) : '0') + ' min';
            var c4 = ce('div',{className:'col-lg-2'}); var cur = Array.isArray(item.currency)? item.currency.slice(0): []; c4.textContent = cur.join(' / ');
            row.appendChild(c1); row.appendChild(c2); row.appendChild(c3); row.appendChild(c4);
            if(item.url){ row.style.cursor='pointer'; row.addEventListener('click', function(){ try{ window.open(item.url, '_blank'); }catch(e){} }); }
            return row;
          }
          try{ listContainer.setAttribute('data-buy-source', (DATA===EMBED)?'embed':'json'); }catch(e){}
          function renderList(type){ clearRows(); var cnt=0; DATA.forEach(function(it){ if((it.type||'').toLowerCase()===type){ listContainer.appendChild(rowFor(it)); cnt++; }}); log('vanilla dataset renderList', type, '->', cnt); }
          tabsUl.addEventListener('click', function(e){ var t=e.target; var li=t && (t.closest? t.closest('li'): null); if(!li||!tabsUl.contains(li)) return; var type=(li.getAttribute('data-type')||'').toLowerCase(); qsa('li',tabsUl).forEach(function(n){ n.classList.toggle('active', n===li); }); renderList(type); });
          var hash=(location.hash||'').replace(/^#/, ''); var initialType=mapLabelToType(hash); if(!initialType || types.indexOf(initialType)===-1) initialType=types[0]||'exchange'; var initialLi=qs('li[data-type="'+initialType+'"]', tabsUl) || qs('li', tabsUl); if(initialLi){ initialLi.classList.add('active'); } renderList(initialType);
          try{ document.body.setAttribute('data-buy-vanilla','1'); }catch(e){}
        }

        fetchJSON('vendors.json').then(function(j){
          if(!(Array.isArray(j) && j.length)){
            var j2 = readJSONFromScript('vendors-json');
            if(Array.isArray(j2) && j2.length){ j = j2; log('vanilla: using vendors from <script id="vendors-json">'); }
          }
          if(Array.isArray(j) && j.length){ log('vanilla: using vendors.json', j.length); initFrom(j); }
          else { log('vanilla: vendors.json missing -> using embedded'); initFrom(EMBED); }
        }).catch(function(){
          var j2 = readJSONFromScript('vendors-json');
          if(Array.isArray(j2) && j2.length){ log('vanilla: using vendors from <script id="vendors-json">'); initFrom(j2); }
          else { initFrom(EMBED); }
        });
        return;
      } else if (typedRows.length === 0) {
        // Rows exist but are not annotated; attempt JSON rebuild, else leave DOM intact
        log('vanilla: rows exist without data-type; attempting vendors.json');
        fetchJSON('vendors.json').then(function(j){
          if(!(Array.isArray(j) && j.length)){
            var j2 = readJSONFromScript('vendors-json');
            if(Array.isArray(j2) && j2.length){ j = j2; log('vanilla: using vendors from <script id="vendors-json">'); }
          }
          if(Array.isArray(j) && j.length){
            log('vanilla: vendors.json available -> rebuilding list');
            // Rebuild list from JSON without touching header outside container
            listContainer.innerHTML = '';
            // Ensure header exists
            var header = ce('div',{className:'buyspend-header d-none d-lg-flex font-weight-bold py-2 border-bottom'});
            header.appendChild(ce('div',{className:'col-lg-3'}));
            header.appendChild(ce('div',{className:'col-lg-3', text:'Features'}));
            header.appendChild(ce('div',{className:'col-lg-2', text:'Deposit time'}));
            header.appendChild(ce('div',{className:'col-lg-2', text:'Trading pairs'}));
            listContainer.appendChild(header);

            // Build tabs
            tabsUl.innerHTML='';
            var order=['exchange','onramp','dex','swap'];
            var types = order.filter(function(t){ return j.some(function(it){ return (it.type||'').toLowerCase()===t; }); });
            types.forEach(function(t){ var li=ce('li',{text: mapTypeToLabel(t)}); li.setAttribute('data-type', t); tabsUl.appendChild(li); });

            // Mark source
            try{ listContainer.setAttribute('data-buy-source','json'); }catch(e){}

            function clearRows(){ qsa('.buyspend-item', listContainer).forEach(function(n){ n.parentNode && n.parentNode.removeChild(n); }); }
            function rowFor(item){
              var row = ce('div',{className:'buyspend-item row py-3 align-items-center border-bottom', attrs:{'data-type': (item.type||'').toLowerCase()}});
              var c1 = ce('div',{className:'col-lg-3 d-flex align-items-center gap-2'});
              var img = ce('img',{className:'img-fluid', attrs:{src:item.image||'', alt:item.name||'', style:'max-width:32px;'}});
              var name = ce('span',{className:'font-weight-bold', text:item.name||''});
              c1.appendChild(img); c1.appendChild(name);
              var c2 = ce('div',{className:'col-lg-3'});
              var feats=[]; if(item.chainlocks) feats.push('ChainLocks'); if(item.instantsend) feats.push('InstantSend'); c2.textContent = feats.join(' / ');
              var c3 = ce('div',{className:'col-lg-2'});
              var conf = parseFloat(item.confirmations||0); if(!isFinite(conf)) conf = 0; var mins = conf*2.5; c3.textContent = (mins? (mins%1? mins.toFixed(1): String(mins)) : '0') + ' min';
              var c4 = ce('div',{className:'col-lg-2'});
              var cur = Array.isArray(item.currency)? item.currency.slice(0): []; c4.textContent = cur.join(' / ');
              row.appendChild(c1); row.appendChild(c2); row.appendChild(c3); row.appendChild(c4);
              if(item.url){ row.style.cursor='pointer'; row.addEventListener('click', function(){ try{ window.open(item.url, '_blank'); }catch(e){} }); }
              return row;
            }
            function renderList(type){ clearRows(); var cnt=0; j.forEach(function(it){ if((it.type||'').toLowerCase()===type){ listContainer.appendChild(rowFor(it)); cnt++; }}); log('vanilla JSON rebuild renderList', type, '->', cnt); }
            tabsUl.addEventListener('click', function(e){ var t=e.target; var li=t && (t.closest? t.closest('li'): null); if(!li||!tabsUl.contains(li)) return; var type=(li.getAttribute('data-type')||'').toLowerCase(); qsa('li',tabsUl).forEach(function(n){ n.classList.toggle('active', n===li); }); renderList(type); });
            var hash=(location.hash||'').replace(/^#/, ''); var initialType=mapLabelToType(hash); if(!initialType || types.indexOf(initialType)===-1) initialType=types[0]||'exchange'; var initialLi=qs('li[data-type="'+initialType+'"]', tabsUl) || qs('li', tabsUl); if(initialLi){ initialLi.classList.add('active'); } renderList(initialType);
          } else {
            log('vanilla: vendors.json unavailable; leaving DOM untouched');
          }
        });
        return;
      }
      // Expect rows to carry data-type
      var typesSet = new Set();
      typedRows.forEach(function(r){ var t=(r.getAttribute('data-type')||'').toLowerCase(); if(t) typesSet.add(t); });
      if(!typesSet.size){ log('vanilla: rows missing data-type; cannot enable filter'); return; }
      // Build tabs from available types in canonical order
      var order=['exchange','onramp','dex','swap'];
      var types = order.filter(function(t){ return typesSet.has(t); });
      tabsUl.innerHTML='';
      types.forEach(function(t){ var li=ce('li',{text: mapTypeToLabel(t)}); li.setAttribute('data-type', t); tabsUl.appendChild(li); });
      function apply(type){ rows.forEach(function(r){ var t=(r.getAttribute('data-type')||'').toLowerCase(); r.style.display = (t===type)?'':'none'; }); }
      tabsUl.addEventListener('click', function(e){ var li=e.target.closest?e.target.closest('li'):null; if(!li||!tabsUl.contains(li))return; var type=(li.getAttribute('data-type')||'').toLowerCase(); qsa('li',tabsUl).forEach(function(n){ n.classList.toggle('active', n===li); }); apply(type); log('vanilla click ->', type); });
      var hash=(location.hash||'').replace(/^#/, '').toLowerCase(); var initial=mapLabelToType(hash); if(!initial||types.indexOf(initial)===-1) initial=types[0]; apply(initial); var initLi=qs('li[data-type="'+initial+'"]', tabsUl); if(initLi) initLi.classList.add('active');
      try{ document.body.setAttribute('data-buy-vanilla','1'); }catch(e){}
      return;
    }

    // If something already rendered from JSON, avoid re-initializing
    var pre = qs('.buyspend-items.container', root) || qs('.buyspend-items.container');
    if(pre && pre.getAttribute('data-buy-source')==='json'){
      log('root-mode: detected prior JSON render, aborting');
      return;
    }

    var inlineItems = parseVendorsAttr(root);
    function build(items){
      log('vendors =', items.length);
      if(!items.length){ log('no vendors found'); return; }

      // Ensure/prepare filter tabs container
      var filterBar = qs('.bg-light.py-4.filter-bar', root) || ce('div',{className:'bg-light py-4 filter-bar'});
      var tabsContainer = qs('.container-sm', filterBar);
      if(!tabsContainer){ tabsContainer = ce('div',{className:'container-sm'}); filterBar.appendChild(tabsContainer); }
      if(!filterBar.parentNode){ root.insertBefore(filterBar, root.firstChild); }

      var tabsUl = ce('ul',{className:'buy-tabs'});
      tabsContainer.innerHTML='';
      tabsContainer.appendChild(tabsUl);

      // Determine available types based on data
      var types = Array.from(new Set(items.map(function(it){ return (it.type||'').toLowerCase(); }))).filter(Boolean);
      var order = ['exchange','onramp','dex','swap'];
      types = order.filter(function(t){ return types.indexOf(t)!==-1; });
      if(!types.length) { types = order; }
      log('types =', types.join(' | '));

      // Build tabs
      types.forEach(function(t){ var li=ce('li',{text: mapTypeToLabel(t)}); li.setAttribute('data-type', t); tabsUl.appendChild(li); });

      // Ensure/prepare list container with header
      var listContainer = qs('.buyspend-items.container', root);
      if(!listContainer){ listContainer = ce('div',{className:'buyspend-items container'}); root.appendChild(listContainer); }
      try{ listContainer.setAttribute('data-buy-source', (items && items.length && items!==inlineItems)?'json':'inline'); }catch(e){}
      var header = qs('.buyspend-header', listContainer);
      if(!header){
        header = ce('div',{className:'buyspend-header d-none d-lg-flex font-weight-bold py-2 border-bottom'});
        header.appendChild(ce('div',{className:'col-lg-3'}));
        header.appendChild(ce('div',{className:'col-lg-3', text:'Features'}));
        header.appendChild(ce('div',{className:'col-lg-2', text:'Deposit time'}));
        header.appendChild(ce('div',{className:'col-lg-2', text:'Trading pairs'}));
        listContainer.appendChild(header);
      }

      function clearRows(){ qsa('.buyspend-item', listContainer).forEach(function(n){ n.parentNode && n.parentNode.removeChild(n); }); }
      function rowFor(item){
        var row = ce('div',{className:'buyspend-item row py-3 align-items-center border-bottom', attrs:{'data-type': (item.type||'').toLowerCase()}});
        var c1 = ce('div',{className:'col-lg-3 d-flex align-items-center gap-2'});
        var img = ce('img',{className:'img-fluid', attrs:{src:item.image||'', alt:item.name||'', style:'max-width:32px;'}});
        var name = ce('span',{className:'font-weight-bold', text:item.name||''});
        c1.appendChild(img); c1.appendChild(name);
        var c2 = ce('div',{className:'col-lg-3'});
        var feats=[]; if(item.chainlocks) feats.push('ChainLocks'); if(item.instantsend) feats.push('InstantSend'); c2.textContent = feats.join(' / ');
        var c3 = ce('div',{className:'col-lg-2'});
        var conf = parseFloat(item.confirmations||0); if(!isFinite(conf)) conf = 0; var mins = conf*2.5; c3.textContent = (mins? (mins%1? mins.toFixed(1): String(mins)) : '0') + ' min';
        var c4 = ce('div',{className:'col-lg-2'});
        var cur = Array.isArray(item.currency)? item.currency.slice(0): []; c4.textContent = cur.join(' / ');
        row.appendChild(c1); row.appendChild(c2); row.appendChild(c3); row.appendChild(c4);
        if(item.url){ row.style.cursor='pointer'; row.addEventListener('click', function(){ try{ window.open(item.url, '_blank'); }catch(e){} }); }
        return row;
      }
      function renderList(activeType){ clearRows(); var count=0; items.forEach(function(it){ if((it.type||'').toLowerCase()===activeType){ listContainer.appendChild(rowFor(it)); count++; }}); log('renderList', activeType, '->', count); }
      tabsUl.addEventListener('click', function(e){ var t=e.target; var li=t && (t.closest? t.closest('li'): null); if(!li||!tabsUl.contains(li)) return; var type=(li.getAttribute('data-type')||'').toLowerCase(); qsa('li',tabsUl).forEach(function(n){ n.classList.toggle('active', n===li); }); renderList(type); });
      var hash=(location.hash||'').replace(/^#/, ''); var initialType=mapLabelToType(hash); if(!initialType || types.indexOf(initialType)===-1) initialType=types[0]||'exchange'; var initialLi=qs('li[data-type="'+initialType+'"]', tabsUl) || qs('li', tabsUl); if(initialLi){ initialLi.classList.add('active'); } renderList(initialType);
      try{ root.setAttribute('data-buy-fallback','active'); root.setAttribute('data-buy-types', String(types.length)); }catch(e){}
    }

    fetchJSON('vendors.json').then(function(j){
      if(Array.isArray(j) && j.length){ log('using vendors.json', j.length); build(j); }
      else { build(inlineItems); }
    }).catch(function(){ build(inlineItems); });
  }

  ready(render);
})();
