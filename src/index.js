import numberToWords from "https://cdn.jsdelivr.net/npm/number-to-words@1.2.4/+esm";

const replyPlease = document.getElementById("replyPlease");
const reply = document.getElementById("reply");
const playPanel = document.getElementById("playPanel");
const infoPanel = document.getElementById("infoPanel");
const countPanel = document.getElementById("countPanel");
const scorePanel = document.getElementById("scorePanel");
const startButton = document.getElementById("startButton");
const gradeOption = document.getElementById("gradeOption");
const resultNode = document.getElementById("result");
const gameTime = 180;
let gameTimer;
// https://dova-s.jp/bgm/play14775.html
const bgm = new Audio("mp3/bgm.mp3");
bgm.volume = 0.1;
bgm.loop = true;
let answer = "Let's imitate in english!";
let correctCount = 0;
let errorCount = 0;
const whiteList = new Map();
whiteList.set("mr.", true);
whiteList.set("ms.", true);
whiteList.set("mt.", true);
let problems = [];
let englishVoices = [];
let audioContext;
let voiceStopped = false;
const audioBufferCache = {};
loadVoices();
const voiceInput = setVoiceInput();
loadConfig();

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
  if (localStorage.getItem("bgm") != 1) {
    document.getElementById("bgmOn").classList.add("d-none");
    document.getElementById("bgmOff").classList.remove("d-none");
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function toggleBGM() {
  if (localStorage.getItem("bgm") == 1) {
    document.getElementById("bgmOn").classList.add("d-none");
    document.getElementById("bgmOff").classList.remove("d-none");
    localStorage.setItem("bgm", 0);
    bgm.pause();
  } else {
    document.getElementById("bgmOn").classList.remove("d-none");
    document.getElementById("bgmOff").classList.add("d-none");
    localStorage.setItem("bgm", 1);
    bgm.play();
  }
}

function createAudioContext() {
  if (globalThis.AudioContext) {
    return new globalThis.AudioContext();
  } else {
    console.error("Web Audio API is not supported in this browser");
    return null;
  }
}

function unlockAudio() {
  const uttr = new SpeechSynthesisUtterance("");
  uttr.lang = "en-US";
  speechSynthesis.speak(uttr);

  if (audioContext) {
    audioContext.resume();
  } else {
    audioContext = createAudioContext();
    loadAudio("end", "mp3/end.mp3");
    loadAudio("correct", "mp3/correct3.mp3");
  }
  document.removeEventListener("click", unlockAudio);
  document.removeEventListener("keydown", unlockAudio);
}

async function loadAudio(name, url) {
  if (!audioContext) return;
  if (audioBufferCache[name]) return audioBufferCache[name];
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioBufferCache[name] = audioBuffer;
    return audioBuffer;
  } catch (error) {
    console.error(`Loading audio ${name} error:`, error);
    throw error;
  }
}

function playAudio(name, volume) {
  if (!audioContext) return;
  const audioBuffer = audioBufferCache[name];
  if (!audioBuffer) {
    console.error(`Audio ${name} is not found in cache`);
    return;
  }
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  const gainNode = audioContext.createGain();
  if (volume) gainNode.gain.value = volume;
  gainNode.connect(audioContext.destination);
  sourceNode.connect(gainNode);
  sourceNode.start();
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      let supported = false;
      speechSynthesis.addEventListener("voiceschanged", () => {
        supported = true;
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
      setTimeout(() => {
        if (!supported) {
          document.getElementById("noTTS").classList.remove("d-none");
        }
      }, 1000);
    }
  });
  const jokeVoices = [
    // "com.apple.eloquence.en-US.Flo",
    "com.apple.speech.synthesis.voice.Bahh",
    "com.apple.speech.synthesis.voice.Albert",
    // "com.apple.speech.synthesis.voice.Fred",
    "com.apple.speech.synthesis.voice.Hysterical",
    "com.apple.speech.synthesis.voice.Organ",
    "com.apple.speech.synthesis.voice.Cellos",
    "com.apple.speech.synthesis.voice.Zarvox",
    // "com.apple.eloquence.en-US.Rocko",
    // "com.apple.eloquence.en-US.Shelley",
    // "com.apple.speech.synthesis.voice.Princess",
    // "com.apple.eloquence.en-US.Grandma",
    // "com.apple.eloquence.en-US.Eddy",
    "com.apple.speech.synthesis.voice.Bells",
    // "com.apple.eloquence.en-US.Grandpa",
    "com.apple.speech.synthesis.voice.Trinoids",
    // "com.apple.speech.synthesis.voice.Kathy",
    // "com.apple.eloquence.en-US.Reed",
    "com.apple.speech.synthesis.voice.Boing",
    "com.apple.speech.synthesis.voice.Whisper",
    "com.apple.speech.synthesis.voice.Deranged",
    "com.apple.speech.synthesis.voice.GoodNews",
    "com.apple.speech.synthesis.voice.BadNews",
    "com.apple.speech.synthesis.voice.Bubbles",
    // "com.apple.voice.compact.en-US.Samantha",
    // "com.apple.eloquence.en-US.Sandy",
    // "com.apple.speech.synthesis.voice.Junior",
    // "com.apple.speech.synthesis.voice.Ralph",
  ];
  allVoicesObtained.then((voices) => {
    englishVoices = voices
      .filter((voice) => voice.lang == "en-US")
      .filter((voice) => !jokeVoices.includes(voice.voiceURI));
  });
}

