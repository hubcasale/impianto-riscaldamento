var re=Object.defineProperty;var ae=Object.getOwnPropertyDescriptor;var u=(a,e,t,i)=>{for(var r=i>1?void 0:i?ae(e,t):e,s=a.length-1,o;s>=0;s--)(o=a[s])&&(r=(i?o(e,t,r):o(r))||r);return i&&r&&re(e,t,r),r};var Q=globalThis,Z=Q.ShadowRoot&&(Q.ShadyCSS===void 0||Q.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,nt=Symbol(),At=new WeakMap,U=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==nt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(Z&&e===void 0){let i=t!==void 0&&t.length===1;i&&(e=At.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&At.set(t,e))}return e}toString(){return this.cssText}},St=a=>new U(typeof a=="string"?a:a+"",void 0,nt),y=(a,...e)=>{let t=a.length===1?a[0]:e.reduce((i,r,s)=>i+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+a[s+1],a[0]);return new U(t,a,nt)},Et=(a,e)=>{if(Z)a.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let i=document.createElement("style"),r=Q.litNonce;r!==void 0&&i.setAttribute("nonce",r),i.textContent=t.cssText,a.appendChild(i)}},lt=Z?a=>a:a=>a instanceof CSSStyleSheet?(e=>{let t="";for(let i of e.cssRules)t+=i.cssText;return St(t)})(a):a;var{is:se,defineProperty:oe,getOwnPropertyDescriptor:ne,getOwnPropertyNames:le,getOwnPropertySymbols:ce,getPrototypeOf:de}=Object,tt=globalThis,Ct=tt.trustedTypes,pe=Ct?Ct.emptyScript:"",me=tt.reactiveElementPolyfillSupport,j=(a,e)=>a,B={toAttribute(a,e){switch(e){case Boolean:a=a?pe:null;break;case Object:case Array:a=a==null?a:JSON.stringify(a)}return a},fromAttribute(a,e){let t=a;switch(e){case Boolean:t=a!==null;break;case Number:t=a===null?null:Number(a);break;case Object:case Array:try{t=JSON.parse(a)}catch{t=null}}return t}},et=(a,e)=>!se(a,e),zt={attribute:!0,type:String,converter:B,reflect:!1,useDefault:!1,hasChanged:et};Symbol.metadata??=Symbol("metadata"),tt.litPropertyMetadata??=new WeakMap;var A=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=zt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let i=Symbol(),r=this.getPropertyDescriptor(e,i,t);r!==void 0&&oe(this.prototype,e,r)}}static getPropertyDescriptor(e,t,i){let{get:r,set:s}=ne(this.prototype,e)??{get(){return this[t]},set(o){this[t]=o}};return{get:r,set(o){let n=r?.call(this);s?.call(this,o),this.requestUpdate(e,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??zt}static _$Ei(){if(this.hasOwnProperty(j("elementProperties")))return;let e=de(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(j("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(j("properties"))){let t=this.properties,i=[...le(t),...ce(t)];for(let r of i)this.createProperty(r,t[r])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[i,r]of t)this.elementProperties.set(i,r)}this._$Eh=new Map;for(let[t,i]of this.elementProperties){let r=this._$Eu(t,i);r!==void 0&&this._$Eh.set(r,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let i=new Set(e.flat(1/0).reverse());for(let r of i)t.unshift(lt(r))}else e!==void 0&&t.push(lt(e));return t}static _$Eu(e,t){let i=t.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Et(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){let i=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,i);if(r!==void 0&&i.reflect===!0){let s=(i.converter?.toAttribute!==void 0?i.converter:B).toAttribute(t,i.type);this._$Em=e,s==null?this.removeAttribute(r):this.setAttribute(r,s),this._$Em=null}}_$AK(e,t){let i=this.constructor,r=i._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let s=i.getPropertyOptions(r),o=typeof s.converter=="function"?{fromAttribute:s.converter}:s.converter?.fromAttribute!==void 0?s.converter:B;this._$Em=r;let n=o.fromAttribute(t,s.type);this[r]=n??this._$Ej?.get(r)??n,this._$Em=null}}requestUpdate(e,t,i,r=!1,s){if(e!==void 0){let o=this.constructor;if(r===!1&&(s=this[e]),i??=o.getPropertyOptions(e),!((i.hasChanged??et)(s,t)||i.useDefault&&i.reflect&&s===this._$Ej?.get(e)&&!this.hasAttribute(o._$Eu(e,i))))return;this.C(e,t,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:r,wrapped:s},o){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,o??t??this[e]),s!==!0||o!==void 0)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),r===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,s]of this._$Ep)this[r]=s;this._$Ep=void 0}let i=this.constructor.elementProperties;if(i.size>0)for(let[r,s]of i){let{wrapped:o}=s,n=this[r];o!==!0||this._$AL.has(r)||n===void 0||this.C(r,void 0,s,n)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(t)):this._$EM()}catch(i){throw e=!1,this._$EM(),i}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};A.elementStyles=[],A.shadowRootOptions={mode:"open"},A[j("elementProperties")]=new Map,A[j("finalized")]=new Map,me?.({ReactiveElement:A}),(tt.reactiveElementVersions??=[]).push("2.1.2");var gt=globalThis,Tt=a=>a,it=gt.trustedTypes,Mt=it?it.createPolicy("lit-html",{createHTML:a=>a}):void 0,Ot="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,Ht="?"+C,ue=`<${Ht}>`,P=document,F=()=>P.createComment(""),K=a=>a===null||typeof a!="object"&&typeof a!="function",ft=Array.isArray,he=a=>ft(a)||typeof a?.[Symbol.iterator]=="function",ct=`[ 	
\f\r]`,q=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Pt=/-->/g,Rt=/>/g,T=RegExp(`>|${ct}(?:([^\\s"'>=/]+)(${ct}*=${ct}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),It=/'/g,Lt=/"/g,Dt=/^(?:script|style|textarea|title)$/i,bt=a=>(e,...t)=>({_$litType$:a,strings:e,values:t}),c=bt(1),Re=bt(2),Ie=bt(3),S=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),Nt=new WeakMap,M=P.createTreeWalker(P,129);function Ut(a,e){if(!ft(a)||!a.hasOwnProperty("raw"))throw Error("invalid template strings array");return Mt!==void 0?Mt.createHTML(e):e}var ge=(a,e)=>{let t=a.length-1,i=[],r,s=e===2?"<svg>":e===3?"<math>":"",o=q;for(let n=0;n<t;n++){let l=a[n],d,h,m=-1,b=0;for(;b<l.length&&(o.lastIndex=b,h=o.exec(l),h!==null);)b=o.lastIndex,o===q?h[1]==="!--"?o=Pt:h[1]!==void 0?o=Rt:h[2]!==void 0?(Dt.test(h[2])&&(r=RegExp("</"+h[2],"g")),o=T):h[3]!==void 0&&(o=T):o===T?h[0]===">"?(o=r??q,m=-1):h[1]===void 0?m=-2:(m=o.lastIndex-h[2].length,d=h[1],o=h[3]===void 0?T:h[3]==='"'?Lt:It):o===Lt||o===It?o=T:o===Pt||o===Rt?o=q:(o=T,r=void 0);let v=o===T&&a[n+1].startsWith("/>")?" ":"";s+=o===q?l+ue:m>=0?(i.push(d),l.slice(0,m)+Ot+l.slice(m)+C+v):l+C+(m===-2?n:v)}return[Ut(a,s+(a[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),i]},V=class a{constructor({strings:e,_$litType$:t},i){let r;this.parts=[];let s=0,o=0,n=e.length-1,l=this.parts,[d,h]=ge(e,t);if(this.el=a.createElement(d,i),M.currentNode=this.el.content,t===2||t===3){let m=this.el.content.firstChild;m.replaceWith(...m.childNodes)}for(;(r=M.nextNode())!==null&&l.length<n;){if(r.nodeType===1){if(r.hasAttributes())for(let m of r.getAttributeNames())if(m.endsWith(Ot)){let b=h[o++],v=r.getAttribute(m).split(C),J=/([.?@])?(.*)/.exec(b);l.push({type:1,index:s,name:J[2],strings:v,ctor:J[1]==="."?pt:J[1]==="?"?mt:J[1]==="@"?ut:N}),r.removeAttribute(m)}else m.startsWith(C)&&(l.push({type:6,index:s}),r.removeAttribute(m));if(Dt.test(r.tagName)){let m=r.textContent.split(C),b=m.length-1;if(b>0){r.textContent=it?it.emptyScript:"";for(let v=0;v<b;v++)r.append(m[v],F()),M.nextNode(),l.push({type:2,index:++s});r.append(m[b],F())}}}else if(r.nodeType===8)if(r.data===Ht)l.push({type:2,index:s});else{let m=-1;for(;(m=r.data.indexOf(C,m+1))!==-1;)l.push({type:7,index:s}),m+=C.length-1}s++}}static createElement(e,t){let i=P.createElement("template");return i.innerHTML=e,i}};function L(a,e,t=a,i){if(e===S)return e;let r=i!==void 0?t._$Co?.[i]:t._$Cl,s=K(e)?void 0:e._$litDirective$;return r?.constructor!==s&&(r?._$AO?.(!1),s===void 0?r=void 0:(r=new s(a),r._$AT(a,t,i)),i!==void 0?(t._$Co??=[])[i]=r:t._$Cl=r),r!==void 0&&(e=L(a,r._$AS(a,e.values),r,i)),e}var dt=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:i}=this._$AD,r=(e?.creationScope??P).importNode(t,!0);M.currentNode=r;let s=M.nextNode(),o=0,n=0,l=i[0];for(;l!==void 0;){if(o===l.index){let d;l.type===2?d=new G(s,s.nextSibling,this,e):l.type===1?d=new l.ctor(s,l.name,l.strings,this,e):l.type===6&&(d=new ht(s,this,e)),this._$AV.push(d),l=i[++n]}o!==l?.index&&(s=M.nextNode(),o++)}return M.currentNode=P,r}p(e){let t=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}},G=class a{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,r){this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=L(this,e,t),K(e)?e===p||e==null||e===""?(this._$AH!==p&&this._$AR(),this._$AH=p):e!==this._$AH&&e!==S&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):he(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==p&&K(this._$AH)?this._$AA.nextSibling.data=e:this.T(P.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:i}=e,r=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=V.createElement(Ut(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===r)this._$AH.p(t);else{let s=new dt(r,this),o=s.u(this.options);s.p(t),this.T(o),this._$AH=s}}_$AC(e){let t=Nt.get(e.strings);return t===void 0&&Nt.set(e.strings,t=new V(e)),t}k(e){ft(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,i,r=0;for(let s of e)r===t.length?t.push(i=new a(this.O(F()),this.O(F()),this,this.options)):i=t[r],i._$AI(s),r++;r<t.length&&(this._$AR(i&&i._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let i=Tt(e).nextSibling;Tt(e).remove(),e=i}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},N=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,r,s){this.type=1,this._$AH=p,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=s,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=p}_$AI(e,t=this,i,r){let s=this.strings,o=!1;if(s===void 0)e=L(this,e,t,0),o=!K(e)||e!==this._$AH&&e!==S,o&&(this._$AH=e);else{let n=e,l,d;for(e=s[0],l=0;l<s.length-1;l++)d=L(this,n[i+l],t,l),d===S&&(d=this._$AH[l]),o||=!K(d)||d!==this._$AH[l],d===p?e=p:e!==p&&(e+=(d??"")+s[l+1]),this._$AH[l]=d}o&&!r&&this.j(e)}j(e){e===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},pt=class extends N{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===p?void 0:e}},mt=class extends N{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==p)}},ut=class extends N{constructor(e,t,i,r,s){super(e,t,i,r,s),this.type=5}_$AI(e,t=this){if((e=L(this,e,t,0)??p)===S)return;let i=this._$AH,r=e===p&&i!==p||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,s=e!==p&&(i===p||r);r&&this.element.removeEventListener(this.name,this,i),s&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},ht=class{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){L(this,e)}};var fe=gt.litHtmlPolyfillSupport;fe?.(V,G),(gt.litHtmlVersions??=[]).push("3.3.3");var jt=(a,e,t)=>{let i=t?.renderBefore??e,r=i._$litPart$;if(r===void 0){let s=t?.renderBefore??null;i._$litPart$=r=new G(e.insertBefore(F(),s),s,void 0,t??{})}return r._$AI(a),r};var vt=globalThis,_=class extends A{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=jt(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return S}};_._$litElement$=!0,_.finalized=!0,vt.litElementHydrateSupport?.({LitElement:_});var be=vt.litElementPolyfillSupport;be?.({LitElement:_});(vt.litElementVersions??=[]).push("4.2.2");var ve={attribute:!0,type:String,converter:B,reflect:!1,hasChanged:et},_e=(a=ve,e,t)=>{let{kind:i,metadata:r}=t,s=globalThis.litPropertyMetadata.get(r);if(s===void 0&&globalThis.litPropertyMetadata.set(r,s=new Map),i==="setter"&&((a=Object.create(a)).wrapped=!0),s.set(t.name,a),i==="accessor"){let{name:o}=t;return{set(n){let l=e.get.call(this);e.set.call(this,n),this.requestUpdate(o,l,a,!0,n)},init(n){return n!==void 0&&this.C(o,void 0,a,n),n}}}if(i==="setter"){let{name:o}=t;return function(n){let l=this[o];e.call(this,n),this.requestUpdate(o,l,a,!0,n)}}throw Error("Unsupported decorator location: "+i)};function x(a){return(e,t)=>typeof t=="object"?_e(a,e,t):((i,r,s)=>{let o=r.hasOwnProperty(s);return r.constructor.createProperty(s,i),o?Object.getOwnPropertyDescriptor(r,s):void 0})(a,e,t)}function g(a){return x({...a,state:!0,attribute:!1})}var Bt={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},st=a=>(...e)=>({_$litDirective$:a,values:e}),at=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var R=class extends at{constructor(e){if(super(e),this.it=p,e.type!==Bt.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===p||e==null)return this._t=void 0,this.it=e;if(e===S)return e;if(typeof e!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;let t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}};R.directiveName="unsafeHTML",R.resultType=1;var wi=st(R);var W=class extends R{};W.directiveName="unsafeSVG",W.resultType=2;var qt=st(W);var X={programma:"Programma",fuori_programma:"Fuori programma",manuale:"Manuale",timer:"Timer",spento:"Spento"};function H(a){if(a==null||a===""||typeof a=="boolean")return null;let e=typeof a=="number"?a:Number(String(a).replace(",","."));return Number.isFinite(e)?e:null}function f(a){if(a==null||!Number.isFinite(a))return"\u2013";let e=Math.round(a*10)/10;return e.toLocaleString("it-IT",{minimumFractionDigits:Number.isInteger(e)?0:1,maximumFractionDigits:1})}function xt(a){let e=Math.max(0,Math.round(a/6e4)),t=Math.floor(e/60),i=e%60;return t===0?`${i} min`:`${t} h ${String(i).padStart(2,"0")} min`}function Y(a,e){let t=new Date(a),i=new Date(e),r=l=>new Date(l.getFullYear(),l.getMonth(),l.getDate()).getTime(),s=Math.round((r(t)-r(i))/864e5),o=`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`,n=["dom","lun","mar","mer","gio","ven","sab"];return s===0?`oggi alle ${o}`:s===1?`domani alle ${o}`:`${n[t.getDay()]} ${t.getDate()} alle ${o}`}function Kt(a,e){return e&&a!=="spento"}function w(a,e,t,i){let r=Math.min(t,Math.max(e,a)),s=(String(i).split(".")[1]??"").length;return Number((Math.round(r/i)*i).toFixed(s))}var _t=10,Ft=28,xe="#3b82f6",ye="#22c55e",$e="#f59e0b",we="#9ca3af";function Vt(a,e,t){let i=o=>Math.min(1,Math.max(0,(o-_t)/(Ft-_t))),r=e===null||e<=t.antigelo+.01,s=[];if(r)s.push({from:0,to:1,color:we});else{let o=i(e-1),n=i(e+1);o>0&&s.push({from:0,to:o,color:xe}),s.push({from:o,to:n,color:ye}),n<1&&s.push({from:n,to:1,color:$e})}return{min:_t,max:Ft,arcs:s,needle:a===null?null:i(a),mark:r||e===null?null:i(e),idle:r}}function Gt(a,e,t){let i=e.next?e.next.kind==="set"?`${Y(e.next.time,t)} a ${f(e.next.temp)} \xB0C`:`${Y(e.next.time,t)} antigelo ${f(e.antigelo)} \xB0C`:"";if(e.awayApplied&&a!=="timer")return{icon:"mdi:home-off",text:`Casa vuota: antigelo ${f(e.antigelo)} \xB0C. Puoi comunque scaldare a mano.`,tone:"accent"};switch(a){case"timer":return{icon:"mdi:timer-outline",text:`Timer: ${f(e.timerTemp??e.target)} \xB0C${e.timerUntil!==null?` fino a ${Y(e.timerUntil,t)} (tra ${xt(e.timerUntil-t)})`:""}`,tone:"accent"};case"programma":return{icon:"mdi:calendar-check",text:i?`Prossimo cambio: ${i}`:"Programma attivo, senza altri cambi nella settimana",tone:"success"};case"fuori_programma":return{icon:"mdi:hand-back-right",text:`Cambiato a mano${i?`: il programma riprende ${i}`:""}`,tone:"warning"};case"manuale":return{icon:"mdi:hand-back-right-outline",text:`Manuale: mantiene ${f(e.target)} \xB0C finch\xE9 non lo cambi`,tone:"neutral"};default:return{icon:"mdi:snowflake-thermometer",text:`Spento: resta l'antigelo a ${f(e.antigelo)} \xB0C`,tone:"neutral"}}}var ot=["Lun","Mar","Mer","Gio","Ven","Sab","Dom"],Wt=["L","M","M","G","V","S","D"],Yt=[30,60,120,180,240,360];function O(a,e=!1){let t=/^(\d{1,2}):(\d{2})$/.exec(a.trim());if(!t||Number(t[2])>59)return null;let i=Number(t[1])*60+Number(t[2]);return i>=0&&i<=(e?1440:1439)?i:null}function yt(a){if(a.days.length===0)return"Scegli almeno un giorno.";let e=O(a.start),t=O(a.end,!0);return e===null||t===null?"Orario non valido.":e===t?"Inizio e fine non possono coincidere.":!Number.isFinite(a.temp)||a.temp<5||a.temp>35?"La temperatura deve stare tra 5 e 35 \xB0C.":null}function Xt(a){let e=O(a.start),t=O(a.end,!0);return e!==null&&t!==null&&t<=e}function Jt(a){let t=new Array(10080).fill(null);for(let r of a){let s=O(r.start),o=O(r.end,!0);if(s===null||o===null||s===o)continue;let n=o>s?o-s:1440-s+o;for(let l of r.days)if(!(l<0||l>6))for(let d=0;d<n;d++){let h=(l*1440+s+d)%10080,m=t[h];(m===null||r.temp>m)&&(t[h]=r.temp)}}let i=[];for(let r=0;r<7;r++){let s=[],o=0,n=null;for(let l=0;l<=1440;l++){let d=l<1440?t[r*1440+l]:null;d!==n&&(n!==null&&s.push({from:o,to:l,temp:n}),o=l,n=d)}i.push(s)}return i}function Qt(a){let e=[...new Set(a)].sort((t,i)=>t-i);return e.length===7?"Tutti i giorni":e.length===5&&e.join()==="0,1,2,3,4"?"Lun\u2013Ven":e.length===2&&e.join()==="5,6"?"Sab\u2013Dom":e.map(t=>ot[t]).join(" ")}function Zt(a=20.5){return{days:[0,1,2,3,4],start:"07:00",end:"09:00",temp:a}}function $t(a){let e=[];return a.slots.forEach((t,i)=>{let r=yt(t);r&&e.push(`Fascia ${i+1}: ${r}`)}),a.slots.length>30&&e.push("Al massimo 30 fasce."),e}function te(a){let e=Math.min(1,Math.max(0,(a-15)/9));return`hsl(${(45-e*40).toFixed(0)} 85% ${(58-e*8).toFixed(0)}%)`}function wt(a){let e=[];return a.antigelo<a.min_target||e.push("L'antigelo deve stare sotto l'obiettivo minimo."),a.min_target<a.max_target||e.push("L'obiettivo minimo deve stare sotto il massimo."),(a.default_target<a.min_target||a.default_target>a.max_target)&&e.push("L'obiettivo predefinito deve stare tra minimo e massimo."),a.notify_enabled&&a.notify_service.trim()!==""&&!a.notify_service.includes(".")&&e.push("Il servizio di annuncio va scritto come notify.nome."),a.boiler_program_pause&&!/^switch\.[a-z0-9_]+$/.test(a.boiler_program_switch.trim())&&e.push("Per sospendere il programma della caldaia indica il suo interruttore (switch.nome)."),a.puffer_gate&&!/^sensor\.[a-z0-9_]+$/.test(a.puffer_sensor.trim())&&e.push("Per far partire il riscaldamento col puffer caldo indica la sua sonda (sensor.nome)."),a.boiler_climate.trim()!==""&&!/^climate\.[a-z0-9_]+$/.test(a.boiler_climate.trim())&&e.push("La caldaia da accendere va scritta come climate.nome."),e}function I(a,e){let t=Math.PI*(1-a);return[110+e*Math.cos(t),102-e*Math.sin(t)]}function ke(a,e,t){let[i,r]=I(a,86),[s,o]=I(e,86);return`<path d="M${i.toFixed(1)} ${r.toFixed(1)} A86 86 0 0 1 ${s.toFixed(1)} ${o.toFixed(1)}" fill="none" stroke="${t}" stroke-width="14"/>`}function ee(a){let e=a.arcs.map(d=>ke(d.from,d.to,d.color)).join(""),t="";if(a.needle!==null){let[d,h]=I(a.needle,66);t=`<line x1="110" y1="102" x2="${d.toFixed(1)}" y2="${h.toFixed(1)}" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><circle cx="110" cy="102" r="5" fill="currentColor"/>`}let i="";if(a.mark!==null){let[d,h]=I(a.mark,97),[m,b]=I(a.mark,75);i=`<line x1="${d.toFixed(1)}" y1="${h.toFixed(1)}" x2="${m.toFixed(1)}" y2="${b.toFixed(1)}" stroke="currentColor" stroke-width="3"/>`}let[r,s]=I(0,88),[o,n]=I(1,88),l=`<text x="${r.toFixed(0)}" y="${(s+16).toFixed(0)}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.6">${a.min}</text><text x="${o.toFixed(0)}" y="${(n+16).toFixed(0)}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.6">${a.max}</text>`;return`<svg viewBox="0 0 220 118" role="img" aria-label="Temperatura ambiente e obiettivo">${e}${i}${t}${l}</svg>`}var D=y`
  :host {
    position: fixed;
    inset: 0;
    z-index: 10000;
    color: var(--primary-text-color, #212121);
    font-family: var(--paper-font-body1_-_font-family, Roboto, Helvetica, Arial, sans-serif);
  }
  .backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    box-sizing: border-box;
  }
  .panel {
    background: var(--card-background-color, #fff);
    border-radius: 16px;
    width: 100%;
    max-width: 560px;
    max-height: min(88vh, 780px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }
  .panel.wide {
    max-width: 760px;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
  }
  .title {
    font-size: 1.1rem;
    font-weight: 600;
  }
  .x {
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 1.1rem;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 8px;
  }
  .x:hover {
    background: var(--secondary-background-color, #f0f0f0);
  }
  .body {
    overflow: auto;
    padding: 12px 16px 16px;
  }
  .foot {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding: 10px 16px;
    border-top: 1px solid var(--divider-color, #e0e0e0);
  }
  .btn {
    border: 1px solid var(--divider-color, #ccc);
    background: var(--secondary-background-color, #f4f4f4);
    color: inherit;
    border-radius: 10px;
    padding: 8px 14px;
    font-size: 0.9rem;
    cursor: pointer;
  }
  .btn.primary {
    background: var(--primary-color, #03a9f4);
    color: #fff;
    border-color: transparent;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .err {
    margin-top: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgba(220, 38, 38, 0.12);
    color: #b91c1c;
    font-size: 0.85rem;
  }
  .ok {
    margin-top: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgba(22, 163, 74, 0.12);
    color: #166534;
    font-size: 0.85rem;
  }
  .empty {
    padding: 24px 8px;
    text-align: center;
    color: var(--secondary-text-color, #727272);
  }
`;var z=class extends _{constructor(){super(...arguments);this._busy=!1;this._error="";this._onKey=t=>{t.key==="Escape"&&this._close()}}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._onKey),this._sch=JSON.parse(JSON.stringify(this.info.schedule))}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._onKey)}_close(){this.dispatchEvent(new CustomEvent("closed")),this.remove()}get _limits(){let t=this.info.settings;return{min:t.min_target,max:t.max_target}}_patch(t,i){this._sch={...this._sch,slots:this._sch.slots.map((r,s)=>s===t?{...r,...i}:r)}}_toggleDay(t,i){let r=this._sch.slots[t].days;this._patch(t,{days:r.includes(i)?r.filter(s=>s!==i):[...r,i].sort((s,o)=>s-o)})}_bumpTemp(t,i){let{min:r,max:s}=this._limits;this._patch(t,{temp:w(this._sch.slots[t].temp+i*.5,r,s,.5)})}_add(){this._sch={...this._sch,slots:[...this._sch.slots,Zt(this.info.settings.default_target)]}}_remove(t){this._sch={...this._sch,slots:this._sch.slots.filter((i,r)=>r!==t)}}_duplicate(t){let i=JSON.parse(JSON.stringify(this._sch.slots[t]));this._sch={...this._sch,slots:[...this._sch.slots.slice(0,t+1),i,...this._sch.slots.slice(t+1)]}}async _save(){let t=$t(this._sch);if(t.length){this._error=t[0];return}this._busy=!0,this._error="";try{await this.hass.callWS({type:"termostato_riscaldamento/schedule",entry_id:this.info.entry_id,schedule:this._sch}),this.dispatchEvent(new CustomEvent("saved")),this._close()}catch(i){this._error=`Impossibile salvare: ${i instanceof Error?i.message:i?.message??String(i)}`}finally{this._busy=!1}}_week(){let t=Jt(this._sch.slots);return c`
      <div class="week" aria-label="Vista della settimana">
        ${t.map((i,r)=>c`
            <div class="wd"><span>${ot[r]}</span>
              <div class="wbar">${i.map(s=>c`<i title="${f(s.temp)} °C" style="left:${s.from/1440*100}%;width:${(s.to-s.from)/1440*100}%;background:${te(s.temp)}"></i>`)}</div>
            </div>`)}
        <div class="wd axis"><span></span><div class="wax"><b>0</b><b>6</b><b>12</b><b>18</b><b>24</b></div></div>
        <div class="legend">Più scuro = più caldo. Fuori dalle fasce: antigelo ${f(this.info.settings.antigelo)} °C.</div>
      </div>`}render(){if(!this._sch)return p;let t=$t(this._sch);return c`
      <div class="backdrop" @click=${i=>i.target===i.currentTarget&&this._close()}>
        <div class="panel" role="dialog" aria-modal="true" aria-label="Programma termostato">
          <div class="head">
            <div class="title">Programma settimanale</div>
            <button class="x" aria-label="Chiudi" @click=${()=>this._close()}>✕</button>
          </div>
          <div class="body">
            <div class="row top">
              <div class="t"><div class="lab">Programma attivo</div>
                <div class="hint">Alle ore indicate il termostato va alla temperatura della fascia; fuori fascia va all'antigelo. Se lo cambi a mano, il programma riprende alla fascia successiva.</div></div>
              <button class=${this._sch.enabled?"sw on":"sw"} role="switch" aria-checked=${this._sch.enabled?"true":"false"} aria-label="Programma attivo" @click=${()=>this._sch={...this._sch,enabled:!this._sch.enabled}}><span class="knob"></span></button>
            </div>

            ${this._week()}

            <div class="sec">Fasce</div>
            ${this._sch.slots.length===0?c`<div class="empty">Nessuna fascia: aggiungine una.</div>`:p}
            ${this._sch.slots.map((i,r)=>{let s=yt(i);return c`
                <div class="slot ${s?"bad":""}">
                  <div class="days" role="group" aria-label="Giorni">
                    ${Wt.map((o,n)=>c`<button class=${i.days.includes(n)?"day on":"day"} aria-label=${ot[n]} aria-pressed=${i.days.includes(n)?"true":"false"} @click=${()=>this._toggleDay(r,n)}>${o}</button>`)}
                  </div>
                  <div class="times">
                    <label>Da<input type="time" .value=${i.start} @change=${o=>this._patch(r,{start:o.target.value})} /></label>
                    <label>A<input type="time" .value=${i.end} @change=${o=>this._patch(r,{end:o.target.value})} /></label>
                    <div class="tmp" role="group" aria-label="Temperatura della fascia">
                      <button class="st" aria-label="Meno caldo" @click=${()=>this._bumpTemp(r,-1)}>−</button>
                      <b>${f(i.temp)} °C</b>
                      <button class="st" aria-label="Più caldo" @click=${()=>this._bumpTemp(r,1)}>+</button>
                    </div>
                  </div>
                  <div class="foot2">
                    <div class="sum">${s??`${Qt(i.days)}${Xt(i)?" \xB7 finisce il giorno dopo":""}`}</div>
                    <button class="mini" aria-label="Duplica fascia" @click=${()=>this._duplicate(r)}>⧉</button>
                    <button class="mini del" aria-label="Elimina fascia" @click=${()=>this._remove(r)}>🗑</button>
                  </div>
                </div>`})}
            <button class="btn add" @click=${()=>this._add()}>+ Aggiungi fascia</button>

            ${t.length?c`<div class="err">${t[0]}</div>`:p}
            ${this._error?c`<div class="err">${this._error}</div>`:p}
          </div>
          <div class="foot">
            <button class="btn" @click=${()=>this._close()}>Annulla</button>
            <button class="btn primary" ?disabled=${this._busy||t.length>0} @click=${()=>void this._save()}>Salva</button>
          </div>
        </div>
      </div>
    `}static{this.styles=[D,y`
      .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 0 12px; }
      .t { flex: 1; min-width: 0; }
      .lab { font-size: 0.95rem; font-weight: 500; }
      .hint { font-size: 0.78rem; color: var(--secondary-text-color, #727272); margin-top: 2px; line-height: 1.3; }
      .sw { flex: none; width: 52px; height: 30px; border-radius: 15px; border: 0; background: var(--disabled-color, #bdbdbd); position: relative; cursor: pointer; transition: background 0.2s; }
      .sw.on { background: var(--primary-color, #03a9f4); }
      .sw .knob { position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
      .sw.on .knob { transform: translateX(22px); }
      .week { margin: 4px 0 12px; padding: 10px 12px; border-radius: 12px; background: var(--secondary-background-color, #f2f2f2); }
      .wd { display: flex; align-items: center; gap: 8px; margin: 3px 0; font-size: 0.75rem; }
      .wd span { width: 28px; color: var(--secondary-text-color, #727272); }
      .wbar { position: relative; flex: 1; height: 12px; border-radius: 6px; background: rgba(127, 127, 127, 0.18); overflow: hidden; }
      .wbar i { position: absolute; top: 0; bottom: 0; }
      .wax { flex: 1; display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--secondary-text-color, #727272); }
      .wax b { font-weight: 400; }
      .legend { margin-top: 6px; font-size: 0.72rem; color: var(--secondary-text-color, #727272); }
      .sec { font-weight: 600; font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--secondary-text-color, #727272); margin: 8px 0 6px; }
      .slot { padding: 10px; margin-bottom: 8px; border: 1px solid var(--divider-color, #ddd); border-radius: 12px; }
      .slot.bad { border-color: #dc2626; }
      .days { display: flex; gap: 6px; margin-bottom: 8px; }
      .day { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--divider-color, #ccc); background: transparent; color: inherit; font-size: 0.9rem; cursor: pointer; }
      .day.on { background: var(--primary-color, #03a9f4); color: #fff; border-color: transparent; }
      .times { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; }
      .times label { display: flex; flex-direction: column; font-size: 0.72rem; color: var(--secondary-text-color, #727272); gap: 2px; }
      .times input { min-height: 44px; box-sizing: border-box; padding: 6px 8px; border-radius: 10px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: var(--primary-text-color, #212121); font-size: 1rem; }
      .tmp { display: flex; align-items: center; gap: 6px; margin-left: auto; }
      .tmp b { min-width: 64px; text-align: center; font-size: 1rem; }
      .st { width: 44px; height: 44px; border-radius: 12px; border: 1px solid var(--divider-color, #ccc); background: var(--secondary-background-color, #f4f4f4); color: inherit; font-size: 1.3rem; cursor: pointer; }
      .foot2 { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
      .sum { flex: 1; font-size: 0.78rem; color: var(--secondary-text-color, #727272); }
      .slot.bad .sum { color: #b91c1c; }
      .mini { border: 1px solid var(--divider-color, #ccc); background: transparent; color: inherit; border-radius: 10px; width: 44px; height: 44px; cursor: pointer; font-size: 1rem; }
      .add { min-height: 44px; }
    `]}};u([x({attribute:!1})],z.prototype,"hass",2),u([x({attribute:!1})],z.prototype,"info",2),u([g()],z.prototype,"_sch",2),u([g()],z.prototype,"_busy",2),u([g()],z.prototype,"_error",2);customElements.get("termostato-schedule-dialog")||customElements.define("termostato-schedule-dialog",z);var Ae=a=>a<60?`${a} min`:a%60===0?`${a/60} h`:`${Math.floor(a/60)} h ${a%60} min`,E=class extends _{constructor(){super(...arguments);this._temp=20.5;this._custom="";this._busy=!1;this._error="";this._onKey=t=>{t.key==="Escape"&&this._close()}}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._onKey);let t=this.info.settings,i=this.info.target!==null&&this.info.target>t.antigelo+.01&&this.info.hvac_mode!=="off";this._temp=w(i&&this.info.target!==null?this.info.target:t.default_target,t.min_target,t.max_target,.5)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._onKey)}_close(){this.dispatchEvent(new CustomEvent("closed")),this.remove()}_bump(t){let i=this.info.settings;this._temp=w(this._temp+t*.5,i.min_target,i.max_target,.5)}async _start(t){let i=this.info.settings.timer_max_hours*60;if(!Number.isInteger(t)||t<0||t>i){this._error=`Scegli un tempo tra 1 minuto e ${this.info.settings.timer_max_hours} ore.`;return}this._busy=!0,this._error="";try{let r={type:"termostato_riscaldamento/timer",entry_id:this.info.entry_id,minutes:t};t>0&&(r.temperature=this._temp),await this.hass.callWS(r),this.dispatchEvent(new CustomEvent("saved")),this._close()}catch(r){this._error=`Impossibile avviare il timer: ${r instanceof Error?r.message:r?.message??String(r)}`}finally{this._busy=!1}}render(){if(!this.info)return p;let t=this.info.timer_until?Date.parse(this.info.timer_until):null,i=Date.now(),r=this.info.settings.timer_max_hours*60,s=Number(this._custom.replace(",",".")),o=Yt.filter(n=>n<=r);return c`
      <div class="backdrop" @click=${n=>n.target===n.currentTarget&&this._close()}>
        <div class="panel" role="dialog" aria-modal="true" aria-label="Timer termostato">
          <div class="head">
            <div class="title">Timer</div>
            <button class="x" aria-label="Chiudi" @click=${()=>this._close()}>✕</button>
          </div>
          <div class="body">
            ${t!==null&&t>i?c`<div class="active">Timer in corso: ${f(this.info.timer_temp)} °C fino a ${Y(t,i)} (tra ${xt(t-i)}).
                  <div><button class="btn" ?disabled=${this._busy} @click=${()=>void this._start(0)}>Annulla il timer</button></div></div>`:p}
            <div class="lab">Temperatura</div>
            <div class="tmp">
              <button class="st" aria-label="Meno caldo" @click=${()=>this._bump(-1)}>−</button>
              <b>${f(this._temp)} °C</b>
              <button class="st" aria-label="Più caldo" @click=${()=>this._bump(1)}>+</button>
            </div>
            <div class="lab">Scalda per</div>
            <div class="chips">
              ${o.map(n=>c`<button class="chip" ?disabled=${this._busy} @click=${()=>void this._start(n)}>${Ae(n)}</button>`)}
            </div>
            <div class="custom">
              <input type="text" inputmode="numeric" placeholder="minuti" .value=${this._custom} @input=${n=>this._custom=n.target.value} aria-label="Minuti" />
              <button class="btn primary" ?disabled=${this._busy||!(s>=1)} @click=${()=>void this._start(Math.round(s))}>Avvia</button>
            </div>
            <div class="hint">Finito il tempo il termostato torna al programma, se è attivo, altrimenti all'antigelo (${f(this.info.settings.antigelo)} °C). Durata massima ${this.info.settings.timer_max_hours} ore, modificabile nelle preferenze.</div>
            ${this._error?c`<div class="err">${this._error}</div>`:p}
          </div>
        </div>
      </div>
    `}static{this.styles=[D,y`
      .lab { font-size: 0.95rem; font-weight: 500; margin: 6px 0 8px; }
      .tmp { display: flex; align-items: center; justify-content: center; gap: 18px; margin-bottom: 12px; }
      .tmp b { min-width: 100px; text-align: center; font-size: 1.6rem; }
      .st { width: 52px; height: 52px; border-radius: 50%; border: 1px solid var(--divider-color, #ccc); background: var(--secondary-background-color, #f4f4f4); color: inherit; font-size: 1.6rem; cursor: pointer; }
      .chips { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .chip { min-height: 52px; padding: 12px 6px; border-radius: 12px; border: 1px solid var(--divider-color, #ccc); background: var(--secondary-background-color, #f4f4f4); color: inherit; font-size: 1rem; cursor: pointer; }
      .custom { display: flex; gap: 8px; margin: 12px 0; }
      .custom input { flex: 1; min-height: 48px; box-sizing: border-box; padding: 9px 10px; border-radius: 10px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: inherit; font-size: 1rem; }
      .hint { font-size: 0.78rem; color: var(--secondary-text-color, #727272); line-height: 1.35; }
      .active { padding: 10px 12px; margin-bottom: 14px; border-radius: 12px; background: rgba(96, 165, 250, 0.16); font-size: 0.9rem; }
      .active .btn { margin-top: 8px; min-height: 44px; }
    `]}};u([x({attribute:!1})],E.prototype,"hass",2),u([x({attribute:!1})],E.prototype,"info",2),u([g()],E.prototype,"_temp",2),u([g()],E.prototype,"_custom",2),u([g()],E.prototype,"_busy",2),u([g()],E.prototype,"_error",2);customElements.get("termostato-timer-dialog")||customElements.define("termostato-timer-dialog",E);var kt={block_temperature:{title:"Temperature",what:"Le temperature che il termostato usa: l'antigelo quando nessuno \xE8 in fascia, i limiti dell'obiettivo e il valore da cui si parte.",when:"Cambiale se l'antigelo ti sembra troppo basso o se vuoi evitare obiettivi troppo alti o troppo bassi dai pulsanti + e \u2212."},antigelo:{title:"Temperatura antigelo",what:"La temperatura a cui il termostato si porta fuori dal programma, a timer finito e a casa vuota.",when:"Protegge tubi e muri dal gelo senza scaldare la casa.",suggested:"5 \xB0C. Sali a 7-8 \xB0C se hai muri o tubi esposti."},min_target:{title:"Obiettivo minimo",what:"Il valore pi\xF9 basso che puoi scegliere con \u2212 o nel timer.",when:"Evita di scendere per sbaglio sotto una temperatura che non vuoi.",suggested:"10 \xB0C."},max_target:{title:"Obiettivo massimo",what:"Il valore pi\xF9 alto che puoi scegliere con + o nel timer.",when:"Evita sprechi se il tablet viene toccato per sbaglio.",suggested:"23 \xB0C."},default_target:{title:"Obiettivo predefinito",what:"La temperatura usata quando passi da Spento a Manuale o avvii un timer senza sceglierne una.",when:"\xC8 il valore di comfort di tutti i giorni.",suggested:"20,5 \xB0C."},frost_keep_heat:{title:"Fuori programma resta acceso all'antigelo",what:"Acceso: fuori fascia il termostato resta in modalit\xE0 riscaldamento ma con l'obiettivo all'antigelo, cos\xEC protegge dal gelo. Spento: il termostato viene spento del tutto.",when:"Lascialo acceso se vuoi la protezione dal gelo anche d'inverno a casa vuota.",suggested:"Acceso."},block_timer:{title:"Timer",what:"Il timer scalda alla temperatura scelta per un tempo e poi torna al programma, oppure all'antigelo se il programma \xE8 spento.",when:"Per una serata fuori programma o per scaldare prima di rientrare."},timer_max_hours:{title:"Durata massima del timer",what:"Il timer non pu\xF2 durare pi\xF9 di questo. Vale anche come sicurezza: se qualcuno scalda a mano a casa vuota, dopo questo tempo il termostato torna all'antigelo.",when:"Riduci il valore se vuoi pi\xF9 sicurezza contro le dimenticanze.",suggested:"6 ore."},block_away:{title:"Casa vuota",what:"Quando nessuno \xE8 in casa il termostato va all'antigelo e il programma non lo scalda. Al rientro il programma riprende.",when:"Per non scaldare una casa vuota. Si pu\xF2 sempre scaldare a mano, anche a casa vuota."},away_setback:{title:"Abbassa a casa vuota",what:"Porta il termostato all'antigelo dopo il tempo indicato dall'uscita di tutti. Serve il sensore \xABCasa vuota\xBB tra i collegamenti.",when:"Spegnilo per il periodo in cui tieni la casa calda anche da vuota.",suggested:"Acceso."},away_minutes:{title:"Minuti di casa vuota",what:"Quanto deve restare vuota la casa prima di abbassare. Evita che un'uscita breve spenga il riscaldamento.",when:"Allungalo se esci spesso per commissioni brevi.",suggested:"30 minuti."},block_notify:{title:"Annunci vocali",what:"Il termostato annuncia a voce quello che fa: inizio e fine del timer, cambi del programma, casa vuota e rientro.",when:"Utile con Alexa. Lascia il servizio vuoto per non avere annunci."},notify_enabled:{title:"Annunci attivi",what:"Interruttore generale degli annunci.",when:"Spegnilo di notte o per gli ospiti.",suggested:"Acceso."},notify_service:{title:"Servizio di annuncio",what:"Il servizio di Home Assistant che pronuncia il messaggio, scritto come notify.nome.",when:"Con l'integrazione Alexa Media Player \xE8 notify.alexa_media."},notify_targets:{title:"Altoparlanti",what:"Quali altoparlanti pronunciano gli annunci. Se non ne scegli nessuno decide il servizio.",when:"Scegli le stanze dove vuoi sentire gli annunci."},block_boiler:{title:"Programma della caldaia",what:"Il programma settimanale della caldaia la spegne a fine fascia anche se il timer del termostato \xE8 ancora in corso. Qui scegli di sospenderlo finch\xE9 dura il timer.",when:"Serve se la caldaia ha un suo programma settimanale e usi il timer per scaldare fuori fascia."},boiler_program_pause:{title:"Sospendi il programma col timer",what:"All'avvio del timer spegne l'interruttore del programma settimanale della caldaia; a fine timer, o se lo annulli, lo riaccende. Lo riaccende solo se l'ha spento lui: se era gi\xE0 spento a mano non lo tocca.",when:"Accendilo se la caldaia si spegne a fine fascia con il timer ancora in corso.",suggested:"Acceso, se la caldaia ha un programma settimanale."},boiler_program_switch:{title:"Interruttore del programma",what:"L'interruttore (switch) che accende e spegne il programma settimanale della caldaia, per esempio switch.casale_cronotermostato_settimanale.",when:"Obbligatorio se la sospensione \xE8 accesa."},boiler_climate:{title:"Caldaia da accendere",what:"La caldaia (climate) da accendere all'avvio del timer se \xE8 spenta e la stanza \xE8 sotto la temperatura del timer. Senza programma la caldaia non parte da sola.",when:"Indicala se vuoi che il timer accenda anche la caldaia spenta. Facoltativo."},boiler_stop_after_timer:{title:"A fine timer spegni la caldaia",what:"Se il timer ha acceso la caldaia (era spenta), a fine timer la spegne di nuovo. Riattivare il programma settimanale fuori fascia non la ferma, e in standby ripartirebbe da sola quando il puffer si raffredda. Una caldaia gi\xE0 accesa prima del timer non viene mai spenta.",when:"Lascialo acceso, a meno che un timer lungo possa finire dentro una fascia del programma: l\xEC la caldaia resterebbe spenta fino alla fascia successiva.",suggested:"Acceso."},block_puffer:{title:"Riscaldamento e puffer",what:"Fa partire il riscaldamento solo quando il puffer \xE8 abbastanza caldo. Sotto la temperatura minima il termostato resta spento, anche se il programma lo accende o lo chiedi tu a mano; quando il puffer si scalda riparte da solo con l'obiettivo di prima.",when:"Serve se la pompa dei radiatori gira quando il termostato chiama calore: con il puffer freddo farebbe solo circolare acqua fredda e raffredderebbe l'accumulo."},puffer_gate:{title:"Il riscaldamento parte solo col puffer caldo",what:"Se acceso, il termostato viene spento finch\xE9 la sonda del puffer \xE8 sotto la temperatura minima, e riacceso quando supera minima pi\xF9 isteresi. Se la sonda non risponde il blocco non interviene mai: un guasto non lascia la casa al freddo.",when:"Accendilo quando il puffer pu\xF2 essere freddo, per esempio con la caldaia spenta o appena riaccesa.",suggested:"Acceso, con la sonda del pozzetto \xABminima attivazione pompa circuito\xBB."},puffer_sensor:{title:"Sonda del puffer",what:"Il sensore di temperatura (sensor.nome) del puffer che decide se il riscaldamento pu\xF2 partire.",when:"Obbligatorio se il blocco \xE8 acceso. Sul CLESS \xE8 la sonda nel pozzetto b di sinistra (lato impianto)."},puffer_min_temp:{title:"Temperatura minima del puffer",what:"Sotto questa temperatura il termostato non pu\xF2 far partire il riscaldamento.",when:"Imposta un valore poco sopra la temperatura minima utile per i radiatori.",suggested:"Tra 35 e 45 \xB0C, a seconda dei radiatori."},puffer_hysteresis:{title:"Isteresi",what:"Dopo il blocco il riscaldamento riparte solo quando il puffer supera la temperatura minima di tanti gradi. Evita accensioni e spegnimenti ripetuti vicino alla soglia.",when:"Aumentala se il termostato si accende e si spegne troppo spesso.",suggested:"2 \xB0C."},block_links:{title:"Collegamenti",what:"Le entit\xE0 di Home Assistant che il termostato usa: il termostato da comandare, un sensore di temperatura e gli indicatori di casa vuota e ospiti.",when:"Di solito si impostano una volta sola."},climate:{title:"Termostato",what:"Il termostato che viene comandato (climate). \xC8 l'unico collegamento obbligatorio.",when:"Cambialo solo se sostituisci il termostato."},temperature_sensor:{title:"Sensore di temperatura",what:"Un sensore ambiente da mostrare al posto di quello del termostato.",when:"Utile se hai una sonda pi\xF9 precisa in un'altra stanza. Facoltativo."},away_entity:{title:"Casa vuota",what:"Un'entit\xE0 accesa quando nessuno \xE8 in casa (per esempio il sensore della caldaia \xABnessuno in casa\xBB).",when:"Serve all'abbassamento a casa vuota. Facoltativo."},guests_entity:{title:"Ospiti",what:"Un'entit\xE0 accesa quando ci sono ospiti: con gli ospiti la casa non \xE8 considerata vuota.",when:"Per chi non ha un telefono tracciato. Facoltativo."}};var Se={antigelo:{key:"antigelo",label:"Temperatura antigelo",unit:"\xB0C",min:5,max:15,step:.5},min_target:{key:"min_target",label:"Obiettivo minimo",unit:"\xB0C",min:5,max:35,step:.5},max_target:{key:"max_target",label:"Obiettivo massimo",unit:"\xB0C",min:5,max:35,step:.5},default_target:{key:"default_target",label:"Obiettivo predefinito",unit:"\xB0C",min:5,max:35,step:.5},timer_max_hours:{key:"timer_max_hours",label:"Durata massima del timer",unit:"h",min:1,max:24,step:1},away_minutes:{key:"away_minutes",label:"Minuti di casa vuota prima di abbassare",unit:"min",min:0,max:1440,step:5},puffer_min_temp:{key:"puffer_min_temp",label:"Temperatura minima del puffer",unit:"\xB0C",min:20,max:70,step:.5},puffer_hysteresis:{key:"puffer_hysteresis",label:"Isteresi",unit:"\xB0C",min:.5,max:10,step:.5}},Ee=[{id:"temperature",icon:"mdi:thermometer",title:"Temperature",helpId:"block_temperature"},{id:"timer",icon:"mdi:timer-outline",title:"Timer",helpId:"block_timer"},{id:"away",icon:"mdi:home-off",title:"Casa vuota",helpId:"block_away"},{id:"notify",icon:"mdi:bullhorn-outline",title:"Annunci vocali",helpId:"block_notify"},{id:"boiler",icon:"mdi:fireplace",title:"Programma della caldaia",helpId:"block_boiler"},{id:"puffer",icon:"mdi:pump",title:"Riscaldamento e puffer",helpId:"block_puffer"},{id:"links",icon:"mdi:link-variant",title:"Collegamenti",helpId:"block_links"}],$=class extends _{constructor(){super(...arguments);this._open="temperature";this._help=null;this._busy=!1;this._error="";this._onKey=t=>{t.key==="Escape"&&(this._help?this._help=null:this._close())}}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._onKey),this._s={...this.info.settings,notify_targets:[...this.info.settings.notify_targets]},this._src={climate:this.info.sources.climate??"",temperature_sensor:this.info.sources.temperature_sensor??"",away_entity:this.info.sources.away_entity??"",guests_entity:this.info.sources.guests_entity??""}}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._onKey)}_close(){this.dispatchEvent(new CustomEvent("closed")),this.remove()}_set(t,i){this._s={...this._s,[t]:i}}_step(t,i){this._set(t.key,w(this._s[t.key]+i*t.step,t.min,t.max,t.step))}_typed(t,i){let r=i.target.value.replace(",","."),s=Number(r);if(r.trim()===""||!Number.isFinite(s)){i.target.value=String(this._s[t.key]).replace(".",",");return}this._set(t.key,w(s,t.min,t.max,t.step))}_toggleTarget(t){let i=this._s.notify_targets;this._set("notify_targets",i.includes(t)?i.filter(r=>r!==t):[...i,t])}async _save(){let t=wt(this._s);if(t.length){this._error=t[0];return}if(!this._src.climate){this._error="Il termostato \xE8 obbligatorio.";return}this._busy=!0,this._error="";try{await this.hass.callWS({type:"termostato_riscaldamento/update",entry_id:this.info.entry_id,settings:this._s,sources:this._src}),this.dispatchEvent(new CustomEvent("saved")),this._close()}catch(i){this._error=`Impossibile salvare: ${i instanceof Error?i.message:i?.message??String(i)}`}finally{this._busy=!1}}_helpBtn(t){return c`<button class="i" aria-label="Spiegazione: ${kt[t]?.title??t}" @click=${i=>{i.stopPropagation(),this._help=t}}>i</button>`}_numRow(t){let i=Se[t];return c`
      <div class="row">
        <div class="t"><span class="lab">${i.label}</span>${this._helpBtn(t)}</div>
        <div class="num">
          <button class="st" aria-label="Diminuisci" @click=${()=>this._step(i,-1)}>−</button>
          <input type="text" inputmode="decimal" .value=${String(this._s[t]).replace(".",",")} aria-label=${i.label} @change=${r=>this._typed(i,r)} />
          <span class="unit">${i.unit}</span>
          <button class="st" aria-label="Aumenta" @click=${()=>this._step(i,1)}>+</button>
        </div>
      </div>`}_boolRow(t,i){let r=this._s[t];return c`
      <div class="row">
        <div class="t"><span class="lab">${i}</span>${this._helpBtn(t)}</div>
        <button class=${r?"sw on":"sw"} role="switch" aria-checked=${r?"true":"false"} aria-label=${i} @click=${()=>this._set(t,!r)}><span class="knob"></span></button>
      </div>`}_entityRow(t,i,r,s){let o=Object.keys(this.hass.states).filter(n=>r.includes(n.split(".")[0]));return c`
      <div class="row col">
        <div class="t"><span class="lab">${i}</span> <span class="opt">${s?"obbligatorio":"facoltativo"}</span>${this._helpBtn(t)}</div>
        <input class="txt" list=${`dl-${t}`} .value=${this._src[t]} placeholder=${r.join(" / ")+".nome"} @change=${n=>{this._src={...this._src,[t]:n.target.value.trim()}}} />
        <datalist id=${`dl-${t}`}>${o.map(n=>c`<option value=${n}></option>`)}</datalist>
        ${this._src[t]&&!this.hass.states[this._src[t]]?c`<div class="warn">Entità non trovata in Home Assistant.</div>`:p}
      </div>`}_boilerRow(t,i,r,s,o="serve se la sospensione \xE8 accesa"){let n=Object.keys(this.hass.states).filter(d=>d.startsWith(`${r}.`)),l=this._s[t];return c`
      <div class="row col">
        <div class="t"><span class="lab">${i}</span> <span class="opt">${s?o:"facoltativo"}</span>${this._helpBtn(t)}</div>
        <input class="txt" list=${`dl-${t}`} .value=${l} placeholder=${`${r}.nome`} @change=${d=>this._set(t,d.target.value.trim())} />
        <datalist id=${`dl-${t}`}>${n.map(d=>c`<option value=${d}></option>`)}</datalist>
        ${l&&!this.hass.states[l]?c`<div class="warn">Entità non trovata in Home Assistant.</div>`:p}
      </div>`}_summary(t){let i=this._s;switch(t){case"temperature":return`Antigelo ${f(i.antigelo)} \xB0C \xB7 da ${f(i.min_target)} a ${f(i.max_target)} \xB0C`;case"timer":return`Al massimo ${i.timer_max_hours} h`;case"away":return i.away_setback?`Abbassa dopo ${i.away_minutes} min`:"Disattivato";case"notify":return!i.notify_enabled||!i.notify_service?"Nessun annuncio":i.notify_targets.length?`${i.notify_targets.length} altoparlanti`:i.notify_service;case"boiler":return i.boiler_program_pause?"Sospeso durante il timer":"Non gestito";case"puffer":return i.puffer_gate?`Parte sopra ${f(i.puffer_min_temp)} \xB0C`:"Non gestito";default:return"Termostato e sensori"}}_blockBody(t){switch(t){case"temperature":return c`${this._numRow("antigelo")}${this._numRow("min_target")}${this._numRow("max_target")}${this._numRow("default_target")}${this._boolRow("frost_keep_heat","Fuori programma resta acceso all'antigelo")}`;case"timer":return c`${this._numRow("timer_max_hours")}`;case"away":return c`${this._boolRow("away_setback","Abbassa a casa vuota")}${this._numRow("away_minutes")}${this._src.away_entity?p:c`<div class="warn">Indica il sensore «Casa vuota» tra i collegamenti perché funzioni.</div>`}`;case"notify":{let i=Object.values(this.hass.states).filter(r=>r.entity_id.startsWith("media_player."));return c`
          ${this._boolRow("notify_enabled","Annunci attivi")}
          <div class="row col">
            <div class="t"><span class="lab">Servizio di annuncio</span>${this._helpBtn("notify_service")}</div>
            <input class="txt" .value=${this._s.notify_service} placeholder="notify.alexa_media" @change=${r=>this._set("notify_service",r.target.value.trim())} />
          </div>
          <div class="row col">
            <div class="t"><span class="lab">Altoparlanti</span>${this._helpBtn("notify_targets")}</div>
            <div class="chips">
              ${i.length===0?c`<span class="opt">Nessun media player trovato.</span>`:p}
              ${i.map(r=>c`<button class=${this._s.notify_targets.includes(r.entity_id)?"chip on":"chip"} aria-pressed=${this._s.notify_targets.includes(r.entity_id)?"true":"false"} @click=${()=>this._toggleTarget(r.entity_id)}>${String(r.attributes.friendly_name??r.entity_id)}</button>`)}
            </div>
          </div>`}case"boiler":return c`${this._boolRow("boiler_program_pause","Sospendi il programma col timer")}${this._boilerRow("boiler_program_switch","Interruttore del programma","switch",!0)}${this._boilerRow("boiler_climate","Caldaia da accendere","climate",!1)}${this._boolRow("boiler_stop_after_timer","A fine timer spegni la caldaia")}`;case"puffer":return c`${this._boolRow("puffer_gate","Parte solo col puffer caldo")}${this._boilerRow("puffer_sensor","Sonda del puffer","sensor",!0,"serve se il blocco \xE8 acceso")}${this._numRow("puffer_min_temp")}${this._numRow("puffer_hysteresis")}`;default:return c`${this._entityRow("climate","Termostato",["climate"],!0)}${this._entityRow("temperature_sensor","Sensore di temperatura",["sensor"],!1)}${this._entityRow("away_entity","Casa vuota",["binary_sensor","input_boolean"],!1)}${this._entityRow("guests_entity","Ospiti in casa",["binary_sensor","input_boolean"],!1)}`}}_helpOverlay(){let t=this._help?kt[this._help]:void 0;return t?c`
      <div class="hback" @click=${i=>i.target===i.currentTarget&&(this._help=null)}>
        <div class="hbox" role="dialog" aria-modal="true" aria-label=${t.title}>
          <div class="ht">${t.title}</div>
          <div class="hs">Cosa fa</div><p>${t.what}</p>
          <div class="hs">Quando serve</div><p>${t.when}</p>
          ${t.suggested?c`<div class="hs">Valore consigliato</div><p>${t.suggested}</p>`:p}
          <button class="btn primary" @click=${()=>this._help=null}>Ho capito</button>
        </div>
      </div>`:p}render(){if(!this.hass||!this._s)return p;let t=wt(this._s);return c`
      <div class="backdrop" @click=${i=>i.target===i.currentTarget&&this._close()}>
        <div class="panel" role="dialog" aria-modal="true" aria-label="Preferenze termostato">
          <div class="head">
            <div class="title">Preferenze del termostato</div>
            <button class="x" aria-label="Chiudi" @click=${()=>this._close()}>✕</button>
          </div>
          <div class="body">
            ${Ee.map(i=>{let r=this._open===i.id;return c`
                <section class="block ${r?"open":""}">
                  <div class="bh" role="button" tabindex="0" aria-expanded=${r?"true":"false"} @click=${()=>this._open=r?null:i.id} @keydown=${s=>{(s.key==="Enter"||s.key===" ")&&(this._open=r?null:i.id)}}>
                    <ha-icon icon=${i.icon}></ha-icon>
                    <div class="bt"><div class="bn">${i.title}</div><div class="bs">${this._summary(i.id)}</div></div>
                    ${this._helpBtn(i.helpId)}
                    <span class="chev">${r?"\u25BE":"\u25B8"}</span>
                  </div>
                  ${r?c`<div class="bb">${this._blockBody(i.id)}</div>`:p}
                </section>`})}
            ${t.length?c`<div class="err">${t[0]}</div>`:p}
            ${this._error?c`<div class="err">${this._error}</div>`:p}
          </div>
          <div class="foot">
            <button class="btn" @click=${()=>this._close()}>Annulla</button>
            <button class="btn primary" ?disabled=${this._busy||t.length>0} @click=${()=>void this._save()}>Salva</button>
          </div>
          ${this._helpOverlay()}
        </div>
      </div>
    `}static{this.styles=[D,y`
      .panel { position: relative; }
      .block { border: 1px solid var(--divider-color, #ddd); border-radius: 14px; margin-bottom: 8px; overflow: hidden; }
      .block.open { border-color: var(--primary-color, #03a9f4); }
      .bh { display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 6px 12px; cursor: pointer; }
      .bh ha-icon { --mdc-icon-size: 24px; color: var(--secondary-text-color, #727272); flex: none; }
      .bt { flex: 1; min-width: 0; }
      .bn { font-size: 1rem; font-weight: 600; }
      .bs { font-size: 0.78rem; color: var(--secondary-text-color, #727272); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .chev { width: 18px; text-align: center; color: var(--secondary-text-color, #727272); }
      .bb { padding: 0 12px 8px; border-top: 1px solid var(--divider-color, #eee); }
      .i { flex: none; width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--divider-color, #ccc); background: transparent; color: var(--secondary-text-color, #727272); font-size: 0.95rem; font-style: italic; font-family: Georgia, serif; cursor: pointer; margin-left: 6px; }
      .row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 0; border-top: 1px solid var(--divider-color, #eee); }
      .row:first-child { border-top: 0; }
      .row.col { flex-direction: column; align-items: stretch; gap: 6px; }
      .t { flex: 1; min-width: 0; display: flex; align-items: center; flex-wrap: wrap; }
      .lab { font-size: 0.93rem; }
      .opt { font-size: 0.7rem; color: var(--secondary-text-color, #727272); margin-left: 6px; }
      .warn { font-size: 0.78rem; color: #d97706; padding: 6px 0; }
      .txt { width: 100%; box-sizing: border-box; min-height: 44px; padding: 8px 10px; border-radius: 10px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: inherit; font-size: 0.95rem; }
      .num { display: flex; align-items: center; gap: 4px; flex: none; }
      .num input { width: 66px; min-height: 44px; box-sizing: border-box; text-align: center; padding: 6px 4px; border-radius: 10px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: inherit; font-size: 1rem; }
      .unit { width: 28px; font-size: 0.8rem; color: var(--secondary-text-color, #727272); }
      .st { width: 44px; height: 44px; border-radius: 12px; border: 1px solid var(--divider-color, #ccc); background: var(--secondary-background-color, #f4f4f4); color: inherit; font-size: 1.3rem; cursor: pointer; }
      .sw { flex: none; width: 52px; height: 30px; border-radius: 15px; border: 0; background: var(--disabled-color, #bdbdbd); position: relative; cursor: pointer; transition: background 0.2s; }
      .sw.on { background: var(--primary-color, #03a9f4); }
      .sw .knob { position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
      .sw.on .knob { transform: translateX(22px); }
      .chips { display: flex; flex-wrap: wrap; gap: 8px; }
      .chip { min-height: 44px; padding: 8px 14px; border-radius: 22px; border: 1px solid var(--divider-color, #ccc); background: transparent; color: inherit; font-size: 0.9rem; cursor: pointer; }
      .chip.on { background: var(--primary-color, #03a9f4); color: #fff; border-color: transparent; }
      .hback { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; padding: 14px; z-index: 2; }
      .hbox { background: var(--card-background-color, #fff); border-radius: 16px; padding: 16px 18px; max-width: 420px; max-height: 90%; overflow: auto; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4); }
      .ht { font-size: 1.05rem; font-weight: 600; margin-bottom: 6px; }
      .hs { font-size: 0.72rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--secondary-text-color, #727272); margin-top: 8px; }
      .hbox p { margin: 2px 0 0; font-size: 0.92rem; line-height: 1.4; }
      .hbox .btn { margin-top: 14px; min-height: 44px; width: 100%; }
    `]}};u([x({attribute:!1})],$.prototype,"hass",2),u([x({attribute:!1})],$.prototype,"info",2),u([g()],$.prototype,"_s",2),u([g()],$.prototype,"_src",2),u([g()],$.prototype,"_open",2),u([g()],$.prototype,"_help",2),u([g()],$.prototype,"_busy",2),u([g()],$.prototype,"_error",2);customElements.get("termostato-settings-dialog")||customElements.define("termostato-settings-dialog",$);var ie=.5,k=class extends _{constructor(){super(...arguments);this.embedded=!1;this._config={type:"custom:termostato-card"};this._info=null;this._error="";this._now=Date.now();this._pending=null;this._loadedAt=0;this._loading=!1;this._syncers=new Set}setConfig(t){this._config={...t},this.embedded=t.embedded===!0,this._info=null,this._loadedAt=0}getCardSize(){return 5}static getStubConfig(){return{type:"custom:termostato-card"}}connectedCallback(){super.connectedCallback(),this._tick=window.setInterval(()=>this._now=Date.now(),15e3)}disconnectedCallback(){super.disconnectedCallback(),this._tick&&window.clearInterval(this._tick),this._writeTimer&&window.clearTimeout(this._writeTimer)}willUpdate(){for(let t of this._syncers)t()}updated(){this.hass&&!this._loading&&(!this._info||Date.now()-this._loadedAt>5*6e4)&&this._loadInfo()}async _loadInfo(){this._loading=!0;try{let t={type:"termostato_riscaldamento/info"};this._config.entry_id&&(t.entry_id=this._config.entry_id),this._info=await this.hass.callWS(t),this._error=""}catch(t){let i=t instanceof Error?t.message:t?.message??String(t);this._error=`Termostato non configurato o integrazione non caricata (${i}).`}finally{this._loadedAt=Date.now(),this._loading=!1}}_refreshSoon(){this._loadedAt=0,this._loadInfo()}async _ws(t){try{return await this.hass.callWS({...t,entry_id:this._info?.entry_id}),this._error="",!0}catch(i){let r=i instanceof Error?i.message:i?.message??String(i);return this._error=`Comando non riuscito: ${r}`,!1}finally{this._refreshSoon()}}async _open(t){if(!this._info)return;for(;this._loading;)await new Promise(s=>setTimeout(s,50));if(await this._loadInfo(),!this._info)return;let i=document.createElement(t);i.hass=this.hass,i.info=this._info,i.addEventListener("saved",()=>this._refreshSoon()),document.body.appendChild(i);let r=()=>{i.isConnected&&(i.hass=this.hass)};this._syncers.add(r),i.addEventListener("closed",()=>this._syncers.delete(r))}_live(){let t=this._info,i=this.hass.states[t.sources.climate],r=i?.attributes??{},s=!!i&&i.state!=="unavailable"&&i.state!=="unknown",o=t.entities.modo?this.hass.states[t.entities.modo]:void 0,n=o?.attributes??{},l=["programma","fuori_programma","manuale","timer","spento"].includes(String(o?.state))?o.state:t.mode,d=H(r.current_temperature),h=t.sources.temperature_sensor?H(this.hass.states[t.sources.temperature_sensor]?.state):null;h!==null&&(d=h);let m=n.prossimo_evento??t.next_event?.time??null,b=n.prossima_azione?n.prossima_azione==="riscaldamento"?"set":"idle":t.next_event?.kind??"idle",v=n.timer_fino??t.timer_until;return{available:s,mode:l,hvac:i?.state??t.hvac_mode,action:r.hvac_action??t.hvac_action,target:H(r.temperature)??t.target,current:d??t.current,next:m?{kind:b,time:Date.parse(m),temp:H(n.prossima_temperatura)??t.next_event?.temp??null}:null,timerUntil:v?Date.parse(v):null,timerTemp:H(n.temperatura_timer)??t.timer_temp,away:n.assenza_attiva===!0||o===void 0&&t.away_applied,waitPuffer:n.puffer_in_attesa===!0||o===void 0&&t.puffer?.waiting===!0}}_bump(t,i){let r=this._info.settings,s=this._pending&&this._pending.until>Date.now()?this._pending.value:i,o=w(s+t*ie,r.min_target,r.max_target,ie);this._pending={value:o,until:Date.now()+8e3},this._writeTimer&&window.clearTimeout(this._writeTimer),this._writeTimer=window.setTimeout(()=>{let n=this._pending?.value??o;this._ws({type:"termostato_riscaldamento/target",temperature:n})},600)}async _setMode(t){if(t==="programma"&&this._info&&this._info.schedule.slots.length===0){this._open("termostato-schedule-dialog");return}await this._ws({type:"termostato_riscaldamento/mode",mode:t})}_modeButton(t,i,r,s,o=!1){return c`<button class=${r?o?"mb on warn":"mb on":"mb"} aria-pressed=${r?"true":"false"} @click=${s}>
      <ha-icon icon=${i}></ha-icon><span>${t}</span>
    </button>`}render(){if(!this.hass)return p;let t=this._config.title??this._info?.title??"Termostato";if(this._error&&!this._info)return this._wrap(c`<div class="pad"><div class="title">${t}</div><div class="errbox">${this._error}</div></div>`);if(!this._info)return this._wrap(c`<div class="pad"><div class="title">${t}</div><div class="muted">Carico…</div></div>`);let i=this._info,r=i.settings,s=this._live(),n=(this._pending&&this._pending.until>this._now?this._pending.value:null)??s.target,l=Vt(s.current,n,r),d=Gt(s.mode,{target:n,expected:i.expected,timerUntil:s.timerUntil,timerTemp:s.timerTemp,next:s.next,awayApplied:s.away,antigelo:r.antigelo},this._now),h=s.action==="heating",m=s.available?s.waitPuffer?["Attende il puffer","warn"]:h?["Sta scaldando","warn"]:s.mode==="spento"?["Antigelo","idle"]:["A temperatura","ok"]:["Non disponibile","bad"],b=s.mode==="programma"||s.mode==="fuori_programma",v=Kt(s.mode,s.available);return this._wrap(c`
      <div class="pad">
        <div class="top">
          <div class="title">${t}</div>
          <div class="pill ${m[1]}"><i></i>${m[0]}</div>
        </div>

        <div class="cols">
          <div class="left">
            <div class="gauge">
              ${qt(ee(l))}
              <div class="read"><div class="big">${f(s.current)}<span> °C</span></div></div>
            </div>
          </div>
          <div class="right">
            <div class="stepper" role="group" aria-label="Obiettivo">
              <button class="st" aria-label="Diminuisci l'obiettivo" ?disabled=${!v} @click=${()=>this._bump(-1,n??r.default_target)}>−</button>
              <div class="tv">${f(n??r.default_target)}<span> °C</span></div>
              <button class="st" aria-label="Aumenta l'obiettivo" ?disabled=${!v} @click=${()=>this._bump(1,n??r.default_target)}>+</button>
            </div>
            ${s.available&&!v?c`<div class="hintline">Spento: scegli Manuale per regolare la temperatura</div>`:p}
            <div class="modes" role="group" aria-label="Modalità">
              ${this._modeButton(X.programma,"mdi:calendar-clock",b,()=>void this._setMode("programma"),s.mode==="fuori_programma")}
              ${this._modeButton(X.manuale,"mdi:hand-back-right-outline",s.mode==="manuale",()=>void this._setMode("manuale"))}
              ${this._modeButton(X.timer,"mdi:timer-outline",s.mode==="timer",()=>void this._open("termostato-timer-dialog"))}
              ${this._modeButton(X.spento,"mdi:snowflake",s.mode==="spento",()=>void this._setMode("spento"))}
            </div>
          </div>
        </div>

        <div class="lrow">
          <div class="line ${d.tone}"><ha-icon icon=${d.icon}></ha-icon><span>${d.text}</span></div>
          <button class="btn icon" aria-label="Modifica il programma settimanale" @click=${()=>void this._open("termostato-schedule-dialog")}><ha-icon icon="mdi:calendar-edit"></ha-icon></button>
          <button class="btn icon" aria-label="Preferenze del termostato" @click=${()=>void this._open("termostato-settings-dialog")}><ha-icon icon="mdi:cog"></ha-icon></button>
        </div>
        ${this._error?c`<div class="errbox">${this._error}</div>`:p}
      </div>
    `)}_wrap(t){return this.embedded?c`<div class="embed">${t}</div>`:c`<ha-card>${t}</ha-card>`}static{this.styles=y`
    :host { display: block; container-type: inline-size; }
    ha-card { overflow: hidden; }
    .embed { border-radius: 14px; background: var(--secondary-background-color, rgba(127, 127, 127, 0.1)); }
    .pad { padding: 12px 14px 14px; }
    .top { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .title { font-size: 1.05rem; font-weight: 600; }
    .muted { color: var(--secondary-text-color, #727272); font-size: 0.82rem; }
    .errbox { margin-top: 8px; padding: 8px 10px; border-radius: 10px; background: rgba(220, 38, 38, 0.12); color: #ef4444; font-size: 0.85rem; }
    .pill { display: inline-flex; align-items: center; gap: 7px; padding: 5px 12px; border-radius: 999px; font-size: 0.82rem; font-weight: 600; background: rgba(127, 127, 127, 0.18); }
    .pill i { width: 9px; height: 9px; border-radius: 50%; background: #9aa1ad; }
    .pill.ok i { background: #22c55e; } .pill.warn i { background: #f59e0b; } .pill.bad i { background: #ef4444; }
    .cols { display: block; }
    .gauge { max-width: 230px; margin: 2px auto 0; color: var(--primary-text-color, #212121); }
    .gauge svg { display: block; width: 100%; height: auto; }
    .read { text-align: center; line-height: 1.1; margin-top: 2px; }
    .big { font-size: 2.1rem; font-weight: 700; }
    .big span, .tv span { font-size: 0.95rem; font-weight: 500; color: var(--secondary-text-color, #727272); }
    .stepper { display: flex; align-items: center; justify-content: center; gap: 18px; margin: 6px 0 10px; }
    .tv { min-width: 96px; text-align: center; font-size: 1.5rem; font-weight: 600; }
    .st { width: 48px; height: 48px; border-radius: 50%; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: inherit; font-size: 1.6rem; line-height: 1; cursor: pointer; }
    .st:disabled { opacity: 0.4; cursor: not-allowed; }
    .hintline { margin: -4px 0 8px; text-align: center; font-size: 0.78rem; color: var(--secondary-text-color, #727272); }
    .modes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .mb { min-height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; padding: 4px 2px; border-radius: 12px; border: 1px solid var(--divider-color, #ccc); background: transparent; color: inherit; font-size: 0.74rem; cursor: pointer; }
    .mb ha-icon { --mdc-icon-size: 20px; }
    .mb.on { background: rgba(96, 165, 250, 0.2); border-color: #60a5fa; font-weight: 600; }
    .mb.on.warn { background: rgba(245, 158, 11, 0.2); border-color: #f59e0b; }
    .lrow { display: flex; align-items: stretch; gap: 6px; margin-top: 10px; }
    .line { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 10px; font-size: 0.85rem; line-height: 1.25; background: rgba(127, 127, 127, 0.1); }
    .line ha-icon { --mdc-icon-size: 18px; flex: none; }
    .line.success { background: rgba(34, 197, 94, 0.14); } .line.warning { background: rgba(245, 158, 11, 0.16); } .line.accent { background: rgba(96, 165, 250, 0.16); }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; min-width: 44px; box-sizing: border-box; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, rgba(127, 127, 127, 0.08)); color: inherit; border-radius: 12px; padding: 4px 10px; font-size: 0.88rem; cursor: pointer; }
    .btn ha-icon { --mdc-icon-size: 20px; }
    /* con spazio in larghezza (colonna di una scheda più grande, tablet): quadrante a sinistra, controlli a destra */
    @container (min-width: 430px) {
      .cols { display: grid; grid-template-columns: minmax(150px, 0.9fr) 1.1fr; gap: 14px; align-items: center; }
      .gauge { max-width: 210px; }
      .big { font-size: 1.8rem; }
      .stepper { margin: 0 0 8px; }
      .modes { grid-template-columns: repeat(2, 1fr); }
      .mb { min-height: 44px; flex-direction: row; gap: 6px; font-size: 0.82rem; }
    }
    /* striscia larga (sotto le altre schede): tre colonne - quadrante | obiettivo e modalita' | stato, calendario e preferenze */
    @container (min-width: 900px) {
      .pad {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr) minmax(0, 1fr);
        grid-template-areas:
          "titolo comandi stato"
          "quadrante comandi riga"
          "errore errore errore";
        gap: 2px 24px;
        align-items: center;
        padding: 6px 14px 8px;
      }
      .top { display: contents; }
      .title { grid-area: titolo; font-size: 0.98rem; }
      .pill { grid-area: stato; justify-self: end; padding: 3px 10px; font-size: 0.78rem; }
      .cols { display: contents; }
      .left { grid-area: quadrante; }
      .right { grid-area: comandi; }
      .lrow { grid-area: riga; margin-top: 0; flex-wrap: wrap; justify-content: flex-end; gap: 4px; }
      .lrow .line { flex: 1 1 100%; padding: 4px 10px; font-size: 0.8rem; }
      .lrow .btn { min-height: 38px; min-width: 38px; padding: 2px 8px; }
      .errbox { grid-area: errore; }
      .modes { grid-template-columns: repeat(4, 1fr); gap: 5px; }
      .mb { min-height: 38px; flex-direction: column; gap: 0; font-size: 0.74rem; }
      .mb ha-icon { --mdc-icon-size: 18px; }
      .gauge { max-width: 140px; margin-top: 0; }
      .big { font-size: 1.3rem; }
      .read { margin-top: 0; }
      .stepper { margin: 0 0 4px; gap: 14px; }
      .st { width: 40px; height: 40px; font-size: 1.4rem; }
      .tv { font-size: 1.3rem; }
      .hintline { margin: 0 0 4px; }
    }
  `}};u([x({attribute:!1})],k.prototype,"hass",2),u([x({type:Boolean,reflect:!0})],k.prototype,"embedded",2),u([g()],k.prototype,"_config",2),u([g()],k.prototype,"_info",2),u([g()],k.prototype,"_error",2),u([g()],k.prototype,"_now",2),u([g()],k.prototype,"_pending",2);customElements.get("termostato-card")||customElements.define("termostato-card",k);window.customCards=window.customCards||[];window.customCards.push({type:"termostato-card",name:"Termostato riscaldamento",description:"Quadrante, obiettivo, programma settimanale, timer e preferenze del termostato ambiente."});console.info("%c TERMOSTATO-RISCALDAMENTO %c v0.1.4 ","color: white; background: #b45309; font-weight: 700;","color: #b45309; background: white; font-weight: 700;");export{k as TermostatoCard};
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/lit-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-element/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/custom-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/property.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/state.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/event-options.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/base.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-all.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-async.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-elements.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-nodes.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directive.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/unsafe-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/unsafe-svg.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
