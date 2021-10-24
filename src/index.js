const playPanel = document.getElementById("playPanel");
const countPanel = document.getElementById("countPanel");
const scorePanel = document.getElementById("scorePanel");
const startButton = document.getElementById("startButton");
const gradeOption = document.getElementById("gradeOption");
const resultNode = document.getElementById("result");
const gameTime = 180;
const mode = document.getElementById("mode");
let typeTimer;
// https://dova-s.jp/bgm/play14775.html
const bgm = new Audio("mp3/bgm.mp3");
bgm.volume = 0.1;
bgm.loop = true;
let answer = "Let's imitate in english!";
let correctCount = 0;
let errorCount = 0;
let problems = [];
let englishVoices = [];
let correctAudio, endAudio;
loadAudios();
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
loadConfig();

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.dataset.theme = "dark";
  }
  if (localStorage.getItem("bgm") != 1) {
    document.getElementById("bgmOn").classList.add("d-none");
    document.getElementById("bgmOff").classList.remove("d-none");
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

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    delete document.documentElement.dataset.theme;
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.dataset.theme = "dark";
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
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => {
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
    loadAudio("mp3/correct.mp3"),
    loadAudio("mp3/end.mp3"),
  ];
  Promise.all(promises).then((audioBuffers) => {
    correctAudio = audioBuffers[0];
    endAudio = audioBuffers[1];
  });
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise(function (resolve) {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      speechSynthesis.addEventListener("voiceschanged", function () {
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
    }
  });
  allVoicesObtained.then((voices) => {
    englishVoices = voices.filter((voice) => voice.lang == "en-US");
    voiceInput = setVoiceInput();
  });
}
loadVoices();

function speak(text) {
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.onend = () => {
    voiceInput.start();
  };
  msg.voice = englishVoices[Math.floor(Math.random() * englishVoices.length)];
  msg.lang = "en-US";
  voiceInput.stop();
  speechSynthesis.speak(msg);
}

function loadProblems() {
  const grade = gradeOption.selectedIndex + 2;
  if (grade > 0) {
    fetch("data/" + mode.textContent.toLowerCase() + "/" + grade + ".tsv").then(
      function (response) {
        return response.text();
      },
    ).then(function (tsv) {
      problems = tsv.split("\n").slice(0, -1).map((line) => {
        const [en, jaStr] = line.split("\t");
        const ja = jaStr.split("|").slice(0, 3).join("\n");
        return { en: en, ja: ja };
      });
    }).catch(function (err) {
      console.error(err);
    });
  }
}

function nextProblem() {
  const problem = problems[getRandomInt(0, problems.length)];
  const roma = problem.en;
  const sentencesPanel = document.getElementById("sentencesPanel");
  const prevNode = document.getElementById("sentencesPanel").firstElementChild;
  prevNode.classList.remove("text-primary");
  const newNode = document.createElement("talk-box");
  sentencesPanel.insertBefore(newNode, sentencesPanel.firstChild);
  newNode.shadowRoot.querySelector(".ja").textContent = problem.ja;
  newNode.shadowRoot.querySelector(".en").textContent = roma;
  newNode.classList.add("text-primary");
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
  while (resultNode.firstChild) {
    resultNode.removeChild(resultNode.firstChild);
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

customElements.define(
  "talk-box",
  class extends HTMLElement {
    constructor() {
      super();
      const template = document.getElementById("talk-box").content.cloneNode(
        true,
      );
      template.querySelector(".voice").onclick = function () {
        const text = this.nextElementSibling.textContent;
        speak(text);
      };
      this.attachShadow({ mode: "open" }).appendChild(template);
    }
  },
);

function countdown() {
  correctCount = errorCount = 0;
  playPanel.classList.add("d-none");
  countPanel.hidden = false;
  scorePanel.hidden = true;
  counter.textContent = 3;
  const timer = setInterval(function () {
    const counter = document.getElementById("counter");
    const colors = ["skyblue", "greenyellow", "violet", "tomato"];
    if (parseInt(counter.textContent) > 1) {
      const t = parseInt(counter.textContent) - 1;
      counter.style.backgroundColor = colors[t];
      counter.textContent = t;
    } else {
      clearInterval(timer);
      countPanel.hidden = true;
      scorePanel.hidden = true;
      playPanel.classList.remove("d-none");
      nextProblem();
      startTypeTimer();
      if (localStorage.getItem("bgm") == 1) {
        bgm.play();
      }
    }
  }, 1000);
}

function skipSentence() {
  const topSentence =
    document.getElementById("sentencesPanel").firstElementChild;
  if (topSentence.id != "guide") {
    errorCount += 1;
    topSentence.classList.add("text-danger");
    nextProblem();
  }
}

function startGame() {
  clearInterval(typeTimer);
  startButton.removeEventListener("click", startGame);
  startButton.addEventListener("click", replay);
  initTime();
  loadProblems();
  countdown();
}

function startTypeTimer() {
  const timeNode = document.getElementById("time");
  typeTimer = setInterval(function () {
    const arr = timeNode.textContent.split("秒 /");
    const t = parseInt(arr[0]);
    if (t > 0) {
      timeNode.textContent = (t - 1) + "秒 /" + arr[1];
    } else {
      clearInterval(typeTimer);
      bgm.pause();
      playAudio(endAudio);
      playPanel.classList.add("d-none");
      countPanel.hidden = true;
      scorePanel.hidden = false;
      scoring();
    }
  }, 1000);
}

function initTime() {
  document.getElementById("time").textContent = gameTime + "秒 / " + gameTime +
    "秒";
}

function scoring() {
  document.getElementById("score").textContent = correctCount;
  document.getElementById("problemCount").textContent = correctCount + errorCount;
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

// TODO: 郵便番号が失敗しているかも？
function formatSentence(sentence) {
  // ,.!? は音声入力されない / されにくいので無視
  // face-to-face のような - はスペース区切りに変換
  sentence = sentence.toLowerCase().replace(/[,.!?]/g, "").replace(/-/g, " ");
  // 典型的な短縮形は原形に変換
  sentence = sentence.split(" ").map((word) => {
    // 数字は英単語列に変換
    if (word.match(/\d+(?:\.\d+)?/)) {
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
  return sentence;
}

function setVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) {
    document.getElementById("nosupport").classList.remove("d-none");
  } else {
    const voiceInput = new webkitSpeechRecognition();
    voiceInput.lang = "en-US";
    // voiceInput.interimResults = true;
    voiceInput.continuous = true;

    voiceInput.onstart = voiceInputOnStart;
    voiceInput.onend = () => {
      if (!speechSynthesis.speaking) {
        voiceInput.start();
      }
    };
    voiceInput.onresult = (event) => {
      const reply = event.results[0][0].transcript;
      document.getElementById("reply").textContent = reply;
      const formattedReply = formatSentence(reply);
      const formattedAnswer = formatSentence(answer);
      if (formattedReply == formattedAnswer) {
        correctCount += 1;
        if (navigator.onLine) {
          const img = document.getElementById("cat");
          img.src = "/speecha/img/cat" + getRandomInt(0, 74) + ".webp";
        }
        playAudio(correctAudio);
        nextProblem();
      }
      voiceInput.stop();
    };
    return voiceInput;
  }
}

function voiceInputOnStart() {
  document.getElementById("startVoiceInput").classList.add("d-none");
  document.getElementById("stopVoiceInput").classList.remove("d-none");
}

function voiceInputOnStop() {
  document.getElementById("startVoiceInput").classList.remove("d-none");
  document.getElementById("stopVoiceInput").classList.add("d-none");
  document.getElementById("reply").textContent = "英語でまねよう";
}

function startVoiceInput() {
  voiceInput.stop();
}

function stopVoiceInput() {
  voiceInputOnStop();
  voiceInput.stop();
}

[...document.getElementsByClassName("voice")].forEach((e) => {
  e.onclick = function () {
    const en = this.nextElementSibling.textContent;
    speak(en);
  };
});
startButton.addEventListener("click", startGame);
skipButton.addEventListener("click", skipSentence);
document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("toggleBGM").onclick = toggleBGM;
document.getElementById("startVoiceInput").onclick = startVoiceInput;
document.getElementById("stopVoiceInput").onclick = stopVoiceInput;
gradeOption.addEventListener("change", function () {
  initTime();
  clearInterval(typeTimer);
});
mode.onclick = function () {
  mode.textContent = (mode.textContent == "EASY") ? "HARD" : "EASY";
};
document.addEventListener("click", unlockAudio, {
  once: true,
  useCapture: true,
});