function speak(text) {
  speechSynthesis.cancel();
  const msg = new globalThis.SpeechSynthesisUtterance(text);
  msg.onend = () => {
    voiceInput.start();
  };
  msg.voice = englishVoices[Math.floor(Math.random() * englishVoices.length)];
  msg.lang = "en-US";
  voiceInput.stop();
  speechSynthesis.speak(msg);
}

async function loadProblems() {
  const grade = gradeOption.selectedIndex + 2;
  const course = document.getElementById("course").textContent;
  const dir = (course == "短文") ? "easy/" : "hard/";
  if (grade > 0) {
    const response = await fetch("data/" + dir + grade + ".tsv");
    const tsv = await response.text();
    problems = tsv.trimEnd().split("\n").map((line) => {
      const [en, jaStr] = line.split("\t");
      const ja = jaStr.split("|").slice(0, 3).join("\n");
      return { en: en, ja: ja };
    });
  }
}

function nextProblem() {
  const problem = problems[getRandomInt(0, problems.length)];
  const roma = problem.en;
  const sentencesPanel = document.getElementById("sentencesPanel");
  const prevNode = document.getElementById("sentencesPanel").firstElementChild;
  prevNode.classList.remove("text-primary");
  const newNode = new TalkBox();
  sentencesPanel.insertBefore(newNode, sentencesPanel.firstChild);
  newNode.shadowRoot.querySelector(".ja").textContent = problem.ja;
  newNode.shadowRoot.querySelector(".en").textContent = roma;
  newNode.classList.add("text-primary");
  answer = roma;
  speak(roma);
  startVoiceInput();
}

async function startGame() {
  clearInterval(gameTimer);
  initTime();
  await loadProblems();
  countdown();
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

class TalkBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [globalCSS];

    const template = document.getElementById("talk-box")
      .content.cloneNode(true);
    template.querySelector(".voice").onclick = (event) => {
      const text = event.target.nextElementSibling.textContent;
      speak(text);
    };
    this.shadowRoot.appendChild(template);
  }
}
customElements.define("talk-box", TalkBox);

function countdown() {
  correctCount = errorCount = 0;
  if (localStorage.getItem("bgm") == 1) bgm.play();
  countPanel.classList.remove("d-none");
  infoPanel.classList.add("d-none");
  playPanel.classList.add("d-none");
  scorePanel.classList.add("d-none");
  while (resultNode.firstChild) {
    resultNode.removeChild(resultNode.firstChild);
  }
  counter.textContent = 3;
  const timer = setInterval(() => {
    const counter = document.getElementById("counter");
    const colors = ["skyblue", "greenyellow", "violet", "tomato"];
    if (parseInt(counter.textContent) > 1) {
      const t = parseInt(counter.textContent) - 1;
      counter.style.backgroundColor = colors[t];
      counter.textContent = t;
    } else {
      clearInterval(timer);
      countPanel.classList.add("d-none");
      infoPanel.classList.remove("d-none");
      playPanel.classList.remove("d-none");
      nextProblem();
      startGameTimer();
    }
  }, 1000);
}

function skipSentence() {
  replyPlease.classList.remove("d-none");
  reply.classList.add("d-none");
  const topSentence =
    document.getElementById("sentencesPanel").firstElementChild;
  if (topSentence.id != "guide") {
    errorCount += 1;
    topSentence.classList.add("text-danger");
    nextProblem();
  }
}

function startGameTimer() {
  const timeNode = document.getElementById("time");
  gameTimer = setInterval(() => {
    const t = parseInt(timeNode.textContent);
    if (t > 0) {
      timeNode.textContent = t - 1;
    } else {
      clearInterval(gameTimer);
      bgm.pause();
      playAudio("end");
      scoring();
      stopVoiceInput();
    }
  }, 1000);
}

function initTime() {
  document.getElementById("time").textContent = gameTime;
}

