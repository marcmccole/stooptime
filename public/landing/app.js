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
  "plumber": {
    "title": "Find a plumber.",
    "description": "For when it really can’t wait.",
    "messages": [
      [
        "out",
        "Pipe just burst under the sink! Anyone know a plumber who’d come tonight?"
      ],
      [
        "in",
        "Two neighbors use Marcello’s Plumbing. He takes after-hours calls. Want his number?"
      ],
      [
        "out",
        "Yes!!"
      ],
      [
        "in",
        "Sent. A neighbor on Westgate says the shutoff on these houses is by the water heater."
      ],
      [
        "out",
        "Found it. Thank you!"
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
const demoThread=document.querySelector('.device-thread');
const demoTabList=document.querySelector('.demo-tabs');
const mobileDemo=window.matchMedia('(max-width:760px)');
let currentCase='';

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
}
mobileDemo.addEventListener('change',updateTabOrientation);
updateTabOrientation();
selectConversation('borrow',false);

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
