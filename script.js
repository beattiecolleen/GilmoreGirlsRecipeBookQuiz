// ========================
// Globale Variablen
// ========================
let currentStepIndex = 0;
let userSelections = {};
let allRecipes = [];
const steps = [
  "frage-gang",
  "frage-art-frühstück",
  "frage-art-hauptgericht",
  "frage-art-dessert",
  "frage-art-beilage",
  "frage-hauptkomponente",
  "frage-essweise",
  "frage-jahreszeit",
  "frage-zeitaufwand",
  "frage-schwierigkeit",
  "frage-ort",
  "frage-laenderkueche"
];

// DOM-Elemente
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz");
const resultScreen = document.getElementById("ergebnis");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("neustart-button");
const rezeptName = document.getElementById("rezept-name");
const rezeptSeite = document.getElementById("rezept-seite");

// ========================
// JSON laden
// ========================
fetch("Rezepte.json")
  .then(res => res.json())
  .then(data => {
    allRecipes = data;
    console.log("Rezepte geladen:", allRecipes.length);
  })
  .catch(err => console.error("Fehler beim Laden der Rezepte:", err));

// ========================
// Quiz starten
// ========================
startButton.addEventListener("click", () => {
  startScreen.style.display = "none";
  quizScreen.style.display = "block";
  currentStepIndex = 0;
  showStep(steps[currentStepIndex]);
});

// ========================
// Neustart
// ========================
restartButton.addEventListener("click", () => {
  resultScreen.style.display = "none";
  startScreen.style.display = "block";
  userSelections = {};
});

// ========================
// Klicks auf Option-Buttons
// ========================
document.querySelectorAll(".option-button").forEach(button => {
  button.addEventListener("click", () => {
    const question = button.dataset.question;
    let value = button.dataset.value;

    // "Überrasch mich" zufällig auswählen aus kompatiblen Rezepten
    if (value === "Random") {
      const options = getValidRandomOptions(question);
      if (options.length > 0) {
        value = options[Math.floor(Math.random() * options.length)];
      } else {
        value = null;
      }
    }

    userSelections[question] = value;
    nextStep(question);
  });
});

// ========================
// Nächste Frage bestimmen
// ========================
function nextStep(lastQuestion) {
  document.getElementById(steps[currentStepIndex]).style.display = "none";

  const gang = userSelections["gang"];

  if (lastQuestion === "gang") {
    if (gang === "Frühstück") currentStepIndex = steps.indexOf("frage-art-frühstück");
    else if (gang === "Hauptgericht") currentStepIndex = steps.indexOf("frage-art-hauptgericht");
    else if (gang === "Dessert") currentStepIndex = steps.indexOf("frage-art-dessert");
    else if (gang === "Beilage") currentStepIndex = steps.indexOf("frage-art-beilage");
  } else if (lastQuestion === "art") {
    if (gang === "Hauptgericht") currentStepIndex = steps.indexOf("frage-hauptkomponente");
    else currentStepIndex = steps.indexOf("frage-jahreszeit");
  } else if (lastQuestion === "hauptkomponente") currentStepIndex = steps.indexOf("frage-essweise");
  else if (lastQuestion === "essweise") currentStepIndex = steps.indexOf("frage-jahreszeit");
  else if (lastQuestion === "jahreszeit") currentStepIndex = steps.indexOf("frage-zeitaufwand");
  else if (lastQuestion === "zeitaufwand") currentStepIndex = steps.indexOf("frage-schwierigkeit");
  else if (lastQuestion === "schwierigkeit") currentStepIndex = steps.indexOf("frage-ort");
  else if (lastQuestion === "ort") {
    if (gang === "Hauptgericht") currentStepIndex = steps.indexOf("frage-laenderkueche");
    else currentStepIndex = steps.length;
  } else if (lastQuestion === "laenderkueche") currentStepIndex = steps.length;

  if (currentStepIndex >= steps.length) showResult();
  else showStep(steps[currentStepIndex]);
}

// ========================
// Frage anzeigen
// ========================
function showStep(stepId) {
  document.querySelectorAll(".frage-section").forEach(sec => sec.style.display = "none");
  const section = document.getElementById(stepId);
  if (section) section.style.display = "block";
}

// ========================
// Endergebnis berechnen
// ========================
function showResult() {
  quizScreen.style.display = "none";
  resultScreen.style.display = "block";

  let filtered = allRecipes.filter(r => matchesUserSelection(r, userSelections));

  if (filtered.length === 0) {
    const gang = userSelections["gang"];
    filtered = allRecipes.filter(r => {
      const val = r["Gang"];
      return Array.isArray(val) ? val.includes(gang) : val === gang;
    });
  }

  const chosen = filtered[Math.floor(Math.random() * filtered.length)];
  rezeptName.textContent = chosen.Name || "Unbekanntes Rezept";
  rezeptSeite.textContent = chosen.Seite ? "Seite " + chosen.Seite : "(Seite im Buch folgt später)";
}

// ========================
// Hilfsfunktion: Key korrekt großschreiben
// ========================
function capitalizeKey(str) {
  const mapping = {
    "gang": "Gang",
    "art": "Art",
    "hauptkomponente": "Hauptkomponente",
    "essweise": "Essweise",
    "jahreszeit": "Jahreszeit",
    "zeitaufwand": "Zeitaufwand",
    "schwierigkeit": "Schwierigkeitsgrad",
    "ort": "Ort",
    "laenderkueche": "Länderküche"
  };
  return mapping[str] || str;
}

// ========================
// Prüfen, ob Rezept zu bisherigen Antworten passt
// ========================
function matchesUserSelection(recipe, selections) {
  for (let key in selections) {
    const userValue = selections[key];
    if (!userValue || userValue === "Random") continue;

    const recipeValue = recipe[capitalizeKey(key)];
    if (!recipeValue) return false;

    if (Array.isArray(recipeValue)) {
      if (!recipeValue.includes(userValue)) return false;
    } else {
      if (recipeValue !== userValue) return false;
    }
  }
  return true;
}

// ========================
// Zufällige gültige Optionen für „Überrasch mich“
// ========================
function getValidRandomOptions(question) {
  const candidates = new Set();

  allRecipes.forEach(recipe => {
    if (matchesUserSelection(recipe, userSelections)) {
      const val = recipe[capitalizeKey(question)];
      if (Array.isArray(val)) val.forEach(v => candidates.add(v));
      else if (val) candidates.add(val);
    }
  });

  return Array.from(candidates);
}