function scoring() {
  playPanel.classList.add("d-none");
  countPanel.classList.add("d-none");
  scorePanel.classList.remove("d-none");
  document.getElementById("score").textContent = correctCount;
  document.getElementById("problemCount").textContent = correctCount +
    errorCount;
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
  "ain't": "am not", // TODO: ネイティブ英語では不安定
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

function formatSentence(sentence) {
  // 音声入力では文頭/文末の大文字小文字が不安定なので小文字に統一
  sentence = sentence.toLowerCase();
  // 音声入力では文末の ,.!? が入力されにくく邪魔なので除去
  if (/[,.!?]/.test(sentence.slice(-1))) {
    sentence = sentence.slice(0, -1);
  }
  // TODO: 郵便番号が失敗するかも？
  // face-to-face のような - は不安定なのでスペース区切りに統一
  sentence = sentence.replace(/-/g, " ");
  // 典型的な短縮形は原形に変換
  sentence = sentence.split(" ").map((word) => {
    // 数字は英単語列に変換
    if (/\d+(?:\.\d+)?/.test(word)) {
      return numberToWords.toWords(word).replace(/,/g, "").replace(/-/g, " ");
    }
    // 短縮形は正規化
    const pos = word.indexOf("'");
    if (pos >= 0) {
      const str = word.slice(pos);
      if (word[pos - 1] == "n") {
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
  }).join(" ");
  // 認識の難しい固有名詞を除去
  // 大文字小文字が不安定なので、頻度の高い単語だけを認識対象にする
  if (document.getElementById("mode").textContent == "EASY") {
    sentence = sentence.split(/[,.!?]/)
      .map((s) => {
        const words = s.split(/\s/);
        return words.map((word) => {
          if (whiteList.get(word)) {
            return word;
          } else {
            return "X";
          }
        }).join(" ");
      })
      .flat().join(" ");
  }
  return sentence;
}

function isEqual(formattedReply, formattedAnswer) {
  const arr1 = formattedReply.split(" ");
  const arr2 = formattedAnswer.split(" ");
  arr2.forEach((word, i) => {
    if (word == "X") arr1[i] = "X";
  });
  if (arr1.every((x, i) => x == arr2[i])) {
    return true;
  } else {
    return false;
  }
}

function setVoiceInput() {
  if (!globalThis.webkitSpeechRecognition) {
    document.getElementById("noSTT").classList.remove("d-none");
  } else {
    const voiceInput = new globalThis.webkitSpeechRecognition();
    voiceInput.lang = "en-US";
    // voiceInput.interimResults = true;
    voiceInput.continuous = true;

    voiceInput.onend = () => {
      if (voiceStopped) return;
      voiceInput.start();
    };
    voiceInput.onresult = (event) => {
      voiceInput.stop();
      const replyText = event.results[0][0].transcript;
      document.getElementById("reply").textContent = replyText;
      const formattedReply = formatSentence(replyText);
      const formattedAnswer = formatSentence(answer);
      if (isEqual(formattedReply, formattedAnswer)) {
        correctCount += 1;
        if (navigator.onLine) {
          const img = document.getElementById("cat");
          img.src = "/speecha/img/cat" + getRandomInt(0, 74) + ".webp";
        }
        playAudio("correct", 0.3);
        nextProblem();
        replyPlease.classList.remove("d-none");
        reply.classList.add("d-none");
      } else {
        replyPlease.classList.add("d-none");
        reply.classList.remove("d-none");
      }
    };
    return voiceInput;
  }
}

function startVoiceInput() {
  voiceStopped = false;
  document.getElementById("startVoiceInput").classList.add("d-none");
  document.getElementById("stopVoiceInput").classList.remove("d-none");
  replyPlease.classList.remove("d-none");
  reply.classList.add("d-none");
  try {
    voiceInput.start();
  } catch {
    // continue regardless of error
  }
}

function stopVoiceInput() {
  voiceStopped = true;
  document.getElementById("startVoiceInput").classList.remove("d-none");
  document.getElementById("stopVoiceInput").classList.add("d-none");
  replyPlease.classList.remove("d-none");
  reply.classList.add("d-none");
  voiceInput.abort();
}

function changeMode(event) {
  if (event.target.textContent == "EASY") {
    event.target.textContent = "HARD";
  } else {
    event.target.textContent = "EASY";
  }
}

function changeCourse(event) {
  if (event.target.textContent == "短文") {
    event.target.textContent = "長文";
  } else {
    event.target.textContent = "短文";
  }
}

async function loadWhiteList() {
  const response = await fetch(`words.lst`);
  const text = await response.text();
  text.trimEnd().split("\n").forEach((word) => {
    whiteList.set(word, true);
  });
}

function getGlobalCSS() {
  let cssText = "";
  for (const stylesheet of document.styleSheets) {
    for (const rule of stylesheet.cssRules) {
      cssText += rule.cssText;
    }
  }
  const css = new CSSStyleSheet();
  css.replaceSync(cssText);
  return css;
}

await loadWhiteList();

const globalCSS = getGlobalCSS();
[...document.getElementsByClassName("voice")].forEach((node) => {
  node.addEventListener("click", (event) => {
    const en = event.target.nextElementSibling.textContent;
    speak(en);
  });
});
startButton.onclick = startGame;
skipButton.onclick = skipSentence;
document.getElementById("mode").onclick = changeMode;
document.getElementById("course").onclick = changeCourse;
document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("toggleBGM").onclick = toggleBGM;
document.getElementById("startVoiceInput").onclick = startVoiceInput;
document.getElementById("stopVoiceInput").onclick = stopVoiceInput;
gradeOption.onchange = () => {
  initTime();
  clearInterval(gameTimer);
};
document.addEventListener("click", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });
