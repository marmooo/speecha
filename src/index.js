const replyPlease = document.getElementById("replyPlease");
const reply = document.getElementById("reply");
const playPanel = document.getElementById("playPanel");
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
const voiceInput = setVoiceInput();
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
  allVoicesObtained.then((voices) => {
    englishVoices = voices.filter((voice) => voice.lang == "en-US");
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
  const grade = gradeOption.selectedIndex + 3;
  const course = document.getElementById("course").textContent;
  const dir = (course == "短文") ? "easy/" : "hard/";
  if (grade > 0) {
    fetch("data/" + dir + grade + ".tsv")
      .then((response) => response.text())
      .then((tsv) => {
        problems = tsv.trimEnd().split("\n").map((line) => {
          const [en, jaStr] = line.split("\t");
          const ja = jaStr.split("|").slice(0, 3).join("\n");
          return { en: en, ja: ja };
        });
      }).catch((err) => {
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

function startGame() {
  clearInterval(gameTimer);
  initTime();
  loadProblems();
  countdown();
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
      template.querySelector(".voice").onclick = () => {
        const text = this.nextElementSibling.textContent;
        speak(text);
      };
      this.attachShadow({ mode: "open" }).appendChild(template);
    }
  },
);

function countdown() {
  correctCount = errorCount = 0;
  startButton.disabled = true;
  playPanel.classList.add("d-none");
  countPanel.classList.remove("d-none");
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
      startButton.disabled = false;
      countPanel.classList.add("d-none");
      scorePanel.classList.add("d-none");
      playPanel.classList.remove("d-none");
      nextProblem();
      startGameTimer();
      if (localStorage.getItem("bgm") == 1) {
        bgm.play();
      }
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
      playAudio(endAudio);
      playPanel.classList.add("d-none");
      countPanel.classList.add("d-none");
      scorePanel.classList.remove("d-none");
      scoring();
    }
  }, 1000);
}

function initTime() {
  document.getElementById("time").textContent = gameTime;
}

function scoring() {
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
    if (word == "X") {
      arr1[i] = "X";
    }
  });
  console.log([arr1, arr2]);
  if (arr1.every((x, i) => x == arr2[i])) {
    return true;
  } else {
    return false;
  }
}

function setVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) {
    document.getElementById("noSTT").classList.remove("d-none");
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
        playAudio(correctAudio);
        nextProblem();
      }
      replyPlease.classList.add("d-none");
      reply.classList.remove("d-none");
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
}

function startVoiceInput() {
  voiceInput.start();
}

function stopVoiceInput() {
  voiceInputOnStop();
  voiceInput.stop();
}

function changeMode() {
  if (this.textContent == "EASY") {
    this.textContent = "HARD";
  } else {
    this.textContent = "EASY";
  }
}

function changeCourse() {
  if (this.textContent == "短文") {
    this.textContent = "長文";
  } else {
    this.textContent = "短文";
  }
}

function loadWhiteList() {
  fetch(`words.lst`)
    .then((response) => response.text())
    .then((text) => {
      text.trimEnd().split("\n").forEach((word) => {
        whiteList.set(word, true);
      });
    });
}

loadWhiteList();

[...document.getElementsByClassName("voice")].forEach((e) => {
  e.onclick = () => {
    const en = this.nextElementSibling.textContent;
    speak(en);
  };
});
startButton.addEventListener("click", startGame);
skipButton.addEventListener("click", skipSentence);
document.getElementById("mode").onclick = changeMode;
document.getElementById("course").onclick = changeCourse;
document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("toggleBGM").onclick = toggleBGM;
document.getElementById("startVoiceInput").onclick = startVoiceInput;
document.getElementById("stopVoiceInput").onclick = stopVoiceInput;
gradeOption.addEventListener("change", () => {
  initTime();
  clearInterval(gameTimer);
});
document.addEventListener("click", unlockAudio, {
  once: true,
  useCapture: true,
});
