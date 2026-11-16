"use strict";

(() => {
  const errorBox = document.getElementById("app-error");
  function reportError(message, error) {
    console.error(message, error);
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  const config = window.SURPRISE;
  const requiredText = ["name", "nickname", "birthDate", "sender", "secretCode", "occasion", "heroIntro", "heroMessage", "signoff", "closingMessage"];
  function isPhotoCollection(collection) {
    return Array.isArray(collection) && collection.length > 0 &&
      collection.every(memory => memory && ["src", "caption", "detail", "alt"].every(key => typeof memory[key] === "string"));
  }
  if (!config || requiredText.some(key => typeof config[key] !== "string" || !config[key].trim()) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(config.birthDate) ||
      !Number.isFinite(Date.parse(`${config.birthDate}T00:00:00Z`)) ||
      new Date(`${config.birthDate}T00:00:00Z`).toISOString().slice(0, 10) !== config.birthDate ||
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
  const soundToggle = document.getElementById("sound-toggle");
  const songButton = document.getElementById("song-button");
  const spotifyPlayer = document.getElementById("spotify-player");
  let spotifyEmbedUrl = "";
  document.querySelectorAll("[data-name]").forEach(element => { element.textContent = config.name; });
  document.querySelectorAll("[data-nickname]").forEach(element => { element.textContent = config.nickname; });
  document.title = `Happy birthday, ${config.nickname}`;
  document.querySelector('meta[name="description"]').content = `For my RJ. Happy birthday, ${config.nickname}.`;
  const birthday = document.getElementById("birthday-date");
  birthday.dateTime = config.birthDate;
  birthday.textContent = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${config.birthDate}T00:00:00Z`)).toUpperCase();
  const textFields = {
    occasion: config.occasion, "hero-intro": config.heroIntro,
    "hero-message": config.heroMessage, signoff: config.signoff, sender: config.sender,
    "closing-message": config.closingMessage
  };
  for (const [id, text] of Object.entries(textFields)) document.getElementById(id).textContent = text;
  for (const paragraph of config.letter) {
    const element = document.createElement("p");
    element.textContent = paragraph;
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
        spotifyEmbedUrl = `https://open.spotify.com/embed/${spotifyPath[1]}/${spotifyPath[2]}`;
        document.getElementById("sound-label").textContent = "our song";
        soundToggle.setAttribute("aria-label", `Jump to ${config.songTitle || "our song"} player`);
        soundToggle.removeAttribute("aria-pressed");
        soundToggle.setAttribute("aria-controls", "spotify-player");
        songButton.hidden = true;
        document.getElementById("music-notice").hidden = false;
      }
    } catch (error) {
      reportError("The song link is invalid. Please use a complete https:// link in config.js.", error);
    }
  }

  function celebrate(count = 30) {
    if (reducedMotion.matches) return;
    const container = document.getElementById("confetti");
    container.replaceChildren();
    const colours = ["#7ba8ca", "#d397ab", "#b8a078", "#a4bfaf"];
    for (let index = 0; index < count; index++) {
      const piece = document.createElement("span");
      piece.textContent = index % 3 ? "\u2665" : "\u2727";
      piece.style.setProperty("--left", `${Math.random() * 100}%`);
      piece.style.setProperty("--duration", `${3 + Math.random() * 3}s`);
      piece.style.setProperty("--size", `${10 + Math.random() * 12}px`);
      piece.style.setProperty("--sway", `${Math.random() * 120 - 60}px`);
      piece.style.setProperty("--color", colours[index % colours.length]);
      piece.addEventListener("animationend", () => piece.remove(), { once: true });
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
    if (spotifyEmbedUrl) showSpotifyPlayer();
    window.scrollTo({ top: 0, behavior: "instant" });
    const heading = document.getElementById("hero-title");
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    celebrate();
  });

  let memoryIndex = 0;
  const photo = document.getElementById("memory-photo");
  const art = document.getElementById("memory-art");
  const caption = document.getElementById("memory-caption");
  const detail = document.getElementById("memory-detail");
  const memoryCount = document.getElementById("memory-count");
  const palettes = [["#c2d9e7", "#efd8d7"], ["#cddccf", "#f0e2bd"], ["#d9d3e8", "#ecc8d1"], ["#bbd6e4", "#f4d5b3"]];
  memoryCount.textContent = `${config.memories.length} photos. All favourites.`;
  photo.addEventListener("error", () => {
    photo.hidden = true;
    art.hidden = false;
    reportError("This photo couldn't load. Check its filename in config.js and include the photos folder when sharing.", new Error(`Missing memory image: ${photo.getAttribute("src")}`));
  });
  document.getElementById("camera").addEventListener("click", () => {
    const index = memoryIndex % config.memories.length;
    const memory = config.memories[index];
    caption.textContent = memory.caption;
    detail.textContent = memory.detail;
    photo.hidden = !memory.src;
    art.hidden = Boolean(memory.src);
    if (memory.src) {
      photo.alt = memory.alt;
      photo.src = memory.src;
    } else {
      photo.removeAttribute("src");
      const palette = palettes[index % palettes.length];
      art.style.background = `linear-gradient(${palette[0]}, ${palette[1]})`;
    }
    const display = document.getElementById("memory-display");
    display.classList.remove("developing");
    void display.offsetWidth;
    display.classList.add("developing");
    memoryIndex++;
    memoryCount.textContent = `${index + 1} / ${config.memories.length}`;
  });

  function createMemoryArt(index) {
    const artwork = art.cloneNode(true);
    artwork.removeAttribute("id");
    artwork.hidden = false;
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
      reportError("This gallery photo couldn't load. Check its filename in config.js and include the photos folder when sharing.", new Error(`Missing gallery image: ${memory.src}`));
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
  const cakeMessage = document.getElementById("cake-message");
  wishButton.addEventListener("click", () => {
    cakeScene.classList.add("wished");
    cakeMessage.textContent = "Wish made. Cake next?";
    wishButton.textContent = "Wish made \u2713";
    sliceButton.disabled = false;
    sliceButton.focus({ preventScroll: true });
    wishButton.disabled = true;
    celebrate(22);
  });
  sliceButton.addEventListener("click", () => {
    if (!cakeScene.classList.contains("sliced")) {
      cakeScene.classList.add("sliced");
      cakeMessage.textContent = "The bigger slice is yours. Birthday rules.";
      sliceButton.textContent = "One more wish? \u2727";
    } else {
      cakeScene.classList.remove("wished", "sliced");
      cakeMessage.textContent = "Close your eyes. You know the drill.";
      wishButton.disabled = false;
      wishButton.textContent = "Make a wish \u2727";
      wishButton.focus({ preventScroll: true });
      sliceButton.disabled = true;
      sliceButton.textContent = "Cut the cake \u2661";
    }
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
    soundToggle.setAttribute("aria-label", playing ? "Pause music" : "Play music");
    songButton.setAttribute("aria-pressed", String(playing));
    document.getElementById("sound-label").textContent = playing ? "sound on" : "sound off";
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
    if (spotifyEmbedUrl) {
      spotifyPlayer.replaceChildren();
      spotifyPlayer.hidden = true;
      return;
    }
    updateMusicState(false);
  }
  function showSpotifyPlayer() {
    if (!spotifyPlayer.firstElementChild) {
      const frame = document.createElement("iframe");
      frame.title = `${config.songTitle || "Our song"} on Spotify`;
      frame.src = spotifyEmbedUrl;
      frame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      frame.referrerPolicy = "no-referrer";
      frame.addEventListener("error", () => {
        reportError("Spotify couldn't load. Check your connection or use the direct song link below.", new Error("Spotify iframe failed"));
      });
      spotifyPlayer.append(frame);
    }
    spotifyPlayer.hidden = false;
  }
  async function toggleMusic() {
    if (spotifyEmbedUrl) {
      showSpotifyPlayer();
      spotifyPlayer.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "center" });
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
  document.addEventListener("visibilitychange", () => { if (document.hidden && !spotifyEmbedUrl) stopMusic(); });
  window.addEventListener("pagehide", stopMusic);
  window.addEventListener("pageshow", () => {
    if (spotifyEmbedUrl && !experience.hidden) showSpotifyPlayer();
  });

  document.getElementById("hug-button").addEventListener("click", () => {
    document.getElementById("hug-message").textContent = `A proper one when I see you, ${config.nickname}. \u2661`;
    celebrate(45);
  });
  document.getElementById("lock-button").addEventListener("click", () => {
    stopMusic();
    experience.hidden = true;
    gate.hidden = false;
    codeInput.value = "";
    clearCodeError();
    document.getElementById("confetti").replaceChildren();
    window.scrollTo({ top: 0, behavior: "instant" });
    codeInput.focus({ preventScroll: true });
  });
})();
