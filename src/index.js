const playPanel = document.getElementById('playPanel');
const countPanel = document.getElementById('countPanel');
const scorePanel = document.getElementById('scorePanel');
const startButton = document.getElementById('startButton');
const romaNode = document.getElementById('roma');
const choices = document.getElementById('choices');
const gradeOption = document.getElementById('gradeOption');
const infoPanel = document.getElementById('infoPanel');
const resultNode = document.getElementById('result');
const aa = document.getElementById('aa');
const gameTime = 180;
const tmpCanvas = document.createElement('canvas');
const mode = document.getElementById('mode');
let typeTimer;
// https://dova-s.jp/bgm/play14775.html
const bgm = new Audio('bgm.mp3');
bgm.volume = 0.1;
bgm.loop = true;
let answer = "Let's imitate in english!";
let correctCount = 0;
let errorCount = 0;
let mistaken = false;
let problems = [];
let englishVoices = [];
let keyboardAudio, correctAudio, incorrectAudio, endAudio;
loadAudios();
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();


function clearConfig() {
  localStorage.clear();
}

function loadConfig() {
  if (localStorage.getItem('darkMode') == 1) {
    document.documentElement.dataset.theme = 'dark';
  }
  if (localStorage.getItem('bgm') != 1) {
    document.getElementById('bgmOn').classList.add('d-none');
    document.getElementById('bgmOff').classList.remove('d-none');
  }
}
loadConfig();

function toggleBGM() {
  if (localStorage.getItem('bgm') == 1) {
    document.getElementById('bgmOn').classList.add('d-none');
    document.getElementById('bgmOff').classList.remove('d-none');
    localStorage.setItem('bgm', 0);
    bgm.pause();
  } else {
    document.getElementById('bgmOn').classList.remove('d-none');
    document.getElementById('bgmOff').classList.add('d-none');
    localStorage.setItem('bgm', 1);
    bgm.play();
  }
}

function toggleDarkMode() {
  if (localStorage.getItem('darkMode') == 1) {
    localStorage.setItem('darkMode', 0);
    delete document.documentElement.dataset.theme;
  } else {
    localStorage.setItem('darkMode', 1);
    document.documentElement.dataset.theme = 'dark';
  }
}

function toggleOverview() {
  var overview = document.getElementById('overview');
  if (overview.dataset && overview.dataset.collapse == 'true') {
    overview.dataset.collapse = 'false';
    overview.classList.add('d-none');
    overview.classList.add('d-sm-block');
  } else {
    overview.dataset.collapse = 'true';
    overview.classList.remove('d-none');
    overview.classList.remove('d-sm-block');
  }
}

function playAudio(audioBuffer, volume) {
  const audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  if (volume) {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    audioSource.connect(gainNode);
    audioSource.start();
  } else {
    audioSource.connect(audioContext.destination);
    audioSource.start();
  }
}

function unlockAudio() {
  audioContext.resume();
}

function loadAudio(url) {
  return fetch(url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
      return new Promise((resolve, reject) => {
        audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
          resolve(audioBuffer);
        }, (err) => {
          reject(err);
        });
      });
    });
}

