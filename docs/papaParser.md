# Papa Parse – Documentation Complète

## Introduction

Papa Parse est une bibliothèque JavaScript permettant de lire et écrire des fichiers CSV efficacement, y compris pour de gros volumes de données.

---

# 1. Fonction principale : Papa.parse

## Signature

```js
Papa.parse(input, config)
```

## Paramètre `input`

Peut être :

* File (provenant d’un input HTML)
* string (contenu CSV brut)
* URL (si `download: true` est activé)

---

## Configuration (`config`)

### Structure des données

| Option         | Type               | Description                        |
| -------------- | ------------------ | ---------------------------------- |
| header         | boolean            | Convertit chaque ligne en objet    |
| skipEmptyLines | boolean | 'greedy' | Ignore les lignes vides            |
| delimiter      | string             | Délimiteur (`,` `;` `\t`)          |
| newline        | string             | Force le type de retour à la ligne |
| quoteChar      | string             | Caractère de guillemet             |
| escapeChar     | string             | Caractère d’échappement            |
| columns        | string[]           | Noms de colonnes personnalisés     |

---

### Transformation des données

| Option          | Type             | Description                      |
| --------------- | ---------------- | -------------------------------- |
| transform       | function         | Modifie chaque valeur            |
| transformHeader | function         | Modifie les noms de colonnes     |
| dynamicTyping   | boolean | object | Conversion automatique des types |

Exemple :

```js
dynamicTyping: true
```

---

### Streaming (gros fichiers)

| Option | Type     | Description           |
| ------ | -------- | --------------------- |
| step   | function | Appelé à chaque ligne |
| chunk  | function | Appelé par bloc       |
| worker | boolean  | Utilise un Web Worker |

Exemple :

```js
step: (result) => {
  console.log(result.data);
}
```

---

### Résultat final

| Option   | Type     | Description         |
| -------- | -------- | ------------------- |
| complete | function | Appelé à la fin     |
| error    | function | Gestion des erreurs |

---

### Réseau

| Option                 | Type    | Description          |
| ---------------------- | ------- | -------------------- |
| download               | boolean | Parse depuis une URL |
| withCredentials        | boolean | Inclut les cookies   |
| downloadRequestHeaders | object  | Headers HTTP         |

---

### Performance

| Option   | Type    | Description                |
| -------- | ------- | -------------------------- |
| fastMode | boolean | Mode rapide (moins fiable) |
| preview  | number  | Limite le nombre de lignes |

---

### Autres options

| Option          | Type   | Description                                   |
| --------------- | ------ | --------------------------------------------- |
| comments        | string | Ignore les lignes commençant par ce caractère |
| encoding        | string | Encodage (ex: UTF-8)                          |
| skipFirstNLines | number | Ignore les premières lignes                   |

---

## Résultat retourné

```js
{
  data: [...],
  errors: [...],
  meta: {
    delimiter,
    linebreak,
    fields
  }
}
```

---

# 2. Fonction Papa.unparse (JSON → CSV)

## Signature

```js
Papa.unparse(data, config)
```

## Paramètre `data`

* Tableau d’objets
* Tableau de tableaux

---

## Configuration

| Option    | Description            |
| --------- | ---------------------- |
| delimiter | Délimiteur             |
| quotes    | Force les guillemets   |
| quoteChar | Caractère de guillemet |
| header    | Inclure les en-têtes   |
| columns   | Ordre des colonnes     |

---

## Exemple

```js
const csv = Papa.unparse([
  { name: "John", age: 30 }
]);
```

---

# 3. Contrôle du parsing

Disponible dans `step` ou `chunk` :

```js
step: (results, parser) => {
  parser.pause();
  parser.resume();
  parser.abort();
}
```

---

# 4. Streaming manuel

```js
const parser = Papa.parse(file, {
  step: ...
});
```

---

# 5. Détection automatique

```js
Papa.parse(csv, {
  delimiter: ""
});
```

---

# Points importants

### dynamicTyping par colonne

```js
dynamicTyping: {
  age: true
}
```

### skipEmptyLines avancé

```js
skipEmptyLines: 'greedy'
```

### fastMode

* Très rapide
* Moins fiable avec CSV complexes

---

# Résumé

* Papa.parse() → CSV → JSON
* Papa.unparse() → JSON → CSV
* La puissance repose sur la configuration

---

# Conseils

* Utiliser `worker: true` pour les gros fichiers
* Utiliser `step` pour éviter de charger tout en mémoire
* Éviter `fastMode` si le CSV est complexe
