const replyPlease=document.getElementById("replyPlease"),reply=document.getElementById("reply"),playPanel=document.getElementById("playPanel"),infoPanel=document.getElementById("infoPanel"),countPanel=document.getElementById("countPanel"),scorePanel=document.getElementById("scorePanel"),startButton=document.getElementById("startButton"),gradeOption=document.getElementById("gradeOption"),resultNode=document.getElementById("result"),gameTime=180;let gameTimer;const bgm=new Audio("mp3/bgm.mp3");bgm.volume=.1,bgm.loop=!0;let answer="Let's imitate in english!",correctCount=0,errorCount=0;const whiteList=new Map;whiteList.set("mr.",!0),whiteList.set("ms.",!0),whiteList.set("mt.",!0);let problems=[],englishVoices=[];const voiceInput=setVoiceInput(),audioContext=new globalThis.AudioContext,audioBufferCache={};loadAudio("end","mp3/end.mp3"),loadAudio("correct","mp3/correct3.mp3"),loadConfig();function loadConfig(){localStorage.getItem("darkMode")==1&&document.documentElement.setAttribute("data-bs-theme","dark"),localStorage.getItem("bgm")!=1&&(document.getElementById("bgmOn").classList.add("d-none"),document.getElementById("bgmOff").classList.remove("d-none"))}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),document.documentElement.setAttribute("data-bs-theme","light")):(localStorage.setItem("darkMode",1),document.documentElement.setAttribute("data-bs-theme","dark"))}function toggleBGM(){localStorage.getItem("bgm")==1?(document.getElementById("bgmOn").classList.add("d-none"),document.getElementById("bgmOff").classList.remove("d-none"),localStorage.setItem("bgm",0),bgm.pause()):(document.getElementById("bgmOn").classList.remove("d-none"),document.getElementById("bgmOff").classList.add("d-none"),localStorage.setItem("bgm",1),bgm.play())}async function playAudio(e,t){const s=await loadAudio(e,audioBufferCache[e]),n=audioContext.createBufferSource();if(n.buffer=s,t){const e=audioContext.createGain();e.gain.value=t,e.connect(audioContext.destination),n.connect(e),n.start()}else n.connect(audioContext.destination),n.start()}async function loadAudio(e,t){if(audioBufferCache[e])return audioBufferCache[e];const s=await fetch(t),o=await s.arrayBuffer(),n=await audioContext.decodeAudioData(o);return audioBufferCache[e]=n,n}function unlockAudio(){audioContext.resume()}function loadVoices(){const e=new Promise(e=>{let t=speechSynthesis.getVoices();if(t.length!==0)e(t);else{let n=!1;speechSynthesis.addEventListener("voiceschanged",()=>{n=!0,t=speechSynthesis.getVoices(),e(t)}),setTimeout(()=>{n||document.getElementById("noTTS").classList.remove("d-none")},1e3)}}),t=["com.apple.speech.synthesis.voice.Bahh","com.apple.speech.synthesis.voice.Albert","com.apple.speech.synthesis.voice.Hysterical","com.apple.speech.synthesis.voice.Organ","com.apple.speech.synthesis.voice.Cellos","com.apple.speech.synthesis.voice.Zarvox","com.apple.speech.synthesis.voice.Bells","com.apple.speech.synthesis.voice.Trinoids","com.apple.speech.synthesis.voice.Boing","com.apple.speech.synthesis.voice.Whisper","com.apple.speech.synthesis.voice.Deranged","com.apple.speech.synthesis.voice.GoodNews","com.apple.speech.synthesis.voice.BadNews","com.apple.speech.synthesis.voice.Bubbles"];e.then(e=>{englishVoices=e.filter(e=>e.lang=="en-US").filter(e=>!t.includes(e.voiceURI))})}loadVoices();function speak(e){speechSynthesis.cancel();const t=new globalThis.SpeechSynthesisUtterance(e);t.onend=()=>{voiceInput.start()},t.voice=englishVoices[Math.floor(Math.random()*englishVoices.length)],t.lang="en-US",voiceInput.stop(),speechSynthesis.speak(t)}function loadProblems(){const e=gradeOption.selectedIndex+2,t=document.getElementById("course").textContent,n=t=="短文"?"easy/":"hard/";e>0&&fetch("data/"+n+e+".tsv").then(e=>e.text()).then(e=>{problems=e.trimEnd().split(`
`).map(e=>{const[t,n]=e.split("	"),s=n.split("|").slice(0,3).join(`
`);return{en:t,ja:s}})}).catch(e=>{console.error(e)})}function nextProblem(){const n=problems[getRandomInt(0,problems.length)],t=n.en,s=document.getElementById("sentencesPanel"),o=document.getElementById("sentencesPanel").firstElementChild;o.classList.remove("text-primary");const e=new TalkBox;s.insertBefore(e,s.firstChild),e.shadowRoot.querySelector(".ja").textContent=n.ja,e.shadowRoot.querySelector(".en").textContent=t,e.classList.add("text-primary"),answer=t,speak(t)}function startGame(){clearInterval(gameTimer),initTime(),loadProblems(),countdown()}function getRandomInt(e,t){return e=Math.ceil(e),t=Math.floor(t),Math.floor(Math.random()*(t-e))+e}class TalkBox extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.shadowRoot.adoptedStyleSheets=[globalCSS];const e=document.getElementById("talk-box").content.cloneNode(!0);e.querySelector(".voice").onclick=e=>{const t=e.target.nextElementSibling.textContent;speak(t)},this.shadowRoot.appendChild(e)}}customElements.define("talk-box",TalkBox);function countdown(){for(correctCount=errorCount=0,localStorage.getItem("bgm")==1&&bgm.play(),countPanel.classList.remove("d-none"),infoPanel.classList.add("d-none"),playPanel.classList.add("d-none"),scorePanel.classList.add("d-none");resultNode.firstChild;)resultNode.removeChild(resultNode.firstChild);counter.textContent=3;const e=setInterval(()=>{const t=document.getElementById("counter"),n=["skyblue","greenyellow","violet","tomato"];if(parseInt(t.textContent)>1){const e=parseInt(t.textContent)-1;t.style.backgroundColor=n[e],t.textContent=e}else clearInterval(e),countPanel.classList.add("d-none"),infoPanel.classList.remove("d-none"),playPanel.classList.remove("d-none"),nextProblem(),startGameTimer()},1e3)}function skipSentence(){replyPlease.classList.remove("d-none"),reply.classList.add("d-none");const e=document.getElementById("sentencesPanel").firstElementChild;e.id!="guide"&&(errorCount+=1,e.classList.add("text-danger"),nextProblem())}function startGameTimer(){const e=document.getElementById("time");gameTimer=setInterval(()=>{const t=parseInt(e.textContent);t>0?e.textContent=t-1:(clearInterval(gameTimer),bgm.pause(),playAudio("end"),playPanel.classList.add("d-none"),countPanel.classList.add("d-none"),scorePanel.classList.remove("d-none"),scoring())},1e3)}function initTime(){document.getElementById("time").textContent=gameTime}function scoring(){document.getElementById("score").textContent=correctCount,document.getElementById("problemCount").textContent=correctCount+errorCount}const abbrevs1={"'m":" am","'re":" are","'ll":" will","'ve":" have"},abbrevs2={"ain't":"am not","isn't":"is not","aren't":"are not","wasn't":"was not","weren't":"was not","don't":"do not","doesn't":"does not","didn't":"did not","won't":"will not","haven't":"have not","hasn't":"has not","can't":"can not","shan't":"shall not","wouldn't":"would not","couldn't":"scould not","shouldn't":"should not","mustn't":"must not"};function formatSentence(e){return e=e.toLowerCase(),/[,.!?]/.test(e.slice(-1))&&(e=e.slice(0,-1)),e=e.replace(/-/g," "),e=e.split(" ").map(e=>{if(/\d+(?:\.\d+)?/.test(e))return numberToWords.toWords(e).replace(/,/g,"").replace(/-/g," ");const t=e.indexOf("'");if(t>=0){const n=e.slice(t);if(e[t-1]=="n"){if(n in abbrevs1)return abbrevs2[n]}else if(n in abbrevs1)return e.slice(0,t)+abbrevs1[n]}return e}).join(" "),document.getElementById("mode").textContent=="EASY"&&(e=e.split(/[,.!?]/).map(e=>{const t=e.split(/\s/);return t.map(e=>whiteList.get(e)?e:"X").join(" ")}).flat().join(" ")),e}function isEqual(e,t){const n=e.split(" "),s=t.split(" ");return s.forEach((e,t)=>{e=="X"&&(n[t]="X")}),console.log([n,s]),!!n.every((e,t)=>e==s[t])}function setVoiceInput(){if(globalThis.webkitSpeechRecognition){const e=new globalThis.webkitSpeechRecognition;return e.lang="en-US",e.continuous=!0,e.onstart=voiceInputOnStart,e.onend=()=>{speechSynthesis.speaking||e.start()},e.onresult=t=>{const n=t.results[0][0].transcript;document.getElementById("reply").textContent=n;const s=formatSentence(n),o=formatSentence(answer);if(isEqual(s,o)){if(correctCount+=1,navigator.onLine){const e=document.getElementById("cat");e.src="/speecha/img/cat"+getRandomInt(0,74)+".webp"}playAudio("correct",.3),nextProblem()}replyPlease.classList.add("d-none"),reply.classList.remove("d-none"),e.stop()},e}document.getElementById("noSTT").classList.remove("d-none")}function voiceInputOnStart(){document.getElementById("startVoiceInput").classList.add("d-none"),document.getElementById("stopVoiceInput").classList.remove("d-none")}function voiceInputOnStop(){document.getElementById("startVoiceInput").classList.remove("d-none"),document.getElementById("stopVoiceInput").classList.add("d-none")}function startVoiceInput(){voiceInput.start()}function stopVoiceInput(){voiceInputOnStop(),voiceInput.stop()}function changeMode(e){e.target.textContent=="EASY"?e.target.textContent="HARD":e.target.textContent="EASY"}function changeCourse(e){e.target.textContent=="短文"?e.target.textContent="長文":e.target.textContent="短文"}function loadWhiteList(){fetch(`words.lst`).then(e=>e.text()).then(e=>{e.trimEnd().split(`
`).forEach(e=>{whiteList.set(e,!0)})})}function getGlobalCSS(){let e="";for(const t of document.styleSheets)for(const n of t.cssRules)e+=n.cssText;const t=new CSSStyleSheet;return t.replaceSync(e),t}loadWhiteList();const globalCSS=getGlobalCSS();[...document.getElementsByClassName("voice")].forEach(e=>{e.addEventListener("click",e=>{const t=e.target.nextElementSibling.textContent;speak(t)})}),startButton.onclick=startGame,skipButton.onclick=skipSentence,document.getElementById("mode").onclick=changeMode,document.getElementById("course").onclick=changeCourse,document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("toggleBGM").onclick=toggleBGM,document.getElementById("startVoiceInput").onclick=startVoiceInput,document.getElementById("stopVoiceInput").onclick=stopVoiceInput,gradeOption.onchange=()=>{initTime(),clearInterval(gameTimer)},document.addEventListener("click",unlockAudio,{once:!0,useCapture:!0})