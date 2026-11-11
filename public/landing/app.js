const conversationCases = {
  "borrow": {
    "title": "Borrow a ladder.",
    "description": "There’s probably one a few doors down.",
    "messages": [
      [
        "out",
        "Anyone have a tall ladder I could borrow Saturday?"
      ],
      [
        "in",
        "A neighbor on Upland has one you can borrow. Want an intro?"
      ],
      [
        "out",
        "Yes please!"
      ],
      [
        "in",
        "They’re happy to meet too. Meet Alex, two doors down."
      ],
      [
        "out",
        "Amazing. Thank you!"
      ]
    ]
  },
  "sitter": {
    "title": "Find a sitter.",
    "description": "Start with someone a neighbor already trusts.",
    "messages": [
      [
        "out",
        "Know a good babysitter for Friday night?"
      ],
      [
        "in",
        "A family on Darien has a sitter they really like. Want me to ask for the details?"
      ],
      [
        "out",
        "Yes! For a 4-year-old."
      ],
      [
        "in",
        "They said she’s great with preschoolers. Want me to connect you with the family?"
      ],
      [
        "out",
        "That would be great."
      ]
    ]
  },
  "bike": {
    "title": "Find a bike.",
    "description": "Stoop remembers what you’re looking for.",
    "messages": [
      [
        "in",
        "Still looking for a bike for your daughter?"
      ],
      [
        "out",
        "Yes—she’s outgrown hers."
      ],
      [
        "in",
        "A neighbor has a 20-inch bike their child’s outgrown. They’d love to pass it along."
      ],
      [
        "in",
        "Want an introduction?"
      ],
      [
        "out",
        "That would be perfect."
      ]
    ]
  },
  "park": {
    "title": "Meet other families.",
    "description": "Find someone to join you at the park.",
    "messages": [
      [
        "out",
        "any families with young kids? thinking of going to the park, would love to hang out!"
      ],
      [
        "in",
        "I can ask nearby families. When are you thinking?"
      ],
      [
        "out",
        "Saturday morning? We have a 3-year-old."
      ],
      [
        "in",
        "A family nearby with a 4-year-old would love to join. They’re happy to be introduced—are you?"
      ],
      [
        "out",
        "Yes, please!"
      ]
    ]
  },
  "help": {
    "title": "Lend a hand.",
    "description": "Sometimes you’re the neighbor who can help.",
    "messages": [
      [
        "in",
        "A neighbor is away until Sunday. A package just landed on their steps."
      ],
      [
        "in",
        "You mentioned you’re usually home. Could you grab it for them?"
      ],
      [
        "out",
        "Sure, happy to."
      ],
      [
        "in",
        "Thanks! They’re happy to meet. Can I introduce you?"
      ],
      [
        "out",
        "Yep!"
      ]
    ]
  }
};
function createSmsHref(userAgent) {
  const separator = /Android/i.test(userAgent) ? '?' : '&';
  const body = encodeURIComponent("so what's the deal with stoop anyway?").replace(/'/g, '%27');
  return 'sms:+14152904186' + separator + 'body=' + body;
}
document.querySelectorAll('.text-stoop').forEach(link => {
  link.href = createSmsHref(navigator.userAgent);
});

const demoTabs=[...document.querySelectorAll('.demo-tab')];
const demoPanel=document.getElementById('demo-panel');
const phoneMessages=document.getElementById('phone-messages');
const demoSection=document.getElementById('how-it-works');
const demoStage=document.querySelector('.demo-stage');
const demoThread=document.querySelector('.device-thread');
const demoTabList=document.querySelector('.demo-tabs');
const caseKeys=Object.keys(conversationCases);
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileDemo=window.matchMedia('(max-width:760px)');
let storyEnabled=false;
let storyTop=0;
let storyStep=650;
let currentCase='';
let currentCount=-1;
let scrollFrame=0;

// Each chapter shows its whole conversation; scrolling only moves between chapters.
function getConversationFrame(distance,step,counts){
  const progress=Math.max(0,distance/step);
  const index=Math.min(counts.length-1,Math.floor(progress));
  return {index,count:counts[index]};
}

function showConversation(key,count,animate=false,announce=false){
  const example=conversationCases[key];if(!example)return;
  count=Math.min(count,example.messages.length);
  if(key===currentCase&&count===currentCount)return;
  const changingCase=key!==currentCase;
  phoneMessages.setAttribute('aria-live',announce?'polite':'off');
  document.getElementById('demo-description').textContent=example.description;
  demoTabs.forEach(tab=>{const active=tab.dataset.case===key;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
  demoPanel.setAttribute('aria-labelledby','demo-tab-'+key);
  if(changingCase||count<currentCount)phoneMessages.replaceChildren();
  const start=phoneMessages.children.length;
  example.messages.slice(start,count).forEach(([direction,text],i)=>{
    const p=document.createElement('p');p.className='demo-message '+(direction==='out'?'sent':'received');p.textContent=text;
    if(animate&&!reducedMotion.matches){p.classList.add('arriving');p.style.setProperty('--message-delay',(i*45)+'ms');}
    phoneMessages.appendChild(p);
  });
  currentCase=key;currentCount=count;
  demoThread.scrollTop=demoThread.scrollHeight;
  if(changingCase&&mobileDemo.matches){
    const selected=demoTabs.find(tab=>tab.dataset.case===key);
    const tabRect=selected.getBoundingClientRect();
    const listRect=demoTabList.getBoundingClientRect();
    if(tabRect.left<listRect.left+20||tabRect.right>listRect.right-20){
      demoTabList.scrollLeft+=tabRect.left-listRect.left-(listRect.width-tabRect.width)/2;
    }
  }
}

function updateStory(){
  scrollFrame=0;
  if(!storyEnabled)return;
  const frame=getConversationFrame(window.scrollY-storyTop,storyStep,caseKeys.map(key=>conversationCases[key].messages.length));
  showConversation(caseKeys[frame.index],frame.count,true);
}
function queueStory(){
  if(storyEnabled&&!scrollFrame)scrollFrame=requestAnimationFrame(updateStory);
}
function measureStory(){
  // Short landscape screens and reduced-motion visitors use the same manual tabs.
  storyEnabled=!reducedMotion.matches&&window.innerHeight>=560;
  demoSection.classList.toggle('is-scroll-story',storyEnabled);
  demoTabList.setAttribute('aria-orientation',mobileDemo.matches?'horizontal':'vertical');
  if(storyEnabled){
    storyStep=Math.max(380,demoStage.offsetHeight*.6);
    demoSection.style.height=(demoStage.offsetHeight+caseKeys.length*storyStep)+'px';
    storyTop=demoSection.getBoundingClientRect().top+window.scrollY;
    updateStory();
  }else{
    demoSection.style.removeProperty('height');
    const key=currentCase||caseKeys[0];
    showConversation(key,conversationCases[key].messages.length);
  }
}
function selectConversation(key){
  if(storyEnabled){
    const index=caseKeys.indexOf(key);
    window.scrollTo({top:storyTop+(index+.62)*storyStep,behavior:'instant'});
  }
  showConversation(key,conversationCases[key].messages.length,false,true);
}
demoTabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>selectConversation(tab.dataset.case));
  tab.addEventListener('keydown',event=>{
    let next;
    if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%demoTabs.length;
    if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index-1+demoTabs.length)%demoTabs.length;
    if(event.key==='Home')next=0;if(event.key==='End')next=demoTabs.length-1;
    if(next!==undefined){event.preventDefault();selectConversation(demoTabs[next].dataset.case);demoTabs[next].focus({preventScroll:true});}
  });
});
window.addEventListener('scroll',queueStory,{passive:true});
window.addEventListener('resize',measureStory);
window.addEventListener('load',measureStory);
window.addEventListener('pageshow',measureStory);
reducedMotion.addEventListener('change',measureStory);
mobileDemo.addEventListener('change',measureStory);
document.fonts.ready.then(measureStory);
measureStory();

