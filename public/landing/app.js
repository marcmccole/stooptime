const conversationCases = {
  "families": {
    "title": "Meet other families.",
    "description": "Join your neighbors, then make a plan.",
    "messages": [
      [
        "out",
        "hello! we’re on Upland."
      ],
      [
        "in",
        "Welcome! 52 of your neighbors are here too."
      ],
      [
        "out",
        "Any families with young kids up for Aptos Park on Saturday? We have a 3-year-old."
      ],
      [
        "in",
        "A family with a 4-year-old would love to join. They’re happy to meet—want an intro?"
      ],
      [
        "out",
        "Yes please!"
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
  "solar": {
    "title": "Figure out solar.",
    "description": "A recommendation, and someone who’s been through it.",
    "messages": [
      [
        "out",
        "Thinking about solar. Anyone nearby who’s done it?"
      ],
      [
        "in",
        "A neighbor on Westgate has. They’re happy to share who they used and what they learned."
      ],
      [
        "out",
        "I’d love to know what to ask and what they’d do differently."
      ],
      [
        "in",
        "They said to get the roof inspected first. Want me to introduce you?"
      ],
      [
        "out",
        "Yes please."
      ]
    ]
  },
  "bookclub": {
    "title": "Start a book club.",
    "description": "Find a few neighbors to read with.",
    "messages": [
      [
        "out",
        "Anyone interested in starting a book club?"
      ],
      [
        "in",
        "I can ask around. What do you like to read?"
      ],
      [
        "out",
        "Mostly novels. Nothing too serious!"
      ],
      [
        "in",
        "Three neighbors would love to join. They’re happy to be introduced—are you?"
      ],
      [
        "out",
        "Yes! Let’s pick our first book."
      ]
    ]
  },
  "coyotes": {
    "title": "Coyotes at the park.",
    "description": "A heads-up from someone nearby.",
    "messages": [
      [
        "in",
        "A neighbor just spotted two coyotes at Aptos Park after the rain."
      ],
      [
        "out",
        "Wow! We walk the dog there every morning. Thanks for the heads-up."
      ],
      [
        "in",
        "Want me to keep you posted about the park?"
      ],
      [
        "out",
        "Yes please."
      ]
    ]
  }
};
const demoTabs=[...document.querySelectorAll('.demo-tab')];
const demoPanel=document.getElementById('demo-panel');
const phoneMessages=document.getElementById('phone-messages');
const demoThread=document.querySelector('.device-thread');
const demoTabList=document.querySelector('.demo-tabs');
const mobileDemo=window.matchMedia('(max-width:760px)');
let currentCase='';

// Move only the mobile selector row when a chosen tab is partly outside it.
function revealConversationTab(tab,animate=true){
  if(!mobileDemo.matches||!tab)return;
  const listBounds=demoTabList.getBoundingClientRect();
  const tabBounds=tab.getBoundingClientRect();
  const leftEdge=listBounds.left+20;
  const rightEdge=listBounds.right-20;
  const distance=tabBounds.left<leftEdge?tabBounds.left-leftEdge:tabBounds.right>rightEdge?tabBounds.right-rightEdge:0;
  if(distance){
    const reducedMotion=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    demoTabList.scrollBy({left:distance,behavior:animate&&!reducedMotion?'smooth':'instant'});
  }
}

// Examples change only when a visitor chooses one, never as the page scrolls.
function selectConversation(key,announce=true){
  const example=conversationCases[key];
  if(!example||key===currentCase)return;
  phoneMessages.setAttribute('aria-live',announce?'polite':'off');
  demoTabs.forEach(tab=>{
    const active=tab.dataset.case===key;
    tab.setAttribute('aria-selected',String(active));
    tab.tabIndex=active?0:-1;
  });
  demoPanel.setAttribute('aria-labelledby','demo-tab-'+key);
  phoneMessages.replaceChildren(...example.messages.map(([direction,text])=>{
    const message=document.createElement('p');
    message.className='demo-message '+(direction==='out'?'sent':'received');
    message.textContent=text;
    return message;
  }));
  currentCase=key;
  demoThread.scrollTop=0;
  if(announce)revealConversationTab(demoTabs.find(tab=>tab.dataset.case===key));
}

demoTabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>selectConversation(tab.dataset.case));
  tab.addEventListener('keydown',event=>{
    let next;
    if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%demoTabs.length;
    if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index-1+demoTabs.length)%demoTabs.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=demoTabs.length-1;
    if(next!==undefined){
      event.preventDefault();
      selectConversation(demoTabs[next].dataset.case);
      demoTabs[next].focus({preventScroll:true});
    }
  });
});
function updateTabOrientation(){
  demoTabList.setAttribute('aria-orientation',mobileDemo.matches?'horizontal':'vertical');
  revealConversationTab(demoTabs.find(tab=>tab.dataset.case===currentCase),false);
}
mobileDemo.addEventListener('change',updateTabOrientation);
updateTabOrientation();
selectConversation('families',false);

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