function loadAudios() {
  promises = [
    loadAudio('keyboard.mp3'),
    loadAudio('correct.mp3'),
    loadAudio('cat.mp3'),
    loadAudio('end.mp3'),
  ];
  Promise.all(promises).then(audioBuffers => {
    keyboardAudio = audioBuffers[0];
    correctAudio = audioBuffers[1];
    incorrectAudio = audioBuffers[2];
    endAudio = audioBuffers[3];
  });
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise(function(resolve, reject) {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      speechSynthesis.addEventListener("voiceschanged", function() {
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
    }
  });
  allVoicesObtained.then(voices => {
    englishVoices = voices.filter(voice => voice.lang == 'en-US');
    voiceInput = setVoiceInput();
  });
}
loadVoices();

function speak(text) {
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.onend = () => { voiceInput.start() };
  msg.voice = englishVoices[Math.floor(Math.random() * englishVoices.length)];
  msg.lang = 'en-US';
  voiceInput.stop();
  speechSynthesis.speak(msg);
}

function loadProblems() {
  var grade = gradeOption.selectedIndex + 2;
  if (grade > 0) {
    fetch('data/' + mode.textContent.toLowerCase() + '/' + grade + '.tsv').then(function(response) {
      return response.text();
    }).then(function(tsv) {
      problems = tsv.split('\n').slice(0, -1).map(line => {
        const [en, jaStr] = line.split('\t');
        const ja = jaStr.split('|').slice(0, 3).join('\n');
        return { en:en, ja:ja };
      });
    }).catch(function(err) {
      console.error(err);
    });
  }
}

function fixTypeStyle(currNode, word) {
  currNode.textContent = word;
  typeNormal(currNode);
}

function appendWord(currNode, word) {
  const span = document.createElement('span');
  span.textContent = word;
  currNode.parentNode.insertBefore(span, currNode.NextSibling);
}

function typeNormal(currNode) {
  currNode.style.visibility = 'visible';
  playAudio(keyboardAudio);
  currNode.style.color = 'silver';
  normalCount += 1;
}

function nextProblem() {
  const problem = problems[getRandomInt(0, problems.length)];
  const roma = problem.en;
  const sentencesPanel = document.getElementById('sentencesPanel');
  const prevNode = document.getElementById('sentencesPanel').firstElementChild;
  prevNode.classList.remove('text-primary');
  const newNode = document.createElement('talk-box');
  sentencesPanel.insertBefore(newNode, sentencesPanel.firstChild);
  newNode.shadowRoot.querySelector('.ja').textContent = problem.ja;
  newNode.shadowRoot.querySelector('.en').textContent = roma;
  newNode.classList.add('text-primary');
  answer = roma;
  speak(roma);
}

function replay() {
  clearInterval(typeTimer);
  initTime();
  loadProblems();
  countdown();
  correctCount = errorCount = 0;
  countPanel.hidden = false;
  scorePanel.hidden = true;
  while(resultNode.firstChild) {
    resultNode.removeChild(resultNode.firstChild);
  }
}

function getRandomInt(min, max) {
  var min = Math.ceil(min);
  var max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function shuffle(array) {
  for(var i = array.length - 1; i > 0; i--){
      var r = Math.floor(Math.random() * (i + 1));
      var tmp = array[i];
      array[i] = array[r];
      array[r] = tmp;
  }
  return array;
}

customElements.define('talk-box', class extends HTMLElement {
  constructor() {
    super();
    const template = document.getElementById('talk-box').content.cloneNode(true);
    template.querySelector('.voice').onclick = function() {
      const text = this.nextElementSibling.textContent;
      speak(text);
    };
    this.attachShadow({ mode:'open' }).appendChild(template);
  }
});

function countdown() {
  correctCount = errorCount = 0;
  playPanel.classList.add('d-none');
  countPanel.hidden = false;
  scorePanel.hidden = true;
  counter.innerText = 3;
  var timer = setInterval(function(){
    var counter = document.getElementById('counter');
    var colors = ['skyblue', 'greenyellow', 'violet', 'tomato'];
    if (parseInt(counter.innerText) > 1) {
      var t = parseInt(counter.innerText) - 1;
      counter.style.backgroundColor = colors[t];
      counter.innerText = t;
    } else {
      clearInterval(timer);
      countPanel.hidden = true;
      scorePanel.hidden = true;
      playPanel.classList.remove('d-none');
      nextProblem();
      startTypeTimer();
      if (localStorage.getItem('bgm') == 1) {
        bgm.play();
      }
    }
  }, 1000);
}

function skipSentence() {
  const topSentence = document.getElementById('sentencesPanel').firstElementChild;
  if (topSentence.id != "guide") {
    errorCount += 1;
    topSentence.classList.add('text-danger');
    nextProblem();
  }
}

function startGame() {
  clearInterval(typeTimer);
  startButton.removeEventListener('click', startGame);
  startButton.addEventListener('click', replay);
  initTime();
  loadProblems();
  countdown();
}

function startTypeTimer() {
  var timeNode = document.getElementById('time');
  typeTimer = setInterval(function() {
    var arr = timeNode.innerText.split('秒 /');
    var t = parseInt(arr[0]);
    if (t > 0) {
      timeNode.innerText = (t-1) + '秒 /' + arr[1];
    } else {
      clearInterval(typeTimer);
      bgm.pause();
      playAudio(endAudio);
      playPanel.classList.add('d-none');
      countPanel.hidden = true;
      scorePanel.hidden = false;
      scoring();
    }
  }, 1000);
}

function downTime(n) {
  const timeNode = document.getElementById('time');
  const arr = timeNode.innerText.split('秒 /');
  const t = parseInt(arr[0]);
  const downedTime = t - n;
  if (downedTime < 0) {
    timeNode.innerText = '0秒 /' + arr[1];
  } else {
    timeNode.innerText = downedTime + '秒 /' + arr[1];
  }
}


function initTime() {
  document.getElementById('time').innerText = gameTime + '秒 / ' + gameTime + '秒';
}

function scoring() {
  document.getElementById('score').innerText = correctCount;
  document.getElementById('problemCount').innerText = correctCount + errorCount;
}

// he'd --> he had/would の複数があるので無視
// it's --> it is/has の複数形があるので無視
// 上記は意識的に使い分ければ何とかなる
const abbrevs1 = {
  "'m": " am",
  "'re": " are",
  "'ll": " will",
  "'ve": " have",
};

const abbrevs2 = {
  "ain't": "am not",  // TODO: ネイティブ英語では不安定
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "was not",
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "won't": "will not",
  "haven't": "have not",
  "hasn't": "has not",
  "can't": "can not",
  "shan't": "shall not",
  "wouldn't": "would not",
  "couldn't": "scould not",
  "shouldn't": "should not",
  "mustn't": "must not",
};

// TODO: 郵便番号が失敗しているかも？
function formatSentence(sentence) {
  // ,.!? は音声入力されない / されにくいので無視
  // face-to-face のような - はスペース区切りに変換
  sentence = sentence.toLowerCase().replace(/[,.!?]/g, '').replace(/-/g, ' ');
  // 典型的な短縮形は原形に変換
  sentence = sentence.split(' ').map(word => {
    // 数字は英単語列に変換
    if (word.match(/\d+(?:\.\d+)?/)) {
      return numberToWords.toWords(word).replace(/,/g, '').replace(/-/g, ' ');
    }
    // 短縮形は正規化
    const pos = word.indexOf("'");
    if (pos >= 0) {
      const str = word.slice(pos);
      if (word[pos -1] == 'n') {
        if (str in abbrevs1) {
          return abbrevs2[str];
        }
      } else {
        if (str in abbrevs1) {
          return word.slice(0, pos) + abbrevs1[str];
        }
      }
    }
    return word;
  }).join(' ');
  console.log(sentence);
  return sentence;
}

function setVoiceInput() {
  if (!('webkitSpeechRecognition' in window)) {
    document.getElementById('nosupport').classList.remove('d-none');
  } else {
    let voiceInput = new webkitSpeechRecognition();
    voiceInput.lang = 'en-US';
    // voiceInput.interimResults = true;
    voiceInput.continuous = true;

    voiceInput.onstart = (event) => {
      const startButton = document.getElementById('start-voice-input');
      const stopButton = document.getElementById('stop-voice-input');
      startButton.classList.add('d-none');
      stopButton.classList.remove('d-none');
    };
    voiceInput.onstart = (event) => {
      const startButton = document.getElementById('start-voice-input');
      const stopButton = document.getElementById('stop-voice-input');
      startButton.classList.add('d-none');
      stopButton.classList.remove('d-none');
    };
    voiceInput.onend = (event) => {
      if (!speechSynthesis.speaking) {
        voiceInput.start();
      }
    };
    voiceInput.onresult = (event) => {
      const reply = event.results[0][0].transcript;
      document.getElementById('reply').textContent = reply;
      console.log(reply);
      const formattedReply = formatSentence(reply);
      const formattedAnswer = formatSentence(answer);
      if (formattedReply == formattedAnswer) {
        correctCount += 1;
        if (navigator.onLine) {
          const img = document.getElementById('cat');
          img.src = '/speecha/img/cat' + getRandomInt(0, 74) + '.webp';
        }
        playAudio(correctAudio);
        nextProblem();
      }
      voiceInput.stop();
    };
    return voiceInput;
  }
}

function startVoiceInput() {
  voiceInput.start();
}

function stopVoiceInput() {
  const startButton = document.getElementById('start-voice-input');
  const stopButton = document.getElementById('stop-voice-input');
  startButton.classList.remove('d-none');
  stopButton.classList.add('d-none');
  document.getElementById('reply').textContent = '英語でまねよう';
  voiceInput.stop();
}


[...document.getElementsByClassName('voice')].forEach(e => {
  e.onclick = function() {
    const text = this.nextElementSibling.textContent;
    speak(roma);
  };
});
startButton.addEventListener('click', startGame);
skipButton.addEventListener('click', skipSentence);
gradeOption.addEventListener('change', function() {
  initTime();
  clearInterval(typeTimer);
});
mode.onclick = function() {
  mode.textContent = (mode.textContent == 'EASY') ? 'HARD' : 'EASY';
};
document.addEventListener('click', unlockAudio, { once:true, useCapture:true });

