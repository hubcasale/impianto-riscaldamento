var Ne=Object.defineProperty;var Ie=Object.getOwnPropertyDescriptor;var g=(s,e,t,i)=>{for(var o=i>1?void 0:i?Ie(e,t):e,n=s.length-1,r;n>=0;n--)(r=s[n])&&(o=(i?r(e,t,o):r(o))||o);return i&&o&&Ne(e,t,o),o};var dt=globalThis,pt=dt.ShadowRoot&&(dt.ShadyCSS===void 0||dt.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,kt=Symbol(),qt=new WeakMap,X=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==kt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(pt&&e===void 0){let i=t!==void 0&&t.length===1;i&&(e=qt.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&qt.set(t,e))}return e}toString(){return this.cssText}},Wt=s=>new X(typeof s=="string"?s:s+"",void 0,kt),k=(s,...e)=>{let t=s.length===1?s[0]:e.reduce((i,o,n)=>i+(r=>{if(r._$cssResult$===!0)return r.cssText;if(typeof r=="number")return r;throw Error("Value passed to 'css' function must be a 'css' function result: "+r+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(o)+s[n+1],s[0]);return new X(t,s,kt)},Gt=(s,e)=>{if(pt)s.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let i=document.createElement("style"),o=dt.litNonce;o!==void 0&&i.setAttribute("nonce",o),i.textContent=t.cssText,s.appendChild(i)}},Et=pt?s=>s:s=>s instanceof CSSStyleSheet?(e=>{let t="";for(let i of e.cssRules)t+=i.cssText;return Wt(t)})(s):s;var{is:He,defineProperty:De,getOwnPropertyDescriptor:Ue,getOwnPropertyNames:je,getOwnPropertySymbols:Fe,getPrototypeOf:Be}=Object,ut=globalThis,Vt=ut.trustedTypes,qe=Vt?Vt.emptyScript:"",We=ut.reactiveElementPolyfillSupport,Q=(s,e)=>s,tt={toAttribute(s,e){switch(e){case Boolean:s=s?qe:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,e){let t=s;switch(e){case Boolean:t=s!==null;break;case Number:t=s===null?null:Number(s);break;case Object:case Array:try{t=JSON.parse(s)}catch{t=null}}return t}},ht=(s,e)=>!He(s,e),Kt={attribute:!0,type:String,converter:tt,reflect:!1,useDefault:!1,hasChanged:ht};Symbol.metadata??=Symbol("metadata"),ut.litPropertyMetadata??=new WeakMap;var M=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Kt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let i=Symbol(),o=this.getPropertyDescriptor(e,i,t);o!==void 0&&De(this.prototype,e,o)}}static getPropertyDescriptor(e,t,i){let{get:o,set:n}=Ue(this.prototype,e)??{get(){return this[t]},set(r){this[t]=r}};return{get:o,set(r){let l=o?.call(this);n?.call(this,r),this.requestUpdate(e,l,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Kt}static _$Ei(){if(this.hasOwnProperty(Q("elementProperties")))return;let e=Be(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(Q("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Q("properties"))){let t=this.properties,i=[...je(t),...Fe(t)];for(let o of i)this.createProperty(o,t[o])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[i,o]of t)this.elementProperties.set(i,o)}this._$Eh=new Map;for(let[t,i]of this.elementProperties){let o=this._$Eu(t,i);o!==void 0&&this._$Eh.set(o,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let i=new Set(e.flat(1/0).reverse());for(let o of i)t.unshift(Et(o))}else e!==void 0&&t.push(Et(e));return t}static _$Eu(e,t){let i=t.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Gt(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){let i=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,i);if(o!==void 0&&i.reflect===!0){let n=(i.converter?.toAttribute!==void 0?i.converter:tt).toAttribute(t,i.type);this._$Em=e,n==null?this.removeAttribute(o):this.setAttribute(o,n),this._$Em=null}}_$AK(e,t){let i=this.constructor,o=i._$Eh.get(e);if(o!==void 0&&this._$Em!==o){let n=i.getPropertyOptions(o),r=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:tt;this._$Em=o;let l=r.fromAttribute(t,n.type);this[o]=l??this._$Ej?.get(o)??l,this._$Em=null}}requestUpdate(e,t,i,o=!1,n){if(e!==void 0){let r=this.constructor;if(o===!1&&(n=this[e]),i??=r.getPropertyOptions(e),!((i.hasChanged??ht)(n,t)||i.useDefault&&i.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(r._$Eu(e,i))))return;this.C(e,t,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:o,wrapped:n},r){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,r??t??this[e]),n!==!0||r!==void 0)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),o===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[o,n]of this._$Ep)this[o]=n;this._$Ep=void 0}let i=this.constructor.elementProperties;if(i.size>0)for(let[o,n]of i){let{wrapped:r}=n,l=this[o];r!==!0||this._$AL.has(o)||l===void 0||this.C(o,void 0,n,l)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(t)):this._$EM()}catch(i){throw e=!1,this._$EM(),i}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};M.elementStyles=[],M.shadowRootOptions={mode:"open"},M[Q("elementProperties")]=new Map,M[Q("finalized")]=new Map,We?.({ReactiveElement:M}),(ut.reactiveElementVersions??=[]).push("2.1.2");var Ot=globalThis,Zt=s=>s,mt=Ot.trustedTypes,Yt=mt?mt.createPolicy("lit-html",{createHTML:s=>s}):void 0,ie="$lit$",P=`lit$${Math.random().toFixed(9).slice(2)}$`,se="?"+P,Ge=`<${se}>`,F=document,it=()=>F.createComment(""),st=s=>s===null||typeof s!="object"&&typeof s!="function",Pt=Array.isArray,Ve=s=>Pt(s)||typeof s?.[Symbol.iterator]=="function",At=`[ 	
\f\r]`,et=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Jt=/-->/g,Xt=/>/g,U=RegExp(`>|${At}(?:([^\\s"'>=/]+)(${At}*=${At}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Qt=/'/g,te=/"/g,oe=/^(?:script|style|textarea|title)$/i,Rt=s=>(e,...t)=>({_$litType$:s,strings:e,values:t}),d=Rt(1),B=Rt(2),hi=Rt(3),T=Symbol.for("lit-noChange"),c=Symbol.for("lit-nothing"),ee=new WeakMap,j=F.createTreeWalker(F,129);function ne(s,e){if(!Pt(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return Yt!==void 0?Yt.createHTML(e):e}var Ke=(s,e)=>{let t=s.length-1,i=[],o,n=e===2?"<svg>":e===3?"<math>":"",r=et;for(let l=0;l<t;l++){let a=s[l],h,f,p=-1,m=0;for(;m<a.length&&(r.lastIndex=m,f=r.exec(a),f!==null);)m=r.lastIndex,r===et?f[1]==="!--"?r=Jt:f[1]!==void 0?r=Xt:f[2]!==void 0?(oe.test(f[2])&&(o=RegExp("</"+f[2],"g")),r=U):f[3]!==void 0&&(r=U):r===U?f[0]===">"?(r=o??et,p=-1):f[1]===void 0?p=-2:(p=r.lastIndex-f[2].length,h=f[1],r=f[3]===void 0?U:f[3]==='"'?te:Qt):r===te||r===Qt?r=U:r===Jt||r===Xt?r=et:(r=U,o=void 0);let v=r===U&&s[l+1].startsWith("/>")?" ":"";n+=r===et?a+Ge:p>=0?(i.push(h),a.slice(0,p)+ie+a.slice(p)+P+v):a+P+(p===-2?l:v)}return[ne(s,n+(s[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),i]},ot=class s{constructor({strings:e,_$litType$:t},i){let o;this.parts=[];let n=0,r=0,l=e.length-1,a=this.parts,[h,f]=Ke(e,t);if(this.el=s.createElement(h,i),j.currentNode=this.el.content,t===2||t===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(o=j.nextNode())!==null&&a.length<l;){if(o.nodeType===1){if(o.hasAttributes())for(let p of o.getAttributeNames())if(p.endsWith(ie)){let m=f[r++],v=o.getAttribute(p).split(P),y=/([.?@])?(.*)/.exec(m);a.push({type:1,index:n,name:y[2],strings:v,ctor:y[1]==="."?zt:y[1]==="?"?Mt:y[1]==="@"?Tt:K}),o.removeAttribute(p)}else p.startsWith(P)&&(a.push({type:6,index:n}),o.removeAttribute(p));if(oe.test(o.tagName)){let p=o.textContent.split(P),m=p.length-1;if(m>0){o.textContent=mt?mt.emptyScript:"";for(let v=0;v<m;v++)o.append(p[v],it()),j.nextNode(),a.push({type:2,index:++n});o.append(p[m],it())}}}else if(o.nodeType===8)if(o.data===se)a.push({type:2,index:n});else{let p=-1;for(;(p=o.data.indexOf(P,p+1))!==-1;)a.push({type:7,index:n}),p+=P.length-1}n++}}static createElement(e,t){let i=F.createElement("template");return i.innerHTML=e,i}};function V(s,e,t=s,i){if(e===T)return e;let o=i!==void 0?t._$Co?.[i]:t._$Cl,n=st(e)?void 0:e._$litDirective$;return o?.constructor!==n&&(o?._$AO?.(!1),n===void 0?o=void 0:(o=new n(s),o._$AT(s,t,i)),i!==void 0?(t._$Co??=[])[i]=o:t._$Cl=o),o!==void 0&&(e=V(s,o._$AS(s,e.values),o,i)),e}var Ct=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:i}=this._$AD,o=(e?.creationScope??F).importNode(t,!0);j.currentNode=o;let n=j.nextNode(),r=0,l=0,a=i[0];for(;a!==void 0;){if(r===a.index){let h;a.type===2?h=new nt(n,n.nextSibling,this,e):a.type===1?h=new a.ctor(n,a.name,a.strings,this,e):a.type===6&&(h=new Lt(n,this,e)),this._$AV.push(h),a=i[++l]}r!==a?.index&&(n=j.nextNode(),r++)}return j.currentNode=F,o}p(e){let t=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}},nt=class s{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,o){this.type=2,this._$AH=c,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=V(this,e,t),st(e)?e===c||e==null||e===""?(this._$AH!==c&&this._$AR(),this._$AH=c):e!==this._$AH&&e!==T&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Ve(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==c&&st(this._$AH)?this._$AA.nextSibling.data=e:this.T(F.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:i}=e,o=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=ot.createElement(ne(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(t);else{let n=new Ct(o,this),r=n.u(this.options);n.p(t),this.T(r),this._$AH=n}}_$AC(e){let t=ee.get(e.strings);return t===void 0&&ee.set(e.strings,t=new ot(e)),t}k(e){Pt(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,i,o=0;for(let n of e)o===t.length?t.push(i=new s(this.O(it()),this.O(it()),this,this.options)):i=t[o],i._$AI(n),o++;o<t.length&&(this._$AR(i&&i._$AB.nextSibling,o),t.length=o)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let i=Zt(e).nextSibling;Zt(e).remove(),e=i}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},K=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,o,n){this.type=1,this._$AH=c,this._$AN=void 0,this.element=e,this.name=t,this._$AM=o,this.options=n,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=c}_$AI(e,t=this,i,o){let n=this.strings,r=!1;if(n===void 0)e=V(this,e,t,0),r=!st(e)||e!==this._$AH&&e!==T,r&&(this._$AH=e);else{let l=e,a,h;for(e=n[0],a=0;a<n.length-1;a++)h=V(this,l[i+a],t,a),h===T&&(h=this._$AH[a]),r||=!st(h)||h!==this._$AH[a],h===c?e=c:e!==c&&(e+=(h??"")+n[a+1]),this._$AH[a]=h}r&&!o&&this.j(e)}j(e){e===c?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},zt=class extends K{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===c?void 0:e}},Mt=class extends K{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==c)}},Tt=class extends K{constructor(e,t,i,o,n){super(e,t,i,o,n),this.type=5}_$AI(e,t=this){if((e=V(this,e,t,0)??c)===T)return;let i=this._$AH,o=e===c&&i!==c||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,n=e!==c&&(i===c||o);o&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Lt=class{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){V(this,e)}};var Ze=Ot.litHtmlPolyfillSupport;Ze?.(ot,nt),(Ot.litHtmlVersions??=[]).push("3.3.3");var re=(s,e,t)=>{let i=t?.renderBefore??e,o=i._$litPart$;if(o===void 0){let n=t?.renderBefore??null;i._$litPart$=o=new nt(e.insertBefore(it(),n),n,void 0,t??{})}return o._$AI(s),o};var Nt=globalThis,$=class extends M{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=re(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return T}};$._$litElement$=!0,$.finalized=!0,Nt.litElementHydrateSupport?.({LitElement:$});var Ye=Nt.litElementPolyfillSupport;Ye?.({LitElement:$});(Nt.litElementVersions??=[]).push("4.2.2");var Je={attribute:!0,type:String,converter:tt,reflect:!1,hasChanged:ht},Xe=(s=Je,e,t)=>{let{kind:i,metadata:o}=t,n=globalThis.litPropertyMetadata.get(o);if(n===void 0&&globalThis.litPropertyMetadata.set(o,n=new Map),i==="setter"&&((s=Object.create(s)).wrapped=!0),n.set(t.name,s),i==="accessor"){let{name:r}=t;return{set(l){let a=e.get.call(this);e.set.call(this,l),this.requestUpdate(r,a,s,!0,l)},init(l){return l!==void 0&&this.C(r,void 0,s,l),l}}}if(i==="setter"){let{name:r}=t;return function(l){let a=this[r];e.call(this,l),this.requestUpdate(r,a,s,!0,l)}}throw Error("Unsupported decorator location: "+i)};function x(s){return(e,t)=>typeof t=="object"?Xe(s,e,t):((i,o,n)=>{let r=o.hasOwnProperty(n);return o.constructor.createProperty(n,i),r?Object.getOwnPropertyDescriptor(o,n):void 0})(s,e,t)}function b(s){return x({...s,state:!0,attribute:!1})}var ae={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},bt=s=>(...e)=>({_$litDirective$:s,values:e}),gt=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var q=class extends gt{constructor(e){if(super(e),this.it=c,e.type!==ae.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===c||e==null)return this._t=void 0,this.it=e;if(e===T)return e;if(typeof e!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;let t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}};q.directiveName="unsafeHTML",q.resultType=1;var is=bt(q);var rt=class extends q{};rt.directiveName="unsafeSVG",rt.resultType=2;var vt=bt(rt);var Qe=["#f5b324","#f97316","#dc2626"];function le(s){if(s===null||!Number.isFinite(s))return null;let e=Math.min(100,Math.max(0,s))/100;return Math.round((2.6-2.2*e)*100)/100}function ti(s,e,t,i,o){let n=r=>`${(s+t*Math.cos(r*Math.PI/180)).toFixed(2)} ${(e-t*Math.sin(r*Math.PI/180)).toFixed(2)}`;return`M${n(i)} A${t} ${t} 0 0 1 ${n(o)}`}function ce(s,e=!1){let t=[0,1,2].map(o=>{let n=180-o*60-2.5,r=180-(o+1)*60+2.5,l=s===o+1;return`<path d="${ti(45,44,34,n,r)}" fill="none" stroke="${l?Qe[o]:"var(--divider-color, #cfcfcf)"}" stroke-width="9" stroke-linecap="butt" opacity="${l?1:.55}"/>`}).join(""),i=s===null?"\u2013":`${e?"\u2248":""}P${s}`;return`<svg viewBox="0 0 90 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${t}<text x="45" y="45" text-anchor="middle" font-size="${i.length>2?15:18}" font-weight="700" fill="currentColor">${i}</text></svg>`}function de(){let s=e=>`<path d="M20 20 C13 15 14 5 20 2.5 C26 5 27 15 20 20 Z" transform="rotate(${e} 20 20)" fill="currentColor"/>`;return`<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${[0,90,180,270].map(s).join("")}<circle cx="20" cy="20" r="3.2" fill="var(--card-background-color, #fff)" stroke="currentColor" stroke-width="1.2"/></svg>`}var ei=["spenta","accensione","accesa","spegnimento","non_disponibile"],R={spenta:"Spenta",accensione:"Accensione",accesa:"In funzione",spegnimento:"Spegnimento",non_disponibile:"Non disponibile"},xt={spenta:"neutral",accensione:"warning",accesa:"success",spegnimento:"accent",non_disponibile:"danger"},S={spenta:"#6b7280",accensione:"#f59e0b",accesa:"#ef4444",spegnimento:"#60a5fa",non_disponibile:"transparent"},at={rosso:["#8b2a22","#b53b2f"],arancio:["#d9822b","#f0a24a"],avorio:["#d8cdb4","#efe6d0"]};function lt(s){return ei.includes(String(s))?s:"non_disponibile"}function N(s){if(s==null||s===""||s==="unknown"||s==="unavailable")return null;let e=Number(s);return Number.isFinite(e)?e:null}function _(s,e=0){return s==null||!Number.isFinite(s)?"\u2013":s.toFixed(e).replace(".",",")}function Y(s){let e=Math.max(0,Math.floor(s/1e3));if(e<60)return`${e} s`;let t=Math.floor(e/60);return t<60?`${t} min`:`${Math.floor(t/60)} h ${String(t%60).padStart(2,"0")} min`}function ue(s,e){let t=Math.max(300,Math.ceil(e.ignition_above*1.2/50)*50),i=l=>Math.round(Math.min(Math.max(l/t,0),1)*1e3)/10,o=[{from:0,to:i(e.off_below),color:S.spenta,label:"spenta"},{from:i(e.shutdown_min),to:i(e.shutdown_max),color:S.spegnimento,label:"spegnimento"},{from:i(e.ignition_above),to:100,color:S.accensione,label:"accensione"}],n=[{at:0,label:"0"},{at:i(e.off_below),label:_(e.off_below,e.off_below%1?1:0)},{at:i((e.shutdown_min+e.shutdown_max)/2),label:`${_(e.shutdown_min,e.shutdown_min%1?1:0)}-${_(e.shutdown_max,e.shutdown_max%1?1:0)}`},{at:i(e.ignition_above),label:_(e.ignition_above)},{at:100,label:`${t} W`}],r=n.filter((l,a)=>a===0?n[1].at-l.at>=8:a===n.length-1?l.at-n[a-1].at>=8:!0);return{max:t,marker:s===null?null:i(s),zones:o,ticks:r}}function ii(s){if(s==null)return null;if(typeof s=="number")return s<1e11?s*1e3:s;let e=Date.parse(s);return Number.isNaN(e)?null:e}function he(s){return ii(s.lu??s.last_updated??s.lc??s.last_changed)}function me(s){let e=[];for(let t of s??[]){let i=he(t),o=t.s??t.state;if(i===null||o===void 0||o===""||o==="unavailable"||o==="unknown")continue;let n=Number(o);Number.isFinite(n)&&e.push({t:i,v:n})}return e.sort((t,i)=>t.t-i.t)}function yt(s,e,t){let i=[];for(let a of s??[]){let h=he(a),f=a.s??a.state;h!==null&&f!==void 0&&i.push({t:h,s:lt(f)})}i.sort((a,h)=>a.t-h.t);let o=null;for(let a of i)if(a.t<=e)o=a.s;else break;let n=[],r=e;for(let a of i)a.t<=e||a.t>=t||(o!==null&&n.push({from:r,to:a.t,state:o}),r=a.t,o=a.s);o!==null&&r<t&&n.push({from:r,to:t,state:o});let l=[];for(let a of n){let h=l[l.length-1];h&&h.state===a.state&&h.to===a.from?h.to=a.to:l.push({...a})}return l}function fe(s,e){for(let t of s)if(e>=t.from&&e<t.to)return t.state;return null}function ge(s,e,t,i,o=3*3600*1e3){let n=new Array(i).fill(null);if(i<=0||t<=e)return n;let r=(t-e)/i,l=0,a=null,h=0;for(let f=0;f<i;f++){let p=e+f*r,m=p+r;for(;l<s.length&&s[l].t<=p;)a=s[l].v,h=s[l].t,l++;let v=0,y=0,E=p,w=a,u=h,J=Re=>{if(w===null)return;let St=Math.min(Re,u+o)-E;St>0&&(v+=w*St,y+=St)},D=l;for(;D<s.length&&s[D].t<m;)J(s[D].t),E=s[D].t,w=s[D].v,u=s[D].t,D++;J(m),n[f]=y>0?v/y:null}return n}function si(s){let e=Math.pow(10,Math.floor(Math.log10(s))),t=s/e;return(t<=1?1:t<=2?2:t<=2.5?2.5:t<=5?5:10)*e}function be(s,e,t=5){if(!Number.isFinite(s)||!Number.isFinite(e))return{min:0,max:1,ticks:[0,1]};e-s<1e-9&&(s-=1,e+=1);let i=si((e-s)/Math.max(1,t-1)),o=Math.floor(s/i+1e-9)*i,n=Math.ceil(e/i-1e-9)*i,r=[];for(let l=o;l<=n+i*1e-6;l+=i)r.push(Math.round(l/i)*i);return{min:o,max:n,ticks:r}}var ve=["dom","lun","mar","mer","gio","ven","sab"],oi=["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"],It=s=>`${String(s.getHours()).padStart(2,"0")}:${String(s.getMinutes()).padStart(2,"0")}`;function _e(s,e,t=6){let i=(e-s)/36e5,o=[1,2,3,6,12,24,48].find(l=>i/l<=t)??48,n=new Date(s);n.setMinutes(0,0,0),o>=24?n.setHours(0):n.setHours(Math.ceil(n.getHours()/o)*o);let r=[];for(let l=n.getTime();l<=e;l+=o*36e5){if(l<s)continue;let a=new Date(l),h=a.getHours()===0;r.push({t:l,major:h,label:i>30&&h?`${ve[a.getDay()]} ${a.getDate()}`:It(a)})}return r}function xe(s){let e=new Date(s);return`${ve[e.getDay()]} ${e.getDate()} ${oi[e.getMonth()]}, ${It(e)}`}function ye(s,e,t){let i="",o=!1;for(let n=0;n<s.length;n++){let r=s[n];if(r===null){o=!1;continue}i+=`${o?"L":"M"}${e(n).toFixed(1)} ${t(r).toFixed(1)}`,o=!0}return i}function $e(s,e){let t=s.settings,i=s.power!==null?`${_(s.power,s.power%1?1:0)} W`:"\u2013",o=s.sinceMs!==null?Y(e-s.sinceMs):null,n=[];switch(s.state){case"accesa":n.push({icon:"mdi:fire",text:`Stufa in funzione${o?` da ${o}`:""}, potenza ${i}.`,tone:"ok"});break;case"accensione":n.push({icon:"mdi:fire-circle",text:`Accensione in corso: l'accenditore assorbe ${i}, oltre la soglia di ${_(t.ignition_above)} W.`,tone:"info"});break;case"spegnimento":n.push({icon:"mdi:fan",text:`Spegnimento in corso: la ventola raffredda (${i}, fascia ${_(t.shutdown_min,1)}-${_(t.shutdown_max,1)} W).`,tone:"info"});break;case"spenta":n.push({icon:"mdi:fire-off",text:`Stufa spenta${o?` da ${o}`:""}, potenza ${i} (sotto ${_(t.off_below,t.off_below%1?1:0)} W).`,tone:"info"});break;default:n.push({icon:"mdi:lan-disconnect",text:"Il sensore di potenza non risponde: non so in che stato sia la stufa.",tone:"bad"})}return s.blocked&&n.push({icon:"mdi:shield-lock",text:`Azioni automatiche sull'interruttore bloccate: riprendono ${t.restore_delay_seconds} secondi dopo il ritorno del sensore.`,tone:"warn"}),s.switchOn!==null&&(n.push({icon:"mdi:toggle-switch",text:`L'interruttore della stufa \xE8 ${s.switchOn?"acceso":"spento"}.`,tone:"info"}),s.switchOn&&s.state==="spenta"&&!s.blocked&&n.push({icon:"mdi:timer-sand",text:`Interruttore acceso con la stufa spenta: si spegne dopo il periodo di grazia (${t.grace_seconds} s).`,tone:"info"}),!s.switchOn&&s.state==="accensione"&&n.push({icon:"mdi:sync",text:"La stufa \xE8 partita da sola: l'interruttore si accende per restare allineato.",tone:"info"})),s.plugOn===!1?n.push({icon:"mdi:power-plug-off",text:"La presa \xE8 spenta: la stufa non \xE8 alimentata.",tone:"warn"}):s.plugOn===!0&&n.push({icon:"mdi:power-plug",text:"La presa \xE8 accesa.",tone:"info"}),s.ignitionsToday!==null&&s.hoursToday!==null&&n.push({icon:"mdi:calendar-today",text:`Oggi: ${s.ignitionsToday} ${s.ignitionsToday===1?"accensione":"accensioni"}, ${_(s.hoursToday,1)} ore in funzione.`,tone:"info"}),n}var we=[{key:"off_below",label:"Spenta sotto",hint:"Sotto questa potenza la stufa \xE8 spenta (consumo a riposo).",unit:"W",min:0,max:100,step:.5},{key:"shutdown_min",label:"Spegnimento da",hint:"Inizio della fascia di potenza della ventola in raffreddamento.",unit:"W",min:1,max:400,step:.5},{key:"shutdown_max",label:"Spegnimento fino a",hint:"Fine della fascia di spegnimento.",unit:"W",min:1,max:400,step:.5},{key:"ignition_above",label:"Accensione sopra",hint:"Oltre questa potenza l'accenditore \xE8 acceso: la stufa si sta accendendo.",unit:"W",min:20,max:2e3,step:5}],pe=(s,e)=>({key:`p${s}_${e}`,label:`P${s}, ventilatore al ${e==="min"?"minimo":"massimo"}`,hint:e==="min"?`Potenza assorbita a P${s} col ventilatore al minimo.`:`Potenza assorbita a P${s} col ventilatore al massimo.`,unit:"W",min:0,max:3e3,step:.5}),Se=[1,2,3].flatMap(s=>[pe(s,"min"),pe(s,"max")]);function ke(s,e,t){if(!s)return"";let i=e===null?"":` \xB7 ventilatore ${Math.round(e)} %`;return`${t?"\u2248 ":""}${s}${i}`}var Ee=[{key:"confirm_seconds",label:"Conferma del cambio di stato",hint:"Un nuovo stato deve durare tanti secondi prima di essere accettato (filtra i picchi).",unit:"s",min:0,max:600,step:1},{key:"grace_seconds",label:"Periodo di grazia dell'interruttore",hint:"Dopo aver acceso l'interruttore della stufa si aspetta tanti secondi prima di spegnerlo se la stufa risulta spenta.",unit:"s",min:0,max:600,step:1},{key:"restore_delay_seconds",label:"Ripresa dopo guasto del sensore",hint:"Dopo il ritorno del sensore le azioni sull'interruttore restano bloccate per tanti secondi.",unit:"s",min:0,max:900,step:1}];function Ht(s){let e=[];s.off_below<s.shutdown_min||e.push("La soglia di spenta deve essere minore dell'inizio della fascia di spegnimento."),s.shutdown_min>s.shutdown_max&&e.push("L'inizio della fascia di spegnimento non pu\xF2 superare la fine."),s.shutdown_max<s.ignition_above||e.push("La fascia di spegnimento deve stare sotto la soglia di accensione.");for(let t of[1,2,3])s[`p${t}_min`]>s[`p${t}_max`]&&e.push(`P${t}: la potenza col ventilatore al minimo non pu\xF2 superare quella al massimo.`);return e}function Dt(s,e,t,i){let o=Math.min(t,Math.max(e,s)),n=(String(i).split(".")[1]??"").length;return Number((Math.round(o/i)*i).toFixed(n))}var $t=["Lun","Mar","Mer","Gio","Ven","Sab","Dom"],Ae=["L","M","M","G","V","S","D"],Ce=[30,60,120,180,240,360];function Z(s,e=!1){let t=/^(\d{1,2}):(\d{2})$/.exec(s.trim());if(!t||Number(t[2])>59)return null;let i=Number(t[1])*60+Number(t[2]);return i>=0&&i<=(e?1440:1439)?i:null}function Ut(s){if(s.days.length===0)return"Scegli almeno un giorno.";let e=Z(s.start),t=Z(s.end,!0);return e===null||t===null?"Orario non valido.":e===t?"Inizio e fine non possono coincidere.":null}function ze(s){let e=Z(s.start),t=Z(s.end,!0);return e!==null&&t!==null&&t<=e}function Me(s){let t=new Uint8Array(10080);for(let o of s){let n=Z(o.start),r=Z(o.end,!0);if(n===null||r===null||n===r)continue;let l=r>n?r-n:1440-n+r;for(let a of o.days)if(!(a<0||a>6))for(let h=0;h<l;h++)t[(a*1440+n+h)%10080]=1}let i=[];for(let o=0;o<7;o++){let n=[],r=null;for(let l=0;l<1440;l++){let a=t[o*1440+l]===1;a&&r===null?r=l:!a&&r!==null&&(n.push([r,l]),r=null)}r!==null&&n.push([r,1440]),i.push(n)}return i}function Te(s){let e=[...new Set(s)].sort((t,i)=>t-i);return e.length===7?"Tutti i giorni":e.length===5&&e.join()==="0,1,2,3,4"?"Lun\u2013Ven":e.length===2&&e.join()==="5,6"?"Sab\u2013Dom":e.map(t=>$t[t]).join(" ")}function _t(s,e){let t=new Date(s),i=new Date(e),o=a=>new Date(a.getFullYear(),a.getMonth(),a.getDate()).getTime(),n=Math.round((o(t)-o(i))/864e5),r=`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`,l=["dom","lun","mar","mer","gio","ven","sab"];return n===0?`oggi alle ${r}`:n===1?`domani alle ${r}`:`${l[t.getDay()]} ${t.getDate()} alle ${r}`}function Le(s,e,t,i,o){let n=t?`${t.kind==="on"?"prossima accensione":"spegnimento"} ${_t(t.time,o)}`:"";switch(s){case"timer":return{label:"Timer",tone:"accent",icon:"mdi:timer-outline",detail:i!==null?`si spegne ${_t(i,o)} (tra ${Y(i-o)})`:""};case"programma":return{label:"Programma attivo",tone:"success",icon:"mdi:calendar-check",detail:n};case"fuori_programma":return{label:"Manuale, fuori programma",tone:"warning",icon:"mdi:hand-back-right",detail:n?`il programma riprende: ${n}`:""};default:return{label:"Manuale",tone:"neutral",icon:"mdi:hand-back-right-outline",detail:e?"":"programmazione non attiva"}}}function Oe(){return{days:[0,1,2,3,4],start:"07:00",end:"09:00"}}function jt(s){let e=[];return s.slots.forEach((t,i)=>{let o=Ut(t);o&&e.push(`Fascia ${i+1}: ${o}`)}),e}function Pe(s,e){let[t,i]=at[e]??at.rosso,o=s==="accesa"||s==="accensione"||s==="spegnimento",n=s==="non_disponibile",r=s==="accesa"?"#ff8a2a":s==="accensione"?"#ff9d3c":s==="spegnimento"?"#4a7bd0":null,l=s==="accesa"?.55:s==="accensione"?.32:s==="spegnimento"?.18:0,m=s==="accesa"?`
    <path d="M94 186 C70 178 66 150 82 132 C84 144 92 146 94 138 C96 122 90 114 98 104 C104 122 124 134 118 160 C116 172 106 182 94 186Z" fill="#ffb21f"/>
    <path d="M94 186 C80 180 78 160 88 148 C90 156 96 158 97 150 C98 140 96 134 100 128 C106 144 114 156 108 170 C105 178 100 184 94 186Z" fill="#ff6a1a"/>
    <path d="M94 186 C86 182 86 170 92 162 C94 168 98 168 99 163 C103 170 102 180 94 186Z" fill="#fff0a8"/>
    <path d="M68 186 C58 178 60 164 68 158 C68 166 72 168 74 164 C78 172 76 182 68 186Z" fill="#ff8a1f"/>
    <path d="M120 186 C112 180 114 168 121 162 C121 170 125 172 127 167 C131 175 128 183 120 186Z" fill="#ff8a1f"/>`:s==="accensione"?`
    <path d="M94 186 C84 182 84 170 90 162 C92 168 96 168 98 162 C102 170 102 180 94 186Z" fill="#ffa21f"/>
    <path d="M94 186 C89 183 89 177 92 173 C94 176 96 176 97 173 C99 177 98 183 94 186Z" fill="#fff0a8"/>`+(s==="accensione"?'<rect x="79" y="180" width="30" height="4" rx="2" fill="#ff3b30"/><rect x="79" y="180" width="30" height="4" rx="2" fill="#ff7a6e" opacity="0.5"/>':""):s==="spegnimento"?`
    <path d="M94 186 C86 183 86 174 91 168 C93 172 96 172 98 168 C101 174 101 182 94 186Z" fill="#6aa4ff" opacity="0.8"/>
    <path d="M94 186 C90 184 90 180 93 177 C95 179 96 179 97 177 C98 180 98 184 94 186Z" fill="#c9e0ff" opacity="0.8"/>`:"",v=o?s==="spegnimento"?"#7fb2ff":"#ffcf5a":"#1b2028",y=s==="accesa"?"ON":s==="accensione"?"ACC":s==="spegnimento"?"OFF":"",E=[0,1,2,3,4,5,6].map(w=>`<rect x="40" y="${54+w*4.8}" width="108" height="2.4" rx="1.2" fill="#0f1217"/>`).join("");return`<svg viewBox="0 0 188 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stufa a pellet ${s}">
  <defs>
    <linearGradient id="spBody" x1="0" x2="1"><stop offset="0" stop-color="#2a2f38"/><stop offset=".5" stop-color="#3a414d"/><stop offset="1" stop-color="#2a2f38"/></linearGradient>
    <linearGradient id="spTile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${i}"/><stop offset="1" stop-color="${t}"/></linearGradient>
    <linearGradient id="spGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14181e"/><stop offset="1" stop-color="#0b0d11"/></linearGradient>
    <radialGradient id="spGlow" cx=".5" cy=".85" r=".7"><stop offset="0" stop-color="${r??"#000"}" stop-opacity="${l}"/><stop offset="1" stop-color="${r??"#000"}" stop-opacity="0"/></radialGradient>
    <clipPath id="spGlassClip"><rect x="53" y="100" width="82" height="88" rx="6"/></clipPath>
  </defs>
  <ellipse cx="94" cy="326" rx="78" ry="8" fill="#000" opacity="0.18"/>
  <rect x="85" y="6" width="18" height="40" rx="3" fill="#2b2f36"/>
  <rect x="85" y="6" width="5" height="40" rx="2" fill="#4a505b" opacity="0.6"/>
  <rect x="10" y="42" width="168" height="12" rx="6" fill="#20242b"/>
  <path d="M12 54 H176 C180 54 182 58 182 62 V292 C182 300 176 306 168 306 H20 C12 306 6 300 6 292 V62 C6 58 8 54 12 54Z" fill="url(#spBody)"/>
  <rect x="14" y="60" width="8" height="226" rx="3" fill="url(#spTile)"/>
  <rect x="166" y="60" width="8" height="226" rx="3" fill="url(#spTile)"/>
  <g stroke="#000" stroke-opacity="0.18" stroke-width="0.8">${[0,1,2,3,4,5,6,7,8,9,10].map(w=>`<line x1="14" x2="22" y1="${80+w*20}" y2="${80+w*20}"/><line x1="166" x2="174" y1="${80+w*20}" y2="${80+w*20}"/>`).join("")}</g>
  <rect x="38" y="50" width="112" height="40" rx="4" fill="#161a20"/>${E}
  <rect x="44" y="88" width="100" height="126" rx="8" fill="#1d2128"/>
  <rect x="53" y="100" width="82" height="88" rx="6" fill="url(#spGlass)"/>
  <g clip-path="url(#spGlassClip)">
    ${r?'<rect x="53" y="100" width="82" height="88" fill="url(#spGlow)"/>':""}
    ${m}
    <path d="M60 104 L80 104 L58 150 Z" fill="#fff" opacity="0.06"/>
  </g>
  <rect x="53" y="100" width="82" height="88" rx="6" fill="none" stroke="#5b626e" stroke-width="1.5"/>
  <rect x="141" y="130" width="6" height="30" rx="3" fill="#b9bec8"/>
  <rect x="38" y="216" width="112" height="32" rx="6" fill="#1a1e24"/>
  <circle cx="66" cy="232" r="8" fill="#9aa1ad"/><circle cx="66" cy="232" r="8" fill="none" stroke="#5b626e"/><line x1="66" y1="232" x2="66" y2="226" stroke="#20242b" stroke-width="2" stroke-linecap="round"/>
  <circle cx="122" cy="232" r="8" fill="#9aa1ad"/><circle cx="122" cy="232" r="8" fill="none" stroke="#5b626e"/><line x1="122" y1="232" x2="127" y2="228" stroke="#20242b" stroke-width="2" stroke-linecap="round"/>
  <rect x="82" y="222" width="24" height="20" rx="3" fill="${v}"/>
  ${y?`<text x="94" y="236" text-anchor="middle" font-family="monospace" font-size="9" font-weight="700" fill="#10141a">${y}</text>`:""}
  <rect x="56" y="254" width="76" height="30" rx="5" fill="#222730"/>
  <rect x="62" y="262" width="64" height="4" rx="2" fill="#0f1217"/>
  <rect x="82" y="270" width="24" height="5" rx="2.5" fill="#9aa1ad"/>
  <rect x="20" y="294" width="148" height="12" rx="5" fill="#161a20"/>
  ${n?'<rect x="6" y="42" width="176" height="264" rx="14" fill="#9aa1ad" opacity="0.55"/><text x="94" y="190" text-anchor="middle" font-family="sans-serif" font-size="64" font-weight="700" fill="#fff">?</text>':""}
</svg>`}var z=k`
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
`;var ct=class extends ${constructor(){super(...arguments);this._onKey=t=>{t.key==="Escape"&&this._close()}}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._onKey)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._onKey)}_close(){this.dispatchEvent(new CustomEvent("closed")),this.remove()}render(){if(!this.hass||!this.info)return c;let t=this.info.entities,i=t.stato?this.hass.states[t.stato]:void 0,o=lt(i?.state??this.info.state),n=i?.attributes??{},r=n.da??this.info.since,l=n.interruttore==="acceso"?!0:n.interruttore==="spento"?!1:null,a=n.presa==="accesa"?!0:n.presa==="spenta"?!1:null,h=p=>t[p]?N(this.hass.states[t[p]]?.state):null,f=$e({state:o,power:N(n.potenza)??this.info.power,sinceMs:r?Date.parse(r):null,switchOn:l,plugOn:a,blocked:n.azioni_bloccate===!0,ignitionsToday:h("accensioni_oggi"),hoursToday:h("ore_in_funzione_oggi"),lastOn:null,lastOff:null,settings:this.info.settings},Date.now());return d`
      <div class="backdrop" @click=${p=>p.target===p.currentTarget&&this._close()}>
        <div class="panel" role="dialog" aria-modal="true" aria-label="Stato stufa">
          <div class="head">
            <div class="title">Stato della stufa</div>
            <button class="x" aria-label="Chiudi" @click=${()=>this._close()}>✕</button>
          </div>
          <div class="body">
            <div class="badge ${xt[o]}">${R[o]}</div>
            ${f.map(p=>d`<div class="line ${p.tone}"><ha-icon icon=${p.icon}></ha-icon><span>${p.text}</span></div>`)}
          </div>
        </div>
      </div>
    `}static{this.styles=[z,k`
      .badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 0.85rem;
        margin-bottom: 10px;
        background: var(--secondary-background-color, #eee);
      }
      .badge.success { background: rgba(22, 163, 74, 0.18); color: #166534; }
      .badge.warning { background: rgba(245, 158, 11, 0.2); color: #92400e; }
      .badge.accent { background: rgba(96, 165, 250, 0.2); color: #1e40af; }
      .badge.danger { background: rgba(220, 38, 38, 0.15); color: #b91c1c; }
      .line {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 9px 0;
        border-top: 1px solid var(--divider-color, #eee);
        line-height: 1.35;
        font-size: 0.93rem;
      }
      .line ha-icon { --mdc-icon-size: 20px; flex: none; margin-top: 1px; color: var(--secondary-text-color, #727272); }
      .line.ok ha-icon { color: #16a34a; }
      .line.warn ha-icon { color: #d97706; }
      .line.bad ha-icon { color: #dc2626; }
    `]}};g([x({attribute:!1})],ct.prototype,"hass",2),g([x({attribute:!1})],ct.prototype,"info",2);customElements.get("stufa-info-dialog")||customElements.define("stufa-info-dialog",ct);var Ft=[{id:"6h",label:"6 ore",ms:6*36e5},{id:"24h",label:"24 ore",ms:24*36e5},{id:"3d",label:"3 giorni",ms:3*864e5},{id:"7d",label:"7 giorni",ms:7*864e5}],W=220,G=10,L=40,ni=22,wt=12,A=class extends ${constructor(){super(...arguments);this._range="24h";this._loading=!1;this._error="";this._w=640;this._hover=null;this._values=[];this._segs=[];this._t0=0;this._t1=0;this._n=240;this._raw=[];this._rawStates=[];this._seq=0;this._onKey=t=>{t.key==="Escape"&&this._close()}}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._onKey),this._timer=window.setInterval(()=>void this._load(),6e4),this._load()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._onKey),this._ro?.disconnect(),this._timer&&window.clearInterval(this._timer)}firstUpdated(){let t=this.renderRoot.querySelector(".chartwrap");t&&(this._ro=new ResizeObserver(i=>{let o=Math.floor(i[0]?.contentRect.width??640);o>100&&Math.abs(o-this._w)>2&&(this._w=o,this._recompute())}),this._ro.observe(t))}_close(){this.dispatchEvent(new CustomEvent("closed")),this.remove()}async _history(t,i,o){return this.hass.callWS({type:"history/history_during_period",start_time:new Date(i).toISOString(),end_time:new Date(o).toISOString(),entity_ids:t,include_start_time_state:!0,significant_changes_only:!1,minimal_response:!0,no_attributes:!0})}async _load(){if(!this.hass||!this.info)return;let t=++this._seq,i=Ft.find(l=>l.id===this._range)??Ft[1],o=Date.now(),n=o-i.ms,r=[this.info.sources.power_sensor];this.info.entities.stato&&r.push(this.info.entities.stato),this._loading=!0;try{let l=await this._history(r,n,o);if(t!==this._seq)return;this._t0=n,this._t1=o,this._raw=me(l[this.info.sources.power_sensor]),this._rawStates=this.info.entities.stato?l[this.info.entities.stato]??[]:[],this._error="",this._recompute()}catch(l){t===this._seq&&(this._error=`Impossibile leggere lo storico: ${l instanceof Error?l.message:String(l)}`)}finally{t===this._seq&&(this._loading=!1)}}_recompute(){this._t1&&(this._n=Math.max(60,Math.min(480,Math.floor((this._w-L-8)/2))),this._values=ge(this._raw,this._t0,this._t1,this._n,30*6e4),this._segs=yt(this._rawStates,this._t0,this._t1))}_setRange(t){this._range=t,this._hover=null,this._load()}_move(t){let o=t.currentTarget.getBoundingClientRect(),n=t.clientX-o.left,r=Math.round((n-L)/(this._w-L-8)*(this._n-1));this._hover=r>=0&&r<this._n?r:null}render(){if(!this.info)return c;let t=this.info.settings,i=this._values.filter(u=>u!==null),o=Math.max(t.ignition_above*1.1,...i.length?i:[0]),n=be(0,o,5),r=this._w,l=r-L-8,a=G+W+wt+ni+6,h=u=>L+(this._n<=1?0:u/(this._n-1)*l),f=u=>G+W-(u-n.min)/(n.max-n.min||1)*W,p=u=>L+(u-this._t0)/(this._t1-this._t0||1)*l,m=[{v:t.off_below,c:S.spenta,l:"spenta"},{v:t.shutdown_min,c:S.spegnimento,l:"spegnimento"},{v:t.shutdown_max,c:S.spegnimento,l:""},{v:t.ignition_above,c:S.accensione,l:"accensione"}],v=this._hover,y=v!==null&&this._n>1?this._t0+v/(this._n-1)*(this._t1-this._t0):null,E=v!==null?this._values[v]:null,w=y!==null?fe(this._segs,y):null;return d`
      <div class="backdrop" @click=${u=>u.target===u.currentTarget&&this._close()}>
        <div class="panel wide" role="dialog" aria-modal="true" aria-label="Grafici stufa">
          <div class="head">
            <div class="title">Grafici della stufa</div>
            <button class="x" aria-label="Chiudi" @click=${()=>this._close()}>✕</button>
          </div>
          <div class="body">
            <div class="ranges">
              ${Ft.map(u=>d`<button class=${u.id===this._range?"chip on":"chip"} @click=${()=>this._setRange(u.id)}>${u.label}</button>`)}
              ${this._loading?d`<span class="load">aggiorno…</span>`:c}
            </div>
            <div class="chartwrap">
              <div class="tip">
                ${y!==null?d`<b>${xe(y)}</b> · ${E!==null?`${_(E,0)} W`:"nessun dato"}${w?d` · <span style="color:${S[w]==="transparent"?"inherit":S[w]}">${R[w]}</span>`:c}`:d`<span class="muted">Passa sopra il grafico per leggere i valori</span>`}
              </div>
              <svg width=${r} height=${a} viewBox="0 0 ${r} ${a}" @pointermove=${u=>this._move(u)} @pointerleave=${()=>this._hover=null}>
                ${n.ticks.map(u=>B`
                  <line x1=${L} x2=${r-8} y1=${f(u)} y2=${f(u)} stroke="var(--divider-color,#ddd)" stroke-width="1" />
                  <text x=${L-6} y=${f(u)+4} text-anchor="end" class="ax">${_(u)}</text>`)}
                ${m.map(u=>B`<line x1=${L} x2=${r-8} y1=${f(u.v)} y2=${f(u.v)} stroke=${u.c} stroke-width="1.2" stroke-dasharray="5 4" opacity="0.9" />
                  ${u.l?B`<text x=${r-10} y=${f(u.v)-3} text-anchor="end" class="th" fill=${u.c}>${u.l} ${_(u.v,u.v%1?1:0)} W</text>`:c}`)}
                <path d=${ye(this._values,h,f)} fill="none" stroke="var(--primary-color,#03a9f4)" stroke-width="1.8" stroke-linejoin="round" />
                ${v!==null&&E!==null?B`<line x1=${h(v)} x2=${h(v)} y1=${G} y2=${G+W} stroke="var(--secondary-text-color,#888)" stroke-width="1" /><circle cx=${h(v)} cy=${f(E)} r="4" fill="var(--primary-color,#03a9f4)" />`:c}
                ${this._segs.map(u=>B`<rect x=${p(u.from)} y=${G+W+4} width=${Math.max(1,p(u.to)-p(u.from))} height=${wt} fill=${S[u.state]==="transparent"?"#9aa1ad":S[u.state]} opacity=${u.state==="non_disponibile"?.35:.9} />`)}
                ${_e(this._t0,this._t1).map(u=>B`
                  <line x1=${p(u.t)} x2=${p(u.t)} y1=${G+W+wt+4} y2=${G+W+wt+8} stroke="var(--secondary-text-color,#888)" />
                  <text x=${p(u.t)} y=${a-4} text-anchor="middle" class=${u.major?"ax maj":"ax"}>${u.label}</text>`)}
              </svg>
              <div class="legend">
                ${["spenta","accensione","accesa","spegnimento"].map(u=>d`<span><i style="background:${S[u]}"></i>${R[u]}</span>`)}
              </div>
            </div>
            ${this._error?d`<div class="err">${this._error}</div>`:c}
            ${!this._loading&&!this._error&&i.length===0?d`<div class="empty">Nessun dato di potenza nel periodo.</div>`:c}
          </div>
        </div>
      </div>
    `}static{this.styles=[z,k`
      .ranges { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-bottom: 8px; }
      .chip { border: 1px solid var(--divider-color, #ccc); background: transparent; color: inherit; border-radius: 999px; padding: 5px 12px; font-size: 0.85rem; cursor: pointer; }
      .chip.on { background: var(--primary-color, #03a9f4); color: #fff; border-color: transparent; }
      .load { font-size: 0.8rem; color: var(--secondary-text-color, #727272); }
      .chartwrap { width: 100%; }
      svg { display: block; touch-action: pan-y; }
      .ax { font-size: 10px; fill: var(--secondary-text-color, #727272); }
      .ax.maj { font-weight: 700; }
      .th { font-size: 10px; }
      .tip { min-height: 22px; font-size: 0.88rem; margin-bottom: 4px; }
      .muted { color: var(--secondary-text-color, #727272); }
      .legend { display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.8rem; margin-top: 6px; color: var(--secondary-text-color, #727272); }
      .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 5px; }
    `]}};g([x({attribute:!1})],A.prototype,"hass",2),g([x({attribute:!1})],A.prototype,"info",2),g([b()],A.prototype,"_range",2),g([b()],A.prototype,"_loading",2),g([b()],A.prototype,"_error",2),g([b()],A.prototype,"_w",2),g([b()],A.prototype,"_hover",2),g([b()],A.prototype,"_values",2),g([b()],A.prototype,"_segs",2);customElements.get("stufa-charts-dialog")||customElements.define("stufa-charts-dialog",A);var ri={soglie:[{key:"shutdown_needs_switch_off",label:"Spegnimento solo con l'interruttore spento",hint:"La fascia di spegnimento vale solo se l'interruttore della stufa \xE8 spento; con l'interruttore acceso la stessa potenza vuol dire 'in funzione'."}],comportamento:[{key:"sync_switch_on",label:"Accendi l'interruttore quando la stufa parte",hint:"Se la stufa si accende da sola, l'interruttore della stufa si allinea."},{key:"sync_switch_off",label:"Spegni l'interruttore a stufa spenta",hint:"Dopo il periodo di grazia l'interruttore della stufa si spegne quando la stufa risulta spenta."},{key:"show_switch_button",label:"Pulsante di accensione sulla scheda",hint:"Mostra il pulsante per accendere e spegnere la stufa con il suo interruttore."}],notifiche:[{key:"notify_events",label:"Avvisa su accensione e spegnimento",hint:""},{key:"notify_sensor_problem",label:"Avvisa se il sensore non risponde",hint:""}]},C=class extends ${constructor(){super(...arguments);this._busy=!1;this._error="";this._msg="";this._suggest=null;this._onKey=t=>{t.key==="Escape"&&this._close()}}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._onKey),this._s={...this.info.settings},this._src={power_sensor:this.info.sources.power_sensor??"",switch:this.info.sources.switch??"",plug:this.info.sources.plug??"",energy_sensor:this.info.sources.energy_sensor??""}}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._onKey)}_close(){this.dispatchEvent(new CustomEvent("closed")),this.remove()}_set(t,i){this._s={...this._s,[t]:i},this._msg=""}_typed(t,i){let o=i.target.value.replace(",","."),n=Number(o);if(o.trim()===""||!Number.isFinite(n)){i.target.value=String(this._s[t.key]);return}this._set(t.key,Dt(n,t.min,t.max,t.step))}_step(t,i){this._set(t.key,Dt(this._s[t.key]+i*t.step,t.min,t.max,t.step))}async _suggestFromHistory(){this._busy=!0,this._error="";try{this._suggest=await this.hass.callWS({type:"stufa_pellet/suggest",entry_id:this.info.entry_id,days:14})}catch(t){this._error=`Non riesco a leggere lo storico: ${t instanceof Error?t.message:String(t)}`}finally{this._busy=!1}}_applySuggestion(){let t=this._suggest?.suggestion;if(!t)return;let i={...this._s};for(let o of["off_below","ignition_above","shutdown_min","shutdown_max"]){let n=t[o];typeof n=="number"&&(i[o]=n)}this._s=i,this._suggest=null,this._msg="Soglie proposte applicate: controlla e premi Salva."}async _save(){let t=Ht(this._s);if(t.length){this._error=t[0];return}if(!this._src.power_sensor){this._error="Il sensore di potenza \xE8 obbligatorio.";return}this._busy=!0,this._error="";try{await this.hass.callWS({type:"stufa_pellet/update",entry_id:this.info.entry_id,settings:this._s,sources:this._src}),this.dispatchEvent(new CustomEvent("saved")),this._close()}catch(i){this._error=`Impossibile salvare: ${i instanceof Error?i.message:String(i)}`}finally{this._busy=!1}}_entityRow(t,i,o,n){let r=`dl-${i}`,l=Object.keys(this.hass.states).filter(a=>o.includes(a.split(".")[0]));return d`
      <div class="row col">
        <div class="lab">${t}${n?d` <span class="req">obbligatorio</span>`:d` <span class="opt">facoltativo</span>`}</div>
        <input
          class="txt"
          list=${r}
          .value=${this._src[i]}
          placeholder=${o.join(" / ")+".nome"}
          @change=${a=>{this._src={...this._src,[i]:a.target.value.trim()}}}
        />
        <datalist id=${r}>${l.map(a=>d`<option value=${a}></option>`)}</datalist>
        ${this._src[i]&&!this.hass.states[this._src[i]]?d`<div class="hint warn">Entità non trovata in Home Assistant.</div>`:c}
      </div>
    `}_numRow(t){return d`
      <div class="row">
        <div class="t"><div class="lab">${t.label}</div><div class="hint">${t.hint}</div></div>
        <div class="num">
          <button class="st" aria-label="Diminuisci" @click=${()=>this._step(t,-1)}>−</button>
          <input type="text" inputmode="decimal" .value=${String(this._s[t.key])} aria-label=${t.label} @change=${i=>this._typed(t,i)} />
          <span class="unit">${t.unit}</span>
          <button class="st" aria-label="Aumenta" @click=${()=>this._step(t,1)}>+</button>
        </div>
      </div>
    `}_toggleRows(t){return ri[t].map(i=>d`
        <div class="row">
          <div class="t"><div class="lab">${i.label}</div>${i.hint?d`<div class="hint">${i.hint}</div>`:c}</div>
          <button class=${this._s[i.key]?"sw on":"sw"} role="switch" aria-checked=${this._s[i.key]?"true":"false"} aria-label=${i.label} @click=${()=>this._set(i.key,!this._s[i.key])}><span class="knob"></span></button>
        </div>
      `)}render(){if(!this.hass||!this._s)return c;let t=Ht(this._s),i=this._suggest?.suggestion??null;return d`
      <div class="backdrop" @click=${o=>o.target===o.currentTarget&&this._close()}>
        <div class="panel" role="dialog" aria-modal="true" aria-label="Preferenze stufa">
          <div class="head">
            <div class="title">Preferenze della stufa</div>
            <button class="x" aria-label="Chiudi" @click=${()=>this._close()}>✕</button>
          </div>
          <div class="body">
            <div class="sec">Sensori</div>
            ${this._entityRow("Sensore di potenza (W)","power_sensor",["sensor"],!0)}
            ${this._entityRow("Interruttore di accensione della stufa (per esempio lo Shelly)","switch",["switch","input_boolean","light"],!1)}
            ${this._entityRow("Interruttore della presa (solo stato)","plug",["switch","input_boolean","light"],!1)}
            ${this._entityRow("Contatore di energia (kWh)","energy_sensor",["sensor"],!1)}

            <div class="sec">Soglie di potenza</div>
            ${we.map(o=>this._numRow(o))}
            ${this._toggleRows("soglie")}
            <div class="row col">
              <button class="btn" ?disabled=${this._busy} @click=${()=>void this._suggestFromHistory()}>Suggerisci le soglie dallo storico</button>
              ${this._suggest?i?d`<div class="sugg">
                      Dai ${_(this._suggest.samples)} campioni degli ultimi ${this._suggest.days} giorni:
                      ${Object.entries(i).map(([o,n])=>d`<span class="pill">${o.replaceAll("_"," ")} ${_(n,1)} W</span>`)}
                      <div><button class="btn primary" @click=${()=>this._applySuggestion()}>Usa questi valori</button></div>
                    </div>`:d`<div class="hint">Lo storico non basta per proporre soglie: accendi e spegni la stufa almeno una volta con il sensore attivo.</div>`:c}
            </div>

            <div class="sec">Livelli P1-P3 e ventilatore</div>
            <div class="row col"><div class="hint">La scheda stima il livello di potenza (P1-P3) e la percentuale del ventilatore dalla potenza della presa, con la mediana degli ultimi 2 minuti (il picco di pulizia ogni 20 minuti non conta). Qui si indica quanto assorbe la stufa a ogni livello col ventilatore al minimo e al massimo: misurali con la stufa in funzione. Dove due livelli si sovrappongono la stima è segnata con «≈».</div></div>
            ${Se.map(o=>this._numRow(o))}

            <div class="sec">Comportamento</div>
            ${Ee.map(o=>this._numRow(o))}
            ${this._toggleRows("comportamento")}

            <div class="sec">Notifiche</div>
            ${this._toggleRows("notifiche")}
            <div class="row col">
              <div class="lab">Servizio di notifica</div>
              <input class="txt" .value=${this._s.notify_service} placeholder="notify.mobile_app_telefono (vuoto = notifica di Home Assistant)" @change=${o=>this._set("notify_service",o.target.value.trim())} />
            </div>

            <div class="sec">Aspetto</div>
            <div class="row col">
              <div class="lab">Colore delle ceramiche</div>
              <div class="tiles">
                ${Object.entries(at).map(([o,[n,r]])=>d`<button class=${this._s.tile_color===o?"tile on":"tile"} style="background:linear-gradient(135deg,${r},${n})" aria-label=${o} @click=${()=>this._set("tile_color",o)}><span>${o}</span></button>`)}
              </div>
            </div>

            ${t.length?d`<div class="err">${t[0]}</div>`:c}
            ${this._error?d`<div class="err">${this._error}</div>`:c}
            ${this._msg?d`<div class="okbox">${this._msg}</div>`:c}
          </div>
          <div class="foot">
            <button class="btn" @click=${()=>this._close()}>Annulla</button>
            <button class="btn primary" ?disabled=${this._busy||t.length>0} @click=${()=>void this._save()}>Salva</button>
          </div>
        </div>
      </div>
    `}static{this.styles=[z,k`
      .sec { font-weight: 600; font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--secondary-text-color, #727272); margin: 16px 0 4px; }
      .sec:first-child { margin-top: 0; }
      .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; border-top: 1px solid var(--divider-color, #eee); }
      .row.col { flex-direction: column; align-items: stretch; gap: 6px; }
      .t { flex: 1; min-width: 0; }
      .lab { font-size: 0.93rem; }
      .hint { font-size: 0.78rem; color: var(--secondary-text-color, #727272); margin-top: 2px; line-height: 1.3; }
      .hint.warn { color: #b45309; }
      .req, .opt { font-size: 0.7rem; color: var(--secondary-text-color, #727272); }
      .txt { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: inherit; font-size: 0.9rem; }
      .num { display: flex; align-items: center; gap: 4px; flex: none; }
      .num input { width: 62px; text-align: center; padding: 6px 4px; border-radius: 8px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: inherit; font-size: 0.95rem; }
      .unit { width: 18px; font-size: 0.8rem; color: var(--secondary-text-color, #727272); }
      .st { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--divider-color, #ccc); background: var(--secondary-background-color, #f4f4f4); color: inherit; font-size: 1.1rem; cursor: pointer; }
      .sw { flex: none; width: 44px; height: 26px; border-radius: 13px; border: 0; background: var(--disabled-color, #bdbdbd); position: relative; cursor: pointer; transition: background 0.2s; }
      .sw.on { background: var(--primary-color, #03a9f4); }
      .sw .knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
      .sw.on .knob { transform: translateX(18px); }
      .tiles { display: flex; gap: 10px; }
      .tile { flex: 1; height: 44px; border-radius: 10px; border: 2px solid transparent; cursor: pointer; color: #fff; font-size: 0.8rem; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5); text-transform: capitalize; }
      .tile.on { border-color: var(--primary-text-color, #222); }
      .sugg { font-size: 0.85rem; line-height: 1.9; }
      .pill { display: inline-block; padding: 1px 8px; margin: 0 4px 0 0; border-radius: 999px; background: var(--secondary-background-color, #eee); font-size: 0.78rem; }
    `]}};g([x({attribute:!1})],C.prototype,"hass",2),g([x({attribute:!1})],C.prototype,"info",2),g([b()],C.prototype,"_s",2),g([b()],C.prototype,"_src",2),g([b()],C.prototype,"_busy",2),g([b()],C.prototype,"_error",2),g([b()],C.prototype,"_msg",2),g([b()],C.prototype,"_suggest",2);customElements.get("stufa-settings-dialog")||customElements.define("stufa-settings-dialog",C);var I=class extends ${constructor(){super(...arguments);this._busy=!1;this._error="";this._onKey=t=>{t.key==="Escape"&&this._close()}}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._onKey),this._sch=JSON.parse(JSON.stringify(this.info.schedule))}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._onKey)}_close(){this.dispatchEvent(new CustomEvent("closed")),this.remove()}_patch(t,i){this._sch={...this._sch,slots:this._sch.slots.map((o,n)=>n===t?{...o,...i}:o)}}_toggleDay(t,i){let o=this._sch.slots[t].days;this._patch(t,{days:o.includes(i)?o.filter(n=>n!==i):[...o,i].sort((n,r)=>n-r)})}_add(){this._sch={...this._sch,slots:[...this._sch.slots,Oe()]}}_remove(t){this._sch={...this._sch,slots:this._sch.slots.filter((i,o)=>o!==t)}}_duplicate(t){let i=JSON.parse(JSON.stringify(this._sch.slots[t]));this._sch={...this._sch,slots:[...this._sch.slots.slice(0,t+1),i,...this._sch.slots.slice(t+1)]}}async _save(){let t=jt(this._sch);if(t.length){this._error=t[0];return}this._busy=!0,this._error="";try{await this.hass.callWS({type:"stufa_pellet/schedule",entry_id:this.info.entry_id,schedule:this._sch}),this.dispatchEvent(new CustomEvent("saved")),this._close()}catch(i){let o=i instanceof Error?i.message:i?.message??String(i);this._error=`Impossibile salvare: ${o}`}finally{this._busy=!1}}_week(){let t=Me(this._sch.slots);return d`
      <div class="week" aria-label="Vista della settimana">
        ${t.map((i,o)=>d`
            <div class="wd"><span>${$t[o]}</span>
              <div class="wbar">${i.map(([n,r])=>d`<i style="left:${n/1440*100}%;width:${(r-n)/1440*100}%"></i>`)}</div>
            </div>`)}
        <div class="wd axis"><span></span><div class="wax"><b>0</b><b>6</b><b>12</b><b>18</b><b>24</b></div></div>
      </div>`}render(){if(!this._sch)return c;let t=jt(this._sch);return d`
      <div class="backdrop" @click=${i=>i.target===i.currentTarget&&this._close()}>
        <div class="panel" role="dialog" aria-modal="true" aria-label="Programma stufa">
          <div class="head">
            <div class="title">Programma settimanale</div>
            <button class="x" aria-label="Chiudi" @click=${()=>this._close()}>✕</button>
          </div>
          <div class="body">
            <div class="row top">
              <div class="t"><div class="lab">Programmazione attiva</div>
                <div class="hint">Alle ore indicate l'interruttore della stufa si accende e si spegne. Se la accendi o la spegni a mano, il programma riprende alla fascia successiva.</div></div>
              <button class=${this._sch.enabled?"sw on":"sw"} role="switch" aria-checked=${this._sch.enabled?"true":"false"} aria-label="Programmazione attiva" @click=${()=>this._sch={...this._sch,enabled:!this._sch.enabled}}><span class="knob"></span></button>
            </div>

            ${this._week()}

            <div class="sec">Fasce</div>
            ${this._sch.slots.length===0?d`<div class="empty">Nessuna fascia: aggiungine una.</div>`:c}
            ${this._sch.slots.map((i,o)=>{let n=Ut(i);return d`
                <div class="slot ${n?"bad":""}">
                  <div class="days" role="group" aria-label="Giorni">
                    ${Ae.map((r,l)=>d`<button class=${i.days.includes(l)?"day on":"day"} title=${$t[l]} aria-pressed=${i.days.includes(l)?"true":"false"} @click=${()=>this._toggleDay(o,l)}>${r}</button>`)}
                  </div>
                  <div class="times">
                    <label>Accendi<input type="time" .value=${i.start} @change=${r=>this._patch(o,{start:r.target.value})} /></label>
                    <label>Spegni<input type="time" .value=${i.end} @change=${r=>this._patch(o,{end:r.target.value})} /></label>
                    <span class="grow"></span>
                    <button class="mini" aria-label="Duplica fascia" title="Duplica" @click=${()=>this._duplicate(o)}>⧉</button>
                    <button class="mini del" aria-label="Elimina fascia" title="Elimina" @click=${()=>this._remove(o)}>🗑</button>
                  </div>
                  <div class="sum">${n??`${Te(i.days)}${ze(i)?" \xB7 finisce il giorno dopo":""}`}</div>
                </div>`})}
            <button class="btn" @click=${()=>this._add()}>+ Aggiungi fascia</button>

            ${t.length?d`<div class="err">${t[0]}</div>`:c}
            ${this._error?d`<div class="err">${this._error}</div>`:c}
          </div>
          <div class="foot">
            <button class="btn" @click=${()=>this._close()}>Annulla</button>
            <button class="btn primary" ?disabled=${this._busy||t.length>0} @click=${()=>void this._save()}>Salva</button>
          </div>
        </div>
      </div>
    `}static{this.styles=[z,k`
      .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 0 12px; }
      .t { flex: 1; min-width: 0; }
      .lab { font-size: 0.95rem; font-weight: 500; }
      .hint { font-size: 0.78rem; color: var(--secondary-text-color, #727272); margin-top: 2px; line-height: 1.3; }
      .sw { flex: none; width: 44px; height: 26px; border-radius: 13px; border: 0; background: var(--disabled-color, #bdbdbd); position: relative; cursor: pointer; transition: background 0.2s; }
      .sw.on { background: var(--primary-color, #03a9f4); }
      .sw .knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
      .sw.on .knob { transform: translateX(18px); }
      .week { margin: 4px 0 12px; padding: 10px 12px; border-radius: 12px; background: var(--secondary-background-color, #f2f2f2); }
      .wd { display: flex; align-items: center; gap: 8px; margin: 3px 0; font-size: 0.75rem; }
      .wd span { width: 28px; color: var(--secondary-text-color, #727272); }
      .wbar { position: relative; flex: 1; height: 10px; border-radius: 5px; background: rgba(127, 127, 127, 0.18); overflow: hidden; }
      .wbar i { position: absolute; top: 0; bottom: 0; background: #ef4444; opacity: 0.85; }
      .wax { flex: 1; display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--secondary-text-color, #727272); }
      .wax b { font-weight: 400; }
      .sec { font-weight: 600; font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--secondary-text-color, #727272); margin: 8px 0 6px; }
      .slot { padding: 10px; margin-bottom: 8px; border: 1px solid var(--divider-color, #ddd); border-radius: 12px; }
      .slot.bad { border-color: #dc2626; }
      .days { display: flex; gap: 5px; margin-bottom: 8px; }
      .day { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--divider-color, #ccc); background: transparent; color: inherit; font-size: 0.85rem; cursor: pointer; }
      .day.on { background: var(--primary-color, #03a9f4); color: #fff; border-color: transparent; }
      .times { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; }
      .times label { display: flex; flex-direction: column; font-size: 0.72rem; color: var(--secondary-text-color, #727272); gap: 2px; }
      .times input { padding: 6px 8px; border-radius: 8px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: var(--primary-text-color, #212121); font-size: 0.95rem; }
      .grow { flex: 1; }
      .mini { border: 1px solid var(--divider-color, #ccc); background: transparent; color: inherit; border-radius: 8px; width: 34px; height: 34px; cursor: pointer; font-size: 0.95rem; }
      .sum { margin-top: 6px; font-size: 0.78rem; color: var(--secondary-text-color, #727272); }
      .slot.bad .sum { color: #b91c1c; }
    `]}};g([x({attribute:!1})],I.prototype,"hass",2),g([x({attribute:!1})],I.prototype,"info",2),g([b()],I.prototype,"_sch",2),g([b()],I.prototype,"_busy",2),g([b()],I.prototype,"_error",2);customElements.get("stufa-schedule-dialog")||customElements.define("stufa-schedule-dialog",I);var ai=s=>s<60?`${s} min`:s%60===0?`${s/60} h`:`${Math.floor(s/60)} h ${s%60} min`,H=class extends ${constructor(){super(...arguments);this._custom="";this._busy=!1;this._error="";this._onKey=t=>{t.key==="Escape"&&this._close()}}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._onKey)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._onKey)}_close(){this.dispatchEvent(new CustomEvent("closed")),this.remove()}async _start(t){if(!Number.isInteger(t)||t<0||t>1440){this._error="Scegli un tempo tra 1 minuto e 24 ore.";return}this._busy=!0,this._error="";try{await this.hass.callWS({type:"stufa_pellet/timer",entry_id:this.info.entry_id,minutes:t}),this.dispatchEvent(new CustomEvent("saved")),this._close()}catch(i){let o=i instanceof Error?i.message:i?.message??String(i);this._error=`Impossibile avviare il timer: ${o}`}finally{this._busy=!1}}render(){if(!this.info)return c;let t=this.info.timer_until?Date.parse(this.info.timer_until):null,i=Date.now(),o=Number(this._custom.replace(",","."));return d`
      <div class="backdrop" @click=${n=>n.target===n.currentTarget&&this._close()}>
        <div class="panel" role="dialog" aria-modal="true" aria-label="Timer stufa">
          <div class="head">
            <div class="title">Timer</div>
            <button class="x" aria-label="Chiudi" @click=${()=>this._close()}>✕</button>
          </div>
          <div class="body">
            ${t!==null&&t>i?d`<div class="active">Timer in corso: la stufa si spegne ${_t(t,i)} (tra ${Y(t-i)}).
                  <div><button class="btn" ?disabled=${this._busy} @click=${()=>void this._start(0)}>Annulla il timer</button></div></div>`:c}
            <div class="lab">Accendi ora e spegni dopo</div>
            <div class="chips">
              ${Ce.map(n=>d`<button class="chip" ?disabled=${this._busy} @click=${()=>void this._start(n)}>${ai(n)}</button>`)}
            </div>
            <div class="custom">
              <input type="text" inputmode="numeric" placeholder="minuti" .value=${this._custom} @input=${n=>this._custom=n.target.value} aria-label="Minuti" />
              <button class="btn primary" ?disabled=${this._busy||!(o>=1)} @click=${()=>void this._start(Math.round(o))}>Avvia</button>
            </div>
            <div class="hint">Il timer accende subito l'interruttore e lo spegne alla scadenza; durante il timer le fasce del programma non intervengono.</div>
            ${this._error?d`<div class="err">${this._error}</div>`:c}
          </div>
        </div>
      </div>
    `}static{this.styles=[z,k`
      .lab { font-size: 0.95rem; font-weight: 500; margin-bottom: 8px; }
      .chips { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .chip { padding: 12px 6px; border-radius: 12px; border: 1px solid var(--divider-color, #ccc); background: var(--secondary-background-color, #f4f4f4); color: inherit; font-size: 0.95rem; cursor: pointer; }
      .chip:hover { border-color: var(--primary-color, #03a9f4); }
      .custom { display: flex; gap: 8px; margin: 12px 0; }
      .custom input { flex: 1; padding: 9px 10px; border-radius: 10px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: inherit; font-size: 0.95rem; }
      .hint { font-size: 0.78rem; color: var(--secondary-text-color, #727272); line-height: 1.35; }
      .active { padding: 10px 12px; margin-bottom: 14px; border-radius: 12px; background: rgba(96, 165, 250, 0.16); font-size: 0.9rem; }
      .active .btn { margin-top: 8px; }
    `]}};g([x({attribute:!1})],H.prototype,"hass",2),g([x({attribute:!1})],H.prototype,"info",2),g([b()],H.prototype,"_custom",2),g([b()],H.prototype,"_busy",2),g([b()],H.prototype,"_error",2);customElements.get("stufa-timer-dialog")||customElements.define("stufa-timer-dialog",H);var Bt=24*36e5,O=class extends ${constructor(){super(...arguments);this._config={type:"custom:stufa-pellet-card"};this._info=null;this._error="";this._segs=[];this._now=Date.now();this._loadedAt=0;this._timelineAt=0;this._loading=!1;this._syncers=new Set}setConfig(t){this._config={...t},this.toggleAttribute("compact",t.compact===!0),this._info=null,this._loadedAt=0}getCardSize(){return 6}static getStubConfig(){return{type:"custom:stufa-pellet-card"}}connectedCallback(){super.connectedCallback(),this._tick=window.setInterval(()=>this._now=Date.now(),15e3)}disconnectedCallback(){super.disconnectedCallback(),this._tick&&window.clearInterval(this._tick)}updated(){this.hass&&!this._loading&&(!this._info||Date.now()-this._loadedAt>5*6e4)&&this._loadInfo(),this._info&&Date.now()-this._timelineAt>5*6e4&&this._loadTimeline()}async _loadInfo(){this._loading=!0;try{let t={type:"stufa_pellet/info"};this._config.entry_id&&(t.entry_id=this._config.entry_id),this._info=await this.hass.callWS(t),this._error=""}catch(t){let i=t instanceof Error?t.message:t?.message??String(t);this._error=`Stufa non configurata o integrazione non caricata (${i}).`}finally{this._loadedAt=Date.now(),this._loading=!1}}async _loadTimeline(){let t=this._info?.entities.stato;if(!t)return;this._timelineAt=Date.now();let i=Date.now(),o=i-Bt;try{let n=await this.hass.callWS({type:"history/history_during_period",start_time:new Date(o).toISOString(),end_time:new Date(i).toISOString(),entity_ids:[t],include_start_time_state:!0,significant_changes_only:!1,minimal_response:!0,no_attributes:!0});this._segs=yt(n[t],o,i)}catch{this._timelineAt=0}}async _open(t){if(!this._info)return;if(t==="stufa-schedule-dialog"||t==="stufa-timer-dialog"||t==="stufa-settings-dialog"){for(;this._loading;)await new Promise(n=>setTimeout(n,50));if(await this._loadInfo(),!this._info)return}let i=document.createElement(t);i.hass=this.hass,i.info=this._info,i.addEventListener("saved",()=>{this._loadedAt=0,this._timelineAt=0,this._loadInfo()}),document.body.appendChild(i);let o=()=>{i.isConnected&&(i.hass=this.hass)};this._syncers.add(o),i.addEventListener("closed",()=>this._syncers.delete(o))}willUpdate(){for(let t of this._syncers)t()}_toggleSwitch(){let t=this._info?.sources.switch;t&&this.hass.callService("homeassistant","toggle",{entity_id:t})}_live(){let t=this._info,i=t.entities,o=i.stato?this.hass.states[i.stato]:void 0,n=o?.attributes??{},r=lt(o?.state??t.state),l=N(n.potenza)??N(this.hass.states[t.sources.power_sensor]?.state),a=n.da??t.since,h=t.sources.switch?this.hass.states[t.sources.switch]?.state:void 0,f=t.sources.plug?this.hass.states[t.sources.plug]?.state:void 0,p=J=>i[J]?N(this.hass.states[i[J]]?.state):null,m=i.modo?this.hass.states[i.modo]:void 0,v=m?.attributes??{},y=["programma","manuale","fuori_programma","timer"].includes(String(m?.state))?m.state:t.mode,E=v.prossimo_evento??t.next_event?.time??null,w=v.prossima_azione?v.prossima_azione==="accensione"?"on":"off":t.next_event?.kind??"off",u=v.timer_fino??t.timer_until;return{mode:y,scheduleEnabled:v.programmazione_attiva===!0||m===void 0&&t.schedule.enabled,next:E?{kind:w,time:Date.parse(E)}:null,timerUntil:u?Date.parse(u):null,state:r,power:l,sinceMs:a?Date.parse(a):null,switchOn:h==="on"?!0:h==="off"?!1:null,plugOn:f==="on"?!0:f==="off"?!1:null,blocked:n.azioni_bloccate===!0,level:typeof n.livello=="string"?n.livello:null,fan:N(n.ventilatore),levelUncertain:n.livello_incerto===!0,ignitions:p("accensioni_oggi"),hours:p("ore_in_funzione_oggi"),energy:p("energia_oggi")}}_tile(t,i,o,n=""){return d`<div class="tile"><ha-icon icon=${t}></ha-icon><div class="v">${o}</div><div class="l">${i}</div>${n?d`<div class="s">${n}</div>`:c}</div>`}render(){if(!this.hass)return c;let t=this._config.title??this._info?.title??"Stufa a pellet";if(this._error&&!this._info)return d`<ha-card><div class="pad"><div class="title">${t}</div><div class="errbox">${this._error}</div></div></ha-card>`;if(!this._info)return d`<ha-card><div class="pad"><div class="title">${t}</div><div class="muted">Carico…</div></div></ha-card>`;let i=this._info,o=i.settings,n=this._live(),r=ue(n.power,o),l=xt[n.state],a=n.sinceMs!==null?Y(this._now-n.sinceMs):"",h=this._now-Bt,f=m=>Math.min(100,Math.max(0,(m-h)/Bt*100)),p=this._config.compact===!0;return d`
      <ha-card class=${p?"compact-host":""}>
        <div class=${p?"pad compact":"pad"}>
          <div class="top">
            <div class="title">${t}</div>
            <div class="pill ${l}"><i></i>${R[n.state]}${a&&n.state!=="non_disponibile"?d`<span class="since"> · da ${a}</span>`:c}</div>
          </div>

          ${i.sources.switch?(()=>{let m=Le(n.mode,n.scheduleEnabled,n.next,n.timerUntil,this._now);return d`<div class="mode ${m.tone}"><ha-icon icon=${m.icon}></ha-icon><span class="ml">${m.label}</span>${m.detail?d`<span class="md">· ${m.detail}</span>`:c}</div>`})():c}

          <div class="main">
            <div class="stove">${vt(Pe(n.state,o.tile_color))}</div>
            <div class="side">
              <div class="power">
                <div class="pw">
                  <div class="big">${_(n.power,n.power!==null&&n.power%1?1:0)}<span> W</span></div>
                  <div class="muted">potenza della presa</div>
                </div>
                ${n.level?d`<div class="est" role="img" aria-label=${ke(n.level,n.fan,n.levelUncertain)} title="Stima dalla potenza assorbita (mediana degli ultimi 2 minuti)">
                      <div class="lg">${vt(ce(Number(n.level.slice(1)),n.levelUncertain))}</div>
                      <div class="fan">
                        <div class="fanicon" style=${`--spin:${le(n.fan)??0}s`}>${vt(de())}</div>
                        <div class="fv">${n.fan===null?"\u2013":`${Math.round(n.fan)} %`}</div>
                      </div>
                    </div>`:c}
              </div>
              <div class="gauge" aria-label="Potenza e soglie">
                <div class="bar">
                  ${r.zones.map(m=>d`<div class="zone" style="left:${m.from}%;width:${Math.max(.8,m.to-m.from)}%;background:${m.color}" title=${m.label}></div>`)}
                  ${r.marker!==null?d`<div class="mark" style="left:${r.marker}%"></div>`:c}
                </div>
                <div class="ticks">${r.ticks.map(m=>d`<span style="left:${m.at}%">${m.label}</span>`)}</div>
              </div>
              <div class="tiles">
                ${this._tile("mdi:fire-circle",p?"Accensioni":"Accensioni oggi",n.ignitions!==null?_(n.ignitions):"\u2013")}
                ${this._tile("mdi:clock-outline",p?"In funzione":"In funzione oggi",n.hours!==null?`${_(n.hours,1)} h`:"\u2013")}
                ${i.sources.switch?this._tile("mdi:toggle-switch","Interruttore",n.switchOn===null?"\u2013":n.switchOn?"Acceso":"Spento",n.blocked?"azioni bloccate":""):c}
                ${i.sources.plug?this._tile(n.plugOn===!1?"mdi:power-plug-off":"mdi:power-plug","Presa",n.plugOn===null?"\u2013":n.plugOn?"Accesa":"Spenta"):c}
                ${n.energy!==null?this._tile("mdi:lightning-bolt",p?"Energia":"Energia oggi",`${_(n.energy,2)} kWh`):c}
              </div>
            </div>
          </div>

          <div class="tl">
            <div class="tlh"><span>Ultime 24 ore</span><span class="muted">${this._segs.length===0?"nessun dato":""}</span></div>
            <div class="tlbar">
              ${this._segs.map(m=>d`<div class="seg" title=${R[m.state]} style="left:${f(m.from)}%;width:${Math.max(.3,f(m.to)-f(m.from))}%;background:${S[m.state]==="transparent"?"#9aa1ad":S[m.state]}"></div>`)}
            </div>
            <div class="tlt"><span>24 h fa</span><span>12 h fa</span><span>ora</span></div>
          </div>

          <div class="actions">
            <button class="btn" @click=${()=>void this._open("stufa-info-dialog")}><ha-icon icon="mdi:information-outline"></ha-icon>Stato</button>
            <button class="btn" @click=${()=>void this._open("stufa-charts-dialog")}><ha-icon icon="mdi:chart-line"></ha-icon>Grafici</button>
            ${i.sources.switch?d`<button class="btn" @click=${()=>void this._open("stufa-schedule-dialog")}><ha-icon icon="mdi:calendar-clock"></ha-icon>Programma</button>
                <button class="btn" @click=${()=>void this._open("stufa-timer-dialog")}><ha-icon icon="mdi:timer-outline"></ha-icon>Timer</button>`:c}
            ${o.show_switch_button&&i.sources.switch?d`<button class=${n.switchOn?"btn plug on":"btn plug"} title="Tocca per accendere o spegnere la stufa" @click=${()=>this._toggleSwitch()} aria-pressed=${n.switchOn?"true":"false"}><ha-icon icon="mdi:power"></ha-icon>${p?n.switchOn?"Acceso":"Spento":n.switchOn?"Interruttore acceso":"Interruttore spento"}</button>`:c}
            <span class="grow"></span>
            <button class="btn icon" aria-label="Preferenze" @click=${()=>void this._open("stufa-settings-dialog")}><ha-icon icon="mdi:cog"></ha-icon></button>
          </div>
        </div>
      </ha-card>
    `}static{this.styles=k`
    :host { display: block; }
    ha-card { overflow: hidden; }
    .pad { padding: 14px 16px 16px; }
    .top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .title { font-size: 1.15rem; font-weight: 600; }
    .muted { color: var(--secondary-text-color, #727272); font-size: 0.8rem; }
    .power { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 18px; }
    .est { display: flex; align-items: center; gap: 12px; }
    .lg { width: 78px; color: var(--primary-text-color, #212121); }
    .lg svg { width: 100%; height: auto; display: block; }
    .fan { display: flex; align-items: center; gap: 6px; }
    .fanicon { width: 34px; height: 34px; color: var(--secondary-text-color, #727272); }
    .fanicon svg { width: 100%; height: 100%; display: block; animation: spin var(--spin, 2s) linear infinite; }
    .fv { font-size: 1.05rem; font-weight: 600; white-space: nowrap; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .fanicon svg { animation: none; } }
    .compact .lg { width: 66px; }
    .compact .fanicon { width: 28px; height: 28px; }
    .compact .fv { font-size: 0.95rem; }
    .errbox { margin-top: 8px; padding: 10px; border-radius: 10px; background: rgba(220, 38, 38, 0.1); color: #b91c1c; font-size: 0.9rem; }
    .pill { display: inline-flex; align-items: center; gap: 7px; padding: 5px 12px; border-radius: 999px; font-size: 0.85rem; font-weight: 600; background: var(--secondary-background-color, #eee); }
    .pill i { width: 9px; height: 9px; border-radius: 50%; background: #9aa1ad; }
    .pill .since { font-weight: 400; opacity: 0.8; }
    .pill.success { background: rgba(22, 163, 74, 0.16); color: #166534; } .pill.success i { background: #16a34a; }
    .pill.warning { background: rgba(245, 158, 11, 0.2); color: #92400e; } .pill.warning i { background: #f59e0b; }
    .pill.accent { background: rgba(96, 165, 250, 0.2); color: #1e40af; } .pill.accent i { background: #60a5fa; }
    .pill.danger { background: rgba(220, 38, 38, 0.14); color: #b91c1c; } .pill.danger i { background: #dc2626; }
    .mode { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; padding: 8px 12px; margin-bottom: 12px; border-radius: 12px; font-size: 0.88rem; background: var(--secondary-background-color, #f2f2f2); }
    .mode ha-icon { --mdc-icon-size: 18px; }
    .mode .ml { font-weight: 600; }
    .mode .md { color: var(--secondary-text-color, #727272); }
    .mode.success { background: rgba(22, 163, 74, 0.13); } .mode.success ha-icon, .mode.success .ml { color: #166534; }
    .mode.warning { background: rgba(245, 158, 11, 0.16); } .mode.warning ha-icon, .mode.warning .ml { color: #92400e; }
    .mode.accent { background: rgba(96, 165, 250, 0.16); } .mode.accent ha-icon, .mode.accent .ml { color: #1e40af; }
    .main { display: flex; gap: 16px; align-items: stretch; }
    .stove { flex: 0 0 34%; max-width: 190px; min-width: 110px; }
    .stove svg { width: 100%; height: auto; display: block; }
    .side { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; justify-content: center; }
    .big { font-size: 2.4rem; font-weight: 700; line-height: 1; }
    .big span { font-size: 1rem; font-weight: 500; color: var(--secondary-text-color, #727272); }
    .gauge { position: relative; padding-bottom: 18px; }
    .bar { position: relative; height: 12px; border-radius: 6px; background: var(--secondary-background-color, #e6e6e6); overflow: hidden; }
    .zone { position: absolute; top: 0; bottom: 0; opacity: 0.55; }
    .mark { position: absolute; top: -2px; bottom: -2px; width: 4px; margin-left: -2px; border-radius: 2px; background: var(--primary-text-color, #212121); }
    .ticks { position: absolute; left: 0; right: 0; top: 16px; height: 14px; }
    .ticks span { position: absolute; transform: translateX(-50%); font-size: 0.66rem; color: var(--secondary-text-color, #727272); white-space: nowrap; }
    .ticks span:first-child { transform: none; }
    .ticks span:last-child { transform: translateX(-100%); }
    .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(92px, 1fr)); gap: 8px; }
    .tile { padding: 8px 10px; border-radius: 12px; background: var(--secondary-background-color, #f2f2f2); }
    .tile ha-icon { --mdc-icon-size: 18px; color: var(--secondary-text-color, #727272); }
    .tile .v { font-size: 1.05rem; font-weight: 600; margin-top: 2px; }
    .tile .l { font-size: 0.72rem; color: var(--secondary-text-color, #727272); }
    .tile .s { font-size: 0.68rem; color: #b45309; margin-top: 2px; }
    .tl { margin-top: 14px; }
    .tlh { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px; }
    .tlbar { position: relative; height: 16px; border-radius: 6px; background: var(--secondary-background-color, #e6e6e6); overflow: hidden; }
    .seg { position: absolute; top: 0; bottom: 0; opacity: 0.9; }
    .tlt { display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--secondary-text-color, #727272); margin-top: 3px; }
    .actions { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; align-items: center; }
    .grow { flex: 1; }
    .btn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--divider-color, #ccc); background: var(--secondary-background-color, #f4f4f4); color: inherit; border-radius: 12px; padding: 8px 14px; font-size: 0.88rem; cursor: pointer; }
    .btn ha-icon { --mdc-icon-size: 18px; }
    .btn.plug.on { background: rgba(22, 163, 74, 0.16); border-color: #16a34a; color: #166534; }
    .btn.icon { padding: 8px 10px; }
    /* versione compatta: stessa informazione in poco piu' di meta' altezza */
    /* se la scheda ha un'altezza imposta (accanto a schede piu' alte) le sezioni si distribuiscono su tutta l'altezza */
    :host([compact]) { height: 100%; }
    ha-card.compact-host { height: 100%; }
    .pad.compact { padding: 10px 14px 12px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
    .compact .top { margin-bottom: 4px; }
    .compact .title { font-size: 1.1rem; }
    .compact .pill { padding: 4px 12px; font-size: 0.84rem; }
    .compact .mode { padding: 6px 12px; margin-bottom: 6px; font-size: 0.88rem; }
    .compact .main { gap: 10px; }
    .compact .stove { flex: 0 0 26%; max-width: 124px; min-width: 84px; align-self: center; }
    .compact .side { gap: 8px; }
    .compact .big { font-size: 2.3rem; }
    .compact .muted { font-size: 0.78rem; }
    .compact .gauge { padding-bottom: 16px; }
    .compact .tiles { grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .compact .tile { padding: 5px 6px; border-radius: 10px; min-width: 0; }
    .compact .tile ha-icon { display: none; }
    .compact .tile .v { font-size: 1.05rem; margin-top: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .compact .tile .l { font-size: 0.68rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .compact .tile .s { display: none; }
    .compact .tl { margin-top: 8px; }
    .compact .tlh { font-size: 0.86rem; }
    .compact .tlbar { height: 16px; }
    .compact .actions { margin-top: 8px; gap: 8px; }
    .compact .btn { padding: 8px 12px; font-size: 0.88rem; border-radius: 12px; }
    .compact .btn ha-icon { --mdc-icon-size: 18px; }
    @media (max-width: 420px) {
      .main { flex-direction: column; align-items: center; }
      .stove { flex: none; width: 52%; }
      .side { width: 100%; }
    }
  `}};g([x({attribute:!1})],O.prototype,"hass",2),g([b()],O.prototype,"_config",2),g([b()],O.prototype,"_info",2),g([b()],O.prototype,"_error",2),g([b()],O.prototype,"_segs",2),g([b()],O.prototype,"_now",2);customElements.get("stufa-pellet-card")||customElements.define("stufa-pellet-card",O);window.customCards=window.customCards||[];window.customCards.push({type:"stufa-pellet-card",name:"Stufa a pellet",description:"Stato della stufa, potenza con le soglie, cronologia, grafici e preferenze."});console.info("%c STUFA-PELLET-MONITOR %c v0.3.3 ","color: white; background: #8b2a22; font-weight: 700;","color: #8b2a22; background: white; font-weight: 700;");export{O as StufaPelletCard};
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
