"use strict";

(() => {
  const errorBox = document.getElementById("app-error");
  function reportError(message, error) {
    console.error(message, error);
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  const config = window.SURPRISE;
  const requiredText = ["name", "nickname", "sender", "secretCode", "occasion", "heroIntro", "heroTagline", "heroMessage", "letterGreeting", "signoff", "closingMessage"];
  function isPhotoCollection(collection) {
    return Array.isArray(collection) && collection.length > 0 &&
      collection.every(memory => memory && ["src", "caption", "detail", "alt"].every(key => typeof memory[key] === "string"));
  }
  if (!config || requiredText.some(key => typeof config[key] !== "string" || !config[key].trim()) ||
      !/^[0-9]{4}$/.test(config.secretCode) || !Array.isArray(config.letter) || !config.letter.length ||
      config.letter.some(text => typeof text !== "string") ||
      !isPhotoCollection(config.memories) || !isPhotoCollection(config.gallery) ||
      !Array.isArray(config.wishes) || !config.wishes.length ||
      config.wishes.some(wish => !wish || ["symbol", "title", "text"].some(key => typeof wish[key] !== "string")) ||
      ["audioFile", "songUrl", "songTitle", "songDescription"].some(key => typeof config[key] !== "string")) {
    reportError("Please check the birthday, four-digit code, text and photo lists in config.js.", new Error("Invalid surprise configuration"));
    document.querySelectorAll("#gate button, #gate input").forEach(control => { control.disabled = true; });
    return;
  }

  const gate = document.getElementById("gate");
  const experience = document.getElementById("experience");
  const codeInput = document.getElementById("secret-code");
  const codeError = document.getElementById("code-error");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const effectsControls = document.querySelectorAll("[data-effects-toggle]");
  let effectsPaused = false;
  let effectsEnabled = !reducedMotion.matches;
  function syncEffects() {
    effectsEnabled = !effectsPaused && !reducedMotion.matches;
    document.body.classList.toggle("effects-paused", !effectsEnabled);
    for (const control of effectsControls) {
      control.disabled = reducedMotion.matches;
      control.setAttribute("aria-pressed", String(effectsEnabled));
      control.querySelector(".effects-label").textContent = reducedMotion.matches ? "Reduced motion" : effectsEnabled ? "Pause effects" : "Resume effects";
    }
    if (!effectsEnabled) document.querySelectorAll(".confetti").forEach(container => container.replaceChildren());
  }
  effectsControls.forEach(control => control.addEventListener("click", () => {
    effectsPaused = !effectsPaused;
    syncEffects();
  }));
  reducedMotion.addEventListener("change", syncEffects);
  syncEffects();
  const soundToggle = document.getElementById("sound-toggle");
  const songButton = document.getElementById("song-button");
  const spotifyPlayer = document.getElementById("spotify-player");
  const musicStatus = document.getElementById("music-status");
  const spotify = {
    uri: "", apiPromise: null, controller: null, ready: false, loading: false,
    generation: 0, readyTimer: null, actionTimer: null, action: null,
    position: 0, error: ""
  };
  document.querySelectorAll("[data-name]").forEach(element => { element.textContent = config.name; });
  document.querySelectorAll("[data-nickname]").forEach(element => { element.textContent = config.nickname; });
  document.title = `Happy birthday, ${config.nickname}`;
  document.querySelector('meta[name="description"]').content = `For my RJ. Happy birthday, ${config.nickname}.`;
  const textFields = {
    occasion: config.occasion, "hero-intro": config.heroIntro,
    "hero-tagline": config.heroTagline,
    "hero-message": config.heroMessage, "letter-greeting": config.letterGreeting, signoff: config.signoff, sender: config.sender,
    "closing-message": config.closingMessage
  };
  for (const [id, text] of Object.entries(textFields)) document.getElementById(id).textContent = text;
  for (const paragraph of config.letter) {
    const element = document.createElement("p");
    for (const part of paragraph.split(/(\*[^*\n]+\*)/g)) {
      if (/^\*[^*\n]+\*$/.test(part)) {
        const emphasis = document.createElement("em");
        emphasis.textContent = part.slice(1, -1);
        element.append(emphasis);
      } else {
        element.append(document.createTextNode(part));
      }
    }
    document.getElementById("letter-body").append(element);
  }
  if (config.songDescription) document.getElementById("song-description").textContent = config.songDescription;
  if (config.songUrl) {
    try {
      const url = new URL(config.songUrl);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error("Song URL must use HTTP or HTTPS");
      const link = document.getElementById("song-link");
      link.href = url.href;
      link.textContent = `Listen to ${config.songTitle || "our song"} on Spotify \u2197`;
      link.hidden = false;
      const spotifyPath = url.pathname.match(/^\/(track|album)\/([a-zA-Z0-9]{22})\/?$/);
      if (url.hostname === "open.spotify.com" && spotifyPath && !config.audioFile) {
        spotify.uri = `spotify:${spotifyPath[1]}:${spotifyPath[2]}`;
        document.getElementById("sound-label").textContent = "our song";
        soundToggle.setAttribute("aria-label", `Play ${config.songTitle || "our song"}`);
        soundToggle.setAttribute("aria-controls", "spotify-player");
        songButton.hidden = true;
        document.getElementById("music-notice").hidden = false;
      }
    } catch (error) {
      reportError("The song link is invalid. Please use a complete https:// link in config.js.", error);
    }
  }

  let celebrationIndex = 0;
  function celebrate(count = 24, origin) {
    if (!effectsEnabled) return;
    const container = document.getElementById("confetti");
    const x = Math.max(16, Math.min(window.innerWidth - 16, origin?.x ?? window.innerWidth / 2));
    const y = Math.max(24, Math.min(window.innerHeight - 24, origin?.y ?? window.innerHeight * 0.4));
    const colours = ["#9b37d1", "#ee4b99", "#ffbf2f", "#7d4be6", "#40b8a4", "#ff7b5c"];
    celebrationIndex++;
    while (container.childElementCount + count > 160 && container.firstElementChild) container.firstElementChild.remove();
    for (let index = 0; index < count; index++) {
      const shape = (index + celebrationIndex) % 7;
      let piece;
      if (shape === 0) {
        piece = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        piece.setAttribute("viewBox", "0 0 100 80");
        piece.setAttribute("class", "particle particle-butterfly");
        const art = document.createElementNS("http://www.w3.org/2000/svg", "use");
        art.setAttribute("href", "#butterfly-art");
        piece.append(art);
      } else {
        piece = document.createElement("span");
        piece.className = shape > 3 ? "particle particle-ribbon" : "particle";
        piece.textContent = shape > 3 ? "" : shape === 3 ? "\u2665" : "\u2726";
      }
      const angle = Math.PI + Math.random() * Math.PI;
      const distance = 55 + Math.random() * (count > 50 ? 240 : 130);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      piece.style.setProperty("--x", `${x}px`);
      piece.style.setProperty("--y", `${y}px`);
      piece.style.setProperty("--mid-x", `${dx * 0.7}px`);
      piece.style.setProperty("--mid-y", `${dy}px`);
      piece.style.setProperty("--end-x", `${dx * 1.3}px`);
      piece.style.setProperty("--end-y", `${dy + 150 + Math.random() * 100}px`);
      piece.style.setProperty("--duration", `${1.3 + Math.random()}s`);
      piece.style.setProperty("--size", `${shape === 0 ? 20 + Math.random() * 12 : 9 + Math.random() * 12}px`);
      piece.style.setProperty("--spin", `${Math.random() * 180 - 90}deg`);
      piece.style.setProperty("--end-spin", `${Math.random() * 400 - 200}deg`);
      piece.style.setProperty("--color", colours[(index + celebrationIndex) % colours.length]);
      piece.style.animationDelay = `${index % 5 * 20}ms`;
      piece.addEventListener("animationend", () => piece.remove(), { once: true });
      piece.addEventListener("animationcancel", () => piece.remove(), { once: true });
      container.append(piece);
    }
  }

  function clearCodeError() {
    codeError.textContent = "";
    codeInput.removeAttribute("aria-invalid");
  }
  codeInput.addEventListener("input", () => {
    codeInput.value = codeInput.value.replace(/[^0-9]/g, "").slice(0, 4);
    clearCodeError();
  });
  document.querySelectorAll("[data-digit]").forEach(button => {
    button.addEventListener("click", () => {
      if (codeInput.value.length < 4) codeInput.value += button.dataset.digit;
      clearCodeError();
    });
  });
  document.getElementById("delete-digit").addEventListener("click", () => {
    codeInput.value = codeInput.value.slice(0, -1);
    clearCodeError();
  });
  document.getElementById("unlock-form").addEventListener("submit", event => {
    event.preventDefault();
    if (codeInput.value !== config.secretCode) {
      codeError.textContent = "Not that one. Try again.";
      codeInput.setAttribute("aria-invalid", "true");
      codeInput.value = "";
      const card = document.querySelector(".gate-card");
      card.classList.remove("shake");
      void card.offsetWidth;
      card.classList.add("shake");
      codeInput.focus();
      return;
    }
    gate.hidden = true;
    experience.hidden = false;
    if (spotify.uri) showSpotifyPlayer();
    window.scrollTo({ top: 0, behavior: "instant" });
    const heading = document.getElementById("hero-title");
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    celebrate(110);
  });

  let memoryIndex = 0;
  const camera = document.getElementById("camera");
  const memoryReveals = document.getElementById("memory-reveals");
  const memoryArt = document.getElementById("memory-art-template");
  const memoryCount = document.getElementById("memory-count");
  const palettes = [["#d6b9f1", "#f7d8ec"], ["#e6c6fb", "#f4dbbb"], ["#c9b8ec", "#f1c0de"], ["#d6c1f3", "#f8dbbd"]];
  memoryCount.textContent = `${config.memories.length} memories left`;
  camera.addEventListener("click", () => {
    if (memoryIndex >= config.memories.length) return;
    const index = memoryIndex;
    const memory = config.memories[index];
    const figure = document.createElement("figure");
    figure.className = "polaroid memory-keepsake";
    figure.style.setProperty("--tilt", `${index % 2 ? 2 : -2}deg`);
    const caption = document.createElement("figcaption");
    caption.textContent = memory.caption;
    figure.append(createMemoryVisual(memory, index), caption);
    memoryReveals.hidden = false;
    memoryReveals.append(figure);
    memoryIndex++;
    const remaining = config.memories.length - memoryIndex;
    if (remaining === 0) {
      camera.disabled = true;
      camera.setAttribute("aria-label", "Every memory revealed");
      document.getElementById("memory-instruction").textContent = "All revealed.";
      memoryCount.textContent = "Every memory revealed \u2726";
      celebrate(20, pointAt(camera));
    } else {
      camera.setAttribute("aria-label", `Reveal memory ${memoryIndex + 1} of ${config.memories.length}`);
      memoryCount.textContent = `${remaining} ${remaining === 1 ? "memory" : "memories"} left`;
    }
  });

  function createMemoryArt(index) {
    const artwork = memoryArt.content.firstElementChild.cloneNode(true);
    const palette = palettes[index % palettes.length];
    artwork.style.background = `linear-gradient(${palette[0]}, ${palette[1]})`;
    return artwork;
  }
  function createMemoryVisual(memory, index) {
    if (!memory.src) return createMemoryArt(index);
    const image = document.createElement("img");
    image.alt = memory.alt;
    image.addEventListener("error", () => {
      image.replaceWith(createMemoryArt(index));
      reportError("This photo couldn't load. Check its filename in config.js and include the photos folder when sharing.", new Error(`Missing photo: ${memory.src}`));
    }, { once: true });
    image.src = memory.src;
    return image;
  }
  const photoDialog = document.getElementById("photo-dialog");
  let galleryIndex = 0;
  function showGalleryMemory(index) {
    galleryIndex = (index + config.gallery.length) % config.gallery.length;
    const memory = config.gallery[galleryIndex];
    document.getElementById("dialog-visual").replaceChildren(createMemoryVisual(memory, galleryIndex));
    document.getElementById("dialog-caption").textContent = memory.caption;
    document.getElementById("dialog-detail").textContent = memory.detail;
    document.getElementById("dialog-count").textContent = `${galleryIndex + 1} / ${config.gallery.length}`;
  }
  config.gallery.forEach((memory, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-photo";
    button.setAttribute("aria-label", `Open photo ${index + 1}: ${memory.caption}`);
    const label = document.createElement("span");
    label.className = "gallery-caption";
    label.textContent = memory.caption;
    button.append(createMemoryVisual(memory, index), label);
    button.addEventListener("click", () => {
      showGalleryMemory(index);
      photoDialog.showModal();
    });
    document.getElementById("photo-gallery").append(button);
  });
  document.getElementById("close-photo").addEventListener("click", () => photoDialog.close());
  document.getElementById("previous-photo").addEventListener("click", () => showGalleryMemory(galleryIndex - 1));
  document.getElementById("next-photo").addEventListener("click", () => showGalleryMemory(galleryIndex + 1));
  photoDialog.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      photoDialog.close();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      showGalleryMemory(galleryIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  photoDialog.addEventListener("click", event => {
    const bounds = photoDialog.getBoundingClientRect();
    if (event.target === photoDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) photoDialog.close();
  });

  const wishButton = document.getElementById("wish-button");
  const sliceButton = document.getElementById("slice-button");
  const cakeScene = document.getElementById("cake-scene");
  const cakeServed = document.getElementById("cake-served");
  const cakeMessage = document.getElementById("cake-message");
  const cakeInstructions = document.getElementById("cake-instructions");
  const wishRitual = document.getElementById("wish-ritual");
  let cakeDrag = null;
  function pointAt(element) {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
  function cutCake(origin) {
    if (cakeScene.classList.contains("sliced")) return;
    const celebrationOrigin = origin ?? pointAt(cakeScene);
    const moveFocus = document.activeElement === cakeScene || document.activeElement === sliceButton;
    cakeScene.classList.add("sliced", "wished");
    cakeScene.setAttribute("aria-disabled", "true");
    cakeScene.hidden = true;
    cakeServed.hidden = false;
    sliceButton.disabled = true;
    sliceButton.hidden = true;
    cakeMessage.textContent = "The bigger slice is yours. Birthday rules.";
    cakeInstructions.textContent = "A slice for you. One for me.";
    if (moveFocus) cakeMessage.focus({ preventScroll: true });
    celebrate(110, celebrationOrigin);
  }
  function endCakeDrag(event, cancelled = false) {
    if (!cakeDrag || cakeDrag.id !== event.pointerId) return;
    const drag = cakeDrag;
    cakeDrag = null;
    cakeScene.classList.remove("dragging", "reverse");
    cakeScene.style.removeProperty("--knife-x");
    cakeScene.style.removeProperty("--cut-progress");
    if (cakeScene.hasPointerCapture(event.pointerId)) cakeScene.releasePointerCapture(event.pointerId);
    if (cancelled) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    const endX = (event.clientX - drag.box.left) / drag.box.width;
    const fullSweep = (drag.startX <= 0.3 && endX >= 0.8 && dx > 0) || (drag.startX >= 0.7 && endX <= 0.2 && dx < 0);
    if (fullSweep && Math.abs(dx) >= drag.box.width * 0.5 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      cutCake({ x: event.clientX, y: event.clientY });
    } else if (drag.horizontal) {
      cakeMessage.textContent = "Start near one edge and drag all the way across.";
    }
  }
  cakeScene.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0 || cakeScene.classList.contains("sliced")) return;
    const box = cakeScene.getBoundingClientRect();
    const startY = (event.clientY - box.top) / box.height;
    const startX = (event.clientX - box.left) / box.width;
    if (startY < 0.28 || startY > 0.88 || startX < 0.08 || startX > 0.92) return;
    cakeDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, startX, box, horizontal: false };
    cakeScene.classList.toggle("reverse", startX > 0.5);
    cakeScene.setPointerCapture(event.pointerId);
    cakeScene.focus({ preventScroll: true });
  });
  cakeScene.addEventListener("pointermove", event => {
    if (!cakeDrag || cakeDrag.id !== event.pointerId) return;
    const dx = event.clientX - cakeDrag.x;
    const dy = event.clientY - cakeDrag.y;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.3) cakeDrag.horizontal = true;
    if (!cakeDrag.horizontal) return;
    event.preventDefault();
    cakeScene.classList.add("dragging");
    const position = (event.clientX - cakeDrag.box.left) / cakeDrag.box.width;
    const progress = (cakeDrag.startX > 0.5 ? 0.87 - position : position - 0.13) / 0.74;
    cakeScene.style.setProperty("--knife-x", `${Math.max(8, Math.min(92, position * 100))}%`);
    cakeScene.style.setProperty("--cut-progress", `${Math.max(0, Math.min(100, progress * 100))}%`);
  });
  cakeScene.addEventListener("pointerup", event => endCakeDrag(event));
  cakeScene.addEventListener("pointercancel", event => endCakeDrag(event, true));
  cakeScene.addEventListener("lostpointercapture", event => endCakeDrag(event, true));
  cakeScene.addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
      event.preventDefault();
      cutCake(pointAt(cakeScene));
    }
  });
  wishButton.addEventListener("click", () => {
    const blown = !wishRitual.classList.contains("blown");
    wishRitual.classList.toggle("blown", blown);
    wishButton.setAttribute("aria-pressed", String(blown));
    wishButton.setAttribute("aria-label", blown ? "Relight the candle" : "Blow out the candle");
    document.getElementById("candle-hint").textContent = blown ? "Tap to relight." : "Tap the candle when you're ready.";
    document.getElementById("wish-message").textContent = blown ? "Wish made. Your secret's safe." : "Ready for another wish.";
    if (blown) celebrate(24, pointAt(wishButton));
  });
  sliceButton.addEventListener("click", () => {
    cutCake(pointAt(cakeScene));
  });

  config.wishes.forEach((wish, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "wish-card";
    button.setAttribute("aria-expanded", "false");
    const number = document.createElement("span");
    number.className = "wish-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const symbol = document.createElement("span");
    symbol.className = "wish-symbol";
    symbol.textContent = wish.symbol;
    symbol.setAttribute("aria-hidden", "true");
    const title = document.createElement("span");
    title.className = "wish-title";
    title.textContent = wish.title;
    const hint = document.createElement("span");
    hint.className = "wish-hint";
    hint.textContent = "TAP TO OPEN";
    const reveal = document.createElement("span");
    reveal.className = "wish-reveal";
    reveal.id = `wish-text-${index}`;
    reveal.textContent = wish.text;
    reveal.hidden = true;
    button.setAttribute("aria-controls", reveal.id);
    button.append(number, symbol, title, hint, reveal);
    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(expanded));
      reveal.hidden = !expanded;
      hint.hidden = expanded;
    });
    document.getElementById("wish-cards").append(button);
  });

  let audioContext;
  let audio;
  let melodyTimer;
  let playing = false;
  let audioPending = false;
  const voices = new Set();
  function updateMusicState(isPlaying) {
    playing = isPlaying;
    document.body.classList.toggle("playing", playing);
    soundToggle.setAttribute("aria-pressed", String(playing));
    soundToggle.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${spotify.uri ? config.songTitle || "our song" : "music"}`);
    songButton.setAttribute("aria-pressed", String(playing));
    document.getElementById("sound-label").textContent = spotify.uri ? playing ? "pause song" : "play song" : playing ? "sound on" : "sound off";
    songButton.textContent = playing ? "Pause music \u2161" : "Play music \u266b";
  }
  function scheduleMelody() {
    // An original, looping pentatonic phrase; no recording or external request.
    const notes = [523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 440, 523.25, 659.25, 880, 783.99, 659.25, 587.33, 440, 523.25, 0];
    const start = audioContext.currentTime + 0.06;
    notes.forEach((frequency, index) => {
      if (!frequency) return;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const time = start + index * 0.48;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.055, time + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.3);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      voices.add(oscillator);
      oscillator.addEventListener("ended", () => {
        voices.delete(oscillator);
        oscillator.disconnect();
        gain.disconnect();
      }, { once: true });
      oscillator.start(time);
      oscillator.stop(time + 1.4);
    });
  }
  function stopMusic() {
    clearInterval(melodyTimer);
    if (audio) audio.pause();
    for (const voice of voices) voice.stop();
    voices.clear();
    if (spotify.uri) {
      spotify.generation++;
      clearTimeout(spotify.readyTimer);
      clearTimeout(spotify.actionTimer);
      spotify.action = null;
      spotify.ready = false;
      spotify.loading = false;
      if (spotify.controller) {
        spotify.controller.destroy();
        spotify.controller = null;
      }
      spotifyPlayer.replaceChildren();
      spotifyPlayer.hidden = true;
      soundToggle.disabled = false;
      soundToggle.removeAttribute("aria-busy");
      musicStatus.textContent = "";
      clearSpotifyError();
    }
    updateMusicState(false);
  }
  function setMusicStatus(message) {
    if (musicStatus.textContent !== message) musicStatus.textContent = message;
  }
  function clearSpotifyError() {
    if (spotify.error && errorBox.textContent === spotify.error) {
      errorBox.hidden = true;
      errorBox.textContent = "";
    }
    spotify.error = "";
  }
  function reportSpotifyError(message, error) {
    spotify.loading = false;
    soundToggle.disabled = false;
    soundToggle.removeAttribute("aria-busy");
    if (!spotify.ready) {
      document.getElementById("sound-label").textContent = "retry song";
      soundToggle.setAttribute("aria-label", "Retry loading our song");
    }
    spotify.error = message;
    setMusicStatus(message);
    reportError(message, error);
  }
  function loadSpotifyApi() {
    if (!spotify.apiPromise) {
      spotify.apiPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        const fail = error => {
          clearTimeout(timer);
          script.remove();
          spotify.apiPromise = null;
          reject(error);
        };
        const timer = setTimeout(() => fail(new Error("Spotify API loading timed out")), 15000);
        window.onSpotifyIframeApiReady = api => {
          clearTimeout(timer);
          resolve(api);
        };
        script.src = "https://open.spotify.com/embed/iframe-api/v1";
        script.async = true;
        script.addEventListener("error", () => fail(new Error("Spotify API could not load")), { once: true });
        document.head.append(script);
      });
    }
    return spotify.apiPromise;
  }
  async function showSpotifyPlayer() {
    spotifyPlayer.hidden = false;
    if (spotify.ready || spotify.loading) return;
    const generation = ++spotify.generation;
    spotify.loading = true;
    soundToggle.disabled = true;
    soundToggle.setAttribute("aria-busy", "true");
    document.getElementById("sound-label").textContent = "loading...";
    setMusicStatus("Loading the instrumental...");
    clearTimeout(spotify.readyTimer);
    if (spotify.controller) {
      spotify.controller.destroy();
      spotify.controller = null;
    }
    try {
      const api = await loadSpotifyApi();
      if (generation !== spotify.generation || experience.hidden) return;
      const placeholder = document.createElement("div");
      spotifyPlayer.replaceChildren(placeholder);
      spotify.readyTimer = setTimeout(() => {
        if (generation === spotify.generation && !spotify.ready) {
          reportSpotifyError("Spotify is taking too long to load. Retry, or open the track below.", new Error("Spotify player readiness timed out"));
        }
      }, 15000);
      api.createController(placeholder, { uri: spotify.uri, width: "100%", height: 152 }, controller => {
        if (generation !== spotify.generation || experience.hidden) {
          controller.destroy();
          return;
        }
        spotify.controller = controller;
        const frame = spotifyPlayer.querySelector("iframe");
        if (!frame) {
          reportSpotifyError("Spotify couldn't create its player. Retry or open the track below.", new Error("Missing Spotify iframe"));
          return;
        }
        frame.title = `${config.songTitle || "Our song"} on Spotify`;
        frame.referrerPolicy = "no-referrer";
        frame.loading = "eager";
        controller.addListener("ready", () => {
          if (generation !== spotify.generation) return;
          clearTimeout(spotify.readyTimer);
          spotify.ready = true;
          spotify.loading = false;
          spotify.position = 0;
          soundToggle.disabled = false;
          soundToggle.removeAttribute("aria-busy");
          clearSpotifyError();
          updateMusicState(false);
          setMusicStatus("");
        });
        controller.addListener("playback_update", event => {
          if (generation !== spotify.generation) return;
          const { isPaused, isBuffering, position } = event.data;
          if (typeof isPaused !== "boolean" || typeof isBuffering !== "boolean" || !Number.isFinite(position)) {
            reportSpotifyError("Spotify returned an unreadable playback status. Please use its player directly.", new Error("Invalid Spotify playback update"));
            return;
          }
          spotify.position = position;
          if (playing !== !isPaused) updateMusicState(!isPaused);
          const action = spotify.action;
          const progressed = action && position > 100 && (position > action.position + 100 || position < action.position);
          if (action && ((action.playing && !isPaused && !isBuffering && progressed) || (!action.playing && isPaused))) {
            clearTimeout(spotify.actionTimer);
            spotify.action = null;
            clearSpotifyError();
          }
          if (!isPaused || !spotify.action) {
            soundToggle.disabled = false;
            soundToggle.removeAttribute("aria-busy");
          }
          setMusicStatus(isBuffering ? "Buffering..." : spotify.action?.playing ? "Starting the instrumental..." : isPaused ? "Paused" : "Playing");
        });
      });
    } catch (error) {
      if (generation !== spotify.generation || experience.hidden) return;
      clearTimeout(spotify.readyTimer);
      reportSpotifyError("Spotify couldn't load. Retry, check your connection, or open the track below.", error);
    }
  }
  async function toggleMusic() {
    if (spotify.uri) {
      if (!spotify.ready || !spotify.controller) {
        showSpotifyPlayer();
        spotifyPlayer.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "center" });
        return;
      }
      clearTimeout(spotify.actionTimer);
      spotify.action = { playing: !playing, position: spotify.position };
      soundToggle.disabled = true;
      soundToggle.setAttribute("aria-busy", "true");
      setMusicStatus(playing ? "Pausing..." : "Starting the instrumental...");
      spotify.actionTimer = setTimeout(() => {
        const starting = spotify.action?.playing;
        spotify.action = null;
        reportSpotifyError(starting ? "Spotify didn't confirm playback. Use Play in the player or open the track below; Spotify may require sign-in." : "Spotify didn't confirm the pause. Please use Pause in its player.", new Error("Spotify playback command timed out"));
      }, 12000);
      try {
        spotify.controller.togglePlay();
      } catch (error) {
        clearTimeout(spotify.actionTimer);
        spotify.action = null;
        reportSpotifyError("Spotify couldn't change playback. Please use its player directly.", error);
      }
      return;
    }
    if (audioPending) return;
    if (playing) {
      stopMusic();
      return;
    }
    audioPending = true;
    try {
      if (config.audioFile) {
        if (!audio) {
          audio = new Audio(config.audioFile);
          audio.loop = true;
          audio.volume = 0.4;
          audio.addEventListener("error", () => {
            stopMusic();
            reportError("The music couldn't load. Check audioFile in config.js and include the audio file when sharing.", audio.error);
          });
        }
        await audio.play();
      } else {
        if (!window.AudioContext) throw new Error("Web Audio is not available in this browser");
        audioContext ??= new AudioContext();
        await audioContext.resume();
        scheduleMelody();
        melodyTimer = setInterval(scheduleMelody, 7680);
      }
      updateMusicState(true);
      if (document.hidden || experience.hidden) stopMusic();
    } catch (error) {
      stopMusic();
      reportError("The music couldn't start. Try again, and check your browser's audio permission and the audio file.", error);
    } finally {
      audioPending = false;
    }
  }
  soundToggle.addEventListener("click", toggleMusic);
  songButton.addEventListener("click", toggleMusic);
  document.addEventListener("visibilitychange", () => { if (document.hidden && !spotify.uri) stopMusic(); });
  window.addEventListener("pagehide", stopMusic);
  window.addEventListener("pageshow", () => {
    if (spotify.uri && !experience.hidden) showSpotifyPlayer();
  });

  document.getElementById("hug-button").addEventListener("click", () => {
    document.getElementById("hug-message").textContent = `A proper one when I see you, ${config.nickname}. \u2661`;
    celebrate(110, pointAt(document.getElementById("hug-button")));
  });
  document.getElementById("lock-button").addEventListener("click", () => {
    stopMusic();
    experience.hidden = true;
    gate.hidden = false;
    codeInput.value = "";
    clearCodeError();
    document.querySelectorAll(".confetti").forEach(container => container.replaceChildren());
    window.scrollTo({ top: 0, behavior: "instant" });
    codeInput.focus({ preventScroll: true });
  });
})();
