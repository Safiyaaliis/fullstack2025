
document.addEventListener("DOMContentLoaded", function () {
  initMocktailLab();
  initSubscribeForm();
});


function initMocktailLab() {
  const list = document.getElementById("mocktailList");
  if (!list) return; 

  const searchInput = document.getElementById("searchInput");
  const baseFilter = document.getElementById("baseFilter");
  const sortSelect = document.getElementById("sortSelect");
  const statusText = document.getElementById("listStatus");

  const form = document.getElementById("addMocktailForm");
  const nameInput = document.getElementById("mocktailName");
  const baseInput = document.getElementById("mocktailBase");
  const flavorInput = document.getElementById("mocktailFlavor");
  const diffInput = document.getElementById("mocktailDifficulty");

  const errorList = document.getElementById("formErrors");
  const formMessage = document.getElementById("formMessage");

  const STORAGE_KEY = "moreRedbull_mocktails";


  let mocktails = load(STORAGE_KEY);

  if (!mocktails) {
    mocktails = [
      { id: Date.now() + 1, name: "Bloomin’ Grapefruit", base: "Spring edition", flavor: "grapefruit, mint", difficulty: 1, favorite: true },
      { id: Date.now() + 2, name: "Silver Spark", base: "Red Bull Original", flavor: "lemon, honey", difficulty: 1, favorite: false },
      { id: Date.now() + 3, name: "Emerald Bloom", base: "Redbull Green Edition", flavor: "lime, elderflower", difficulty: 2, favorite: false }
    ];
    save(STORAGE_KEY, mocktails);
  }

  let searchText = "";
  let selectedBase = "all";
  let selectedSort = "name-asc";


  function renderList() {
    list.innerHTML = "";


    let filtered = mocktails.filter(function (item) {
      const q = searchText.toLowerCase();

      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.flavor.toLowerCase().includes(q) ||
        item.base.toLowerCase().includes(q);

      const matchesBase = (selectedBase === "all") || (item.base === selectedBase);

      return matchesSearch && matchesBase;
    });


    if (selectedSort === "name-asc") {
      filtered.sort((a, b) => a.name.localeCompare(b.name, "sv"));
    } else if (selectedSort === "name-desc") {
      filtered.sort((a, b) => b.name.localeCompare(a.name, "sv"));
    } else if (selectedSort === "difficulty-asc") {
      filtered.sort((a, b) => a.difficulty - b.difficulty);
    } else if (selectedSort === "difficulty-desc") {
      filtered.sort((a, b) => b.difficulty - a.difficulty);
    }

 
    if (mocktails.length === 0) {
      statusText.textContent = "Listan är tom. Lägg till din första mocktail 👇";
      return;
    }

    if (filtered.length === 0) {
      statusText.textContent = "Inga matchningar. Testa ett annat sökord eller filter.";
      return;
    }

    statusText.textContent = "Visar " + filtered.length + " av " + mocktails.length + " mocktails.";


    filtered.forEach(function (item) {
      const li = document.createElement("li");
      li.className = "mocktail-card";
      li.dataset.id = item.id;

      li.innerHTML = `
        <h4>${escapeHtml(item.name)} ${item.favorite ? "⭐" : ""}</h4>
        <p class="mocktail-meta"><b>Bas:</b> ${escapeHtml(item.base)}</p>
        <p class="mocktail-meta"><b>Smak:</b> ${escapeHtml(item.flavor)}</p>
        <p class="mocktail-difficulty"><b>Svårighet:</b> ${difficultyText(item.difficulty)}</p>

        <div class="mocktail-actions">
          <button type="button" data-action="fav">${item.favorite ? "Ta bort favorit" : "Spara favorit"}</button>
          <button type="button" data-action="view">Visa</button>
          <button type="button" data-action="delete">Ta bort</button>
        </div>
      `;

      list.appendChild(li);
    });
  }


  searchInput.addEventListener("input", function (e) {
    searchText = e.target.value.trim();
    renderList();
  });

  baseFilter.addEventListener("change", function (e) {
    selectedBase = e.target.value;
    renderList();
  });

  sortSelect.addEventListener("change", function (e) {
    selectedSort = e.target.value;
    renderList();
  });


  form.addEventListener("submit", function (e) {
    e.preventDefault();

    clearFormFeedback();

    const name = nameInput.value.trim();
    const base = baseInput.value.trim();
    const flavor = flavorInput.value.trim();
    const diff = Number(diffInput.value);

    const errors = [];

    if (name.length < 2) errors.push("Namnet måste vara minst 2 tecken.");
    if (!base) errors.push("Välj en bas.");
    if (flavor.length < 2) errors.push("Smakprofil måste vara minst 2 tecken.");

    if (errors.length > 0) {
      showErrors(errors);
      return;
    }

    const newMocktail = {
      id: Date.now(),
      name: name,
      base: base,
      flavor: flavor,
      difficulty: diff,
      favorite: false
    };

    mocktails.unshift(newMocktail);
    save(STORAGE_KEY, mocktails);

    formMessage.textContent = "Sparat! Din mocktail är tillagd ✅";
    formMessage.classList.remove("error");

    form.reset();
    diffInput.value = "1";

    renderList();
  });


  list.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.dataset.action;
    const card = btn.closest(".mocktail-card");
    if (!card) return;

    const id = Number(card.dataset.id);
    const item = mocktails.find(m => m.id === id);
    if (!item) return;

    if (action === "delete") {
      mocktails = mocktails.filter(m => m.id !== id);
      save(STORAGE_KEY, mocktails);
      renderList();
      return;
    }

    if (action === "fav") {
      item.favorite = !item.favorite;
      save(STORAGE_KEY, mocktails);
      renderList();
      return;
    }

    if (action === "view") {
      openModal(item);
      return;
    }
  });


  let modal = null;

  function openModal(item) {
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "rb-modal";
      modal.innerHTML = `
        <div class="rb-modal__overlay" data-close="true"></div>
        <div class="rb-modal__content">
          <button class="rb-modal__close" type="button" data-close="true" aria-label="Stäng">✕</button>
          <div class="rb-modal__body"></div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.addEventListener("click", function (e) {
        if (e.target.dataset.close === "true") closeModal();
      });
    }

    const body = modal.querySelector(".rb-modal__body");
    body.innerHTML = `
      <h3>${escapeHtml(item.name)} ${item.favorite ? "⭐" : ""}</h3>
      <p><b>Bas:</b> ${escapeHtml(item.base)}</p>
      <p><b>Smak:</b> ${escapeHtml(item.flavor)}</p>
      <p><b>Svårighet:</b> ${difficultyText(item.difficulty)}</p>
    `;

    modal.classList.add("is-open");
    document.addEventListener("keydown", escClose);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    document.removeEventListener("keydown", escClose);
  }

  function escClose(e) {
    if (e.key === "Escape") closeModal();
  }

  function clearFormFeedback() {
    errorList.innerHTML = "";
    formMessage.textContent = "";
    formMessage.classList.remove("error");
  }

  function showErrors(errors) {
    errors.forEach(function (msg) {
      const li = document.createElement("li");
      li.textContent = msg;
      errorList.appendChild(li);
    });
    formMessage.textContent = "Formuläret har fel. Rätta och försök igen.";
    formMessage.classList.add("error");
  }

  renderList();
}


function initSubscribeForm() {
  const form = document.getElementById("subscribeForm");
  if (!form) return;

  const name = document.getElementById("subscriberName");
  const email = document.getElementById("email");
  const consent = document.getElementById("consent");

  const errorsEl = document.getElementById("subscribeErrors");
  const msgEl = document.getElementById("subscribeMessage");

  const STORAGE_KEY = "moreRedbull_subscriber";

  // återläs (kul i demo)
  const saved = load(STORAGE_KEY);
  if (saved && saved.email) email.value = saved.email;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorsEl.innerHTML = "";
    msgEl.textContent = "";
    msgEl.classList.remove("error");

    const errors = [];

    const userName = name.value.trim();
    const userEmail = email.value.trim();

    if (userName.length < 2) errors.push("Skriv ditt namn (minst 2 tecken).");

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(userEmail);
    if (!emailOk) errors.push("Skriv en giltig e-postadress.");

    if (!consent.checked) errors.push("Du måste kryssa i att du godkänner utskick.");

    if (errors.length > 0) {
      errors.forEach(function (msg) {
        const li = document.createElement("li");
        li.textContent = msg;
        errorsEl.appendChild(li);
      });
      msgEl.textContent = "Kolla fälten ovan och försök igen.";
      msgEl.classList.add("error");
      return;
    }

    save(STORAGE_KEY, { name: userName, email: userEmail });

    msgEl.textContent = "Tack " + userName + "! Du är nu prenumerant ✅";
    form.reset();
  });
}



function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function difficultyText(n) {
  if (n === 1) return "Enkel";
  if (n === 2) return "Mellan";
  return "Avancerad";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
