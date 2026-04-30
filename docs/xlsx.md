# SheetJS (xlsx) – Documentation Complète

## Introduction

SheetJS (souvent importé sous le nom `XLSX`) est une bibliothèque JavaScript puissante permettant de lire, manipuler et écrire des fichiers tableurs (Excel `.xlsx`, `.xls`, `.csv`, `.ods`, etc.) dans le navigateur ou via Node.js.

---

# 1. Lecture de fichiers (Parsing)

## Fonctions principales

* `XLSX.read(data, options)` : Parse des données brutes (binaire, base64, buffer, etc.).
* `XLSX.readFile(filename, options)` : Parse un fichier local (uniquement sous Node.js).

## Signature (Navigateur)

Généralement utilisé avec un `FileReader` ou une requête réseau :

```js
const workbook = XLSX.read(data, { type: 'array' });
```

## Paramètre `type` (dans les options)

Indique le format des données en entrée :

| Type     | Description                                |
| -------- | ------------------------------------------ |
| `base64` | Chaîne encodée en base64                   |
| `binary` | Chaîne binaire (deprecated)                |
| `string` | Chaîne de caractères (ex: CSV)             |
| `buffer` | Buffer NodeJS                              |
| `array`  | Uint8Array ou ArrayBuffer (recommandé)     |
| `file`   | Chemin du fichier (readFile uniquement)    |

---

# 2. Conversion en JSON

Une fois le `workbook` (classeur) obtenu, il faut extraire les données d'une `worksheet` (feuille).

## Signature

```js
const jsonData = XLSX.utils.sheet_to_json(worksheet, options)
```

## Configuration (`options`)

| Option     | Type               | Description                        |
| ---------- | ------------------ | ---------------------------------- |
| header     | number/string/array| Contrôle les clés du JSON de sortie|
| defval     | any                | Valeur par défaut pour les cases vides |
| blankrows  | boolean            | Inclure les lignes vides (défaut: false) |
| raw        | boolean            | Retourner les valeurs brutes vs formatées (défaut: true) |
| range      | number/string      | Spécifier une plage (ex: "A2:D10" ou un nombre de lignes à sauter) |

## Exemples de `header`

* **`1` (défaut)** : Utilise la première ligne comme clés d'objets.
* **`"A"`** : Utilise les noms de colonnes Excel ("A", "B", "C") comme clés.
* **`["Nom", "Age"]`** : Utilise ce tableau pour nommer les clés.

---

# 3. Écriture de fichiers (Génération)

## Création depuis des données (JSON → Sheet)

```js
const worksheet = XLSX.utils.json_to_sheet(data, options);
```

## Configuration (`options`)

| Option        | Type     | Description                                  |
| ------------- | -------- | -------------------------------------------- |
| header        | string[] | Ordre spécifique des colonnes                |
| skipHeader    | boolean  | Ne pas inclure la ligne d'en-tête (défaut: false)|

---

# 4. Gestion du Classeur (Workbook)

Pour exporter, il faut créer un classeur et y attacher la feuille.

```js
// 1. Créer un classeur vide
const workbook = XLSX.utils.book_new();

// 2. Ajouter la feuille au classeur
XLSX.utils.book_append_sheet(workbook, worksheet, "Nom_De_La_Feuille");
```

---

# 5. Exportation (Téléchargement)

## Fonctions principales

* `XLSX.write(workbook, options)` : Génère les données brutes du fichier.
* `XLSX.writeFile(workbook, filename, options)` : Génère et force le téléchargement du fichier.

## Signature

```js
XLSX.writeFile(workbook, "export_donnees.xlsx");
```

## Configuration (pour `XLSX.write`)

| Option | Type   | Description                                    |
| ------ | ------ | ---------------------------------------------- |
| bookType | string | Type de fichier (`xlsx`, `csv`, `xlsb`, `ods`, etc.) |
| type   | string | Type de retour (`base64`, `binary`, `buffer`, `array`) |

---

# 6. Structure interne importante

## L'objet Workbook

```js
{
  SheetNames: ["Feuille1", "Feuille2"], // Tableau des noms des feuilles
  Sheets: {
    "Feuille1": { ... }, // Objet contenant les données de la feuille
    "Feuille2": { ... }
  }
}
```

---

# Résumé

* **Lecture** : Fichier/Blob → `XLSX.read()` → Workbook → `XLSX.utils.sheet_to_json()` → JSON
* **Écriture** : JSON → `XLSX.utils.json_to_sheet()` → Worksheet → `XLSX.utils.book_new()` + `XLSX.utils.book_append_sheet()` → `XLSX.writeFile()` → Fichier Excel

---

# Conseils

* Pour la lecture de gros fichiers côté client, privilégiez le format `array` (ArrayBuffer) avec `FileReader.readAsArrayBuffer`.
* Si les dates apparaissent comme des nombres, assurez-vous d'utiliser l'option `cellDates: true` dans `XLSX.read()` et potentiellement l'option `raw: false` ou un formatage personnalisé dans `sheet_to_json()`.
* SheetJS gère très bien le CSV, il peut donc remplacer PapaParse si vous avez déjà besoin de manipuler du Excel.