const form=document.getElementById('join-form');
const phone=document.getElementById('phone');
const address=document.getElementById('address');
function validatePhone(){const digits=phone.value.replace(/\D/g,'');phone.setCustomValidity(digits.length===10||(digits.length===11&&digits.startsWith('1'))?'':'Please enter a 10-digit US mobile number.');}
phone.addEventListener('input',validatePhone);
address.addEventListener('input',()=>address.setCustomValidity(address.value.trim().length>=5?'':'Please enter your street address.'));
let sending=false;
form.addEventListener('submit',async event=>{
  event.preventDefault();validatePhone();
  address.setCustomValidity(address.value.trim().length>=5?'':'Please enter your street address.');
  if(!form.reportValidity()||sending)return;
  const status=document.getElementById('form-status');
  const submit=form.querySelector('button[type="submit"]');
  sending=true;submit.disabled=true;status.textContent='Sending…';
  try{
    const response=await fetch('/api/text-signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:phone.value,address:address.value})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){status.textContent=data.error||'That didn’t go through. Please try again in a minute.';return;}
    status.textContent='Got it. We’ll text you when Stoop reaches your street.';
    form.reset();
  }catch{
    status.textContent='That didn’t go through. Check your connection and try again.';
  }finally{
    sending=false;submit.disabled=false;
  }
});
