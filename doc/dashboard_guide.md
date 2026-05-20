# Guide des Syntaxes React & Tailwind pour Tableaux de Bord Premium

Ce guide répertorie des modèles de code prêts à l'emploi (HTML, Tailwind CSS et logique React) pour concevoir des boutons premium, calculer un chiffre d'affaires, filtrer des tableaux et intégrer des fonctionnalités avancées dans votre application d'évaluation.

---

## 1. Catalogue de Boutons Premium et Modernes

Boutons avec états de survol, micro-animations, ombres subtiles et structures adaptatives.

### A. Bouton d'Action Primaire (Style Moderne avec Gradient & Animation)
Idéal pour enregistrer, ajouter, valider.
```jsx
<button 
  onClick={handleSave}
  className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
  Confirmer et Valider
</button>
```

### B. Bouton d'Action Secondaire (Style Minimaliste)
Idéal pour annuler, fermer, ou retourner en arrière.
```jsx
<button 
  onClick={handleCancel}
  className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs px-5 py-3 rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
  Annuler
</button>
```

### C. Bouton d'Action Danger / Destructive (Zone Critique)
Idéal pour réinitialiser les données, vider le panier, ou purger la base de données.
```jsx
<button 
  onClick={handleReset}
  className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl transition-all duration-300 active:scale-95 shadow-sm flex items-center justify-center gap-2 cursor-pointer group"
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 transform group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
  Réinitialiser les données
</button>
```

### D. Bouton Compact avec Badge de Compteur
Idéal pour les paniers, notifications, ou wishlist.
```jsx
<button 
  className="relative bg-white hover:bg-gray-50 border border-gray-100 p-3 rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center text-gray-600 hover:text-blue-600 cursor-pointer"
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
  <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
    3
  </span>
</button>
```

---

## 2. Calcul et Affichage du Chiffre d'Affaires (CA)

Pour un tableau de bord d'administration ou de statistiques de vente, voici comment calculer la somme des commandes et l'afficher de manière premium.

### Code Javascript / React (Logique)
```javascript
import { useMemo } from "react";

// Exemple de données de commandes issues de Bagisto
const orders = [
  { id: 1, status: "completed", grand_total: "1200.00" },
  { id: 2, status: "processing", grand_total: "450.50" },
  { id: 3, status: "canceled", grand_total: "600.00" },
  { id: 4, status: "completed", grand_total: "350.00" }
];

// Calcul ultra-optimisé avec useMemo
const stats = useMemo(() => {
  // Filtrer uniquement les commandes non annulées pour le CA réel
  const activeOrders = orders.filter(o => o.status !== "canceled" && o.status !== "cancelled");
  
  const totalRevenue = activeOrders.reduce((acc, order) => {
    return acc + parseFloat(order.grand_total || 0);
  }, 0);

  return {
    totalRevenue,
    orderCount: orders.length,
    activeOrderCount: activeOrders.length,
    canceledCount: orders.length - activeOrders.length
  };
}, [orders]);
```

### Rendu Visuel (Aesthetics Premium avec Glassmorphism)
```jsx
<div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-[2.5rem] p-8 text-white border border-blue-950/50 shadow-2xl relative overflow-hidden group">
  {/* Cercle lumineux décoratif en arrière-plan */}
  <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>

  <div className="flex justify-between items-start mb-6">
    <div>
      <span className="text-blue-300 font-black text-xs uppercase tracking-widest">Performances</span>
      <h3 className="text-3xl font-black mt-1">Chiffre d'Affaires</h3>
    </div>
    <div className="bg-white/10 backdrop-blur-md p-3 rounded-2.5xl border border-white/10">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  </div>

  {/* Chiffre d'affaires principal */}
  <div className="flex items-baseline gap-2 mb-4">
    <span className="text-5xl font-black tracking-tight">{stats.totalRevenue.toFixed(2)}</span>
    <span className="text-2xl font-black text-blue-300">€</span>
  </div>

  {/* Indicateurs secondaires avec barre de progression */}
  <div className="space-y-4">
    <div className="flex justify-between text-xs font-semibold text-blue-200">
      <span>Objectif mensuel (Exemple: 5 000 €)</span>
      <span>{((stats.totalRevenue / 5000) * 100).toFixed(1)}%</span>
    </div>
    
    <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
      <div 
        className="bg-gradient-to-r from-blue-400 to-indigo-400 h-full rounded-full transition-all duration-1000"
        style={{ width: `${Math.min((stats.totalRevenue / 5000) * 100, 100)}%` }}
      ></div>
    </div>

    <div className="flex gap-4 pt-2 text-xs">
      <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-blue-200">
        📦 <b>{stats.activeOrderCount}</b> commandes validées
      </span>
      {stats.canceledCount > 0 && (
        <span className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl text-red-200">
          ❌ <b>{stats.canceledCount}</b> annulées
        </span>
      )}
    </div>
  </div>
</div>
```

---

## 3. Système de Filtres Réactifs Multicritères

Modèle complet pour filtrer instantanément un tableau de bord (par recherche de texte, sélection de statut ou fourchette de prix).

### États React & Logique de Filtrage
```javascript
import { useState, useMemo } from "react";

function ProductDashboard() {
  // Liste originale de produits (Exemple)
  const products = [
    { id: 1, name: "iPhone 15 Pro", sku: "iph-15-pro", category: "Telephone", price: 1200.00 },
    { id: 2, name: "MacBook Air M3", sku: "mac-air-m3", category: "Ordinateur", price: 1500.00 },
    { id: 3, name: "AirPods Pro", sku: "airp-pro", category: "Audio", price: 279.00 }
  ];

  // États pour les critères de filtres
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");

  // Logique de filtrage réactive combinée
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Recherche par nom ou SKU
      const matchesSearch = 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());

      // 2. Filtre par catégorie
      const matchesCategory = 
        categoryFilter === "all" || 
        p.category.toLowerCase() === categoryFilter.toLowerCase();

      // 3. Filtre par prix maximum
      const matchesPrice = 
        !maxPrice || 
        parseFloat(p.price) <= parseFloat(maxPrice);

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [search, categoryFilter, maxPrice]);

  const handleResetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setMaxPrice("");
  };
}
```

### Interface Utilisateur Réactive (Formulaires Premium)
```jsx
<div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8">
  <div className="flex justify-between items-center mb-6">
    <h3 className="text-lg font-black text-gray-900">Filtres et Recherche</h3>
    <button 
      onClick={handleResetFilters}
      className="text-xs font-black text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
    >
      Effacer les filtres
    </button>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
    {/* 1. Barre de recherche textuelle */}
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Rechercher</label>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nom ou SKU..."
          className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white text-gray-800 text-sm px-4 py-3 rounded-2xl outline-none transition-all pl-10"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    {/* 2. Menu déroulant Catégorie */}
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Catégorie</label>
      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white text-gray-800 text-sm px-4 py-3 rounded-2xl outline-none transition-all appearance-none cursor-pointer"
      >
        <option value="all">Toutes les catégories</option>
        <option value="Telephone">Téléphone</option>
        <option value="Ordinateur">Ordinateur</option>
        <option value="Audio">Audio</option>
      </select>
    </div>

    {/* 3. Limite de Prix */}
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Prix Maximum (€)</label>
      <input
        type="number"
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
        placeholder="Exemple: 1000"
        className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white text-gray-800 text-sm px-4 py-3 rounded-2xl outline-none transition-all"
      />
    </div>
  </div>

  {/* Statut du filtrage en bas */}
  <div className="mt-6 pt-4 border-t border-gray-50 text-xs font-semibold text-gray-400 flex items-center justify-between">
    <span><b>{filteredProducts.length}</b> produit(s) correspondant(s)</span>
    {filteredProducts.length === 0 && (
      <span className="text-red-500 font-bold uppercase animate-pulse">Aucun résultat trouvé !</span>
    )}
  </div>
</div>
```

---

## 4. Exportation et Actions de Données Avancées

Ces boutons fournissent des interactions courantes pour l'exploitation de données.

### A. Exportation de Données en Format CSV (Sans librairie externe)
```javascript
const handleExportCSV = (dataToExport) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Aucune donnée disponible pour l'export.");
    return;
  }

  // Définir les en-têtes
  const headers = ["ID", "Nom", "SKU", "Catégorie", "Prix (€)"];
  
  // Convertir les objets en lignes CSV
  const csvRows = [
    headers.join(";"), // en-tête séparé par point-virgule
    ...dataToExport.map(p => `${p.id};"${p.name.replace(/"/g, '""')}";${p.sku};${p.category};${p.price}`)
  ];

  // Création du blob avec encodage UTF-8 (avec BOM pour Microsoft Excel)
  const csvContent = "\uFEFF" + csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  
  // Téléchargement du fichier
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `export_produits_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```
```jsx
{/* Bouton d'exportation associé */}
<button 
  onClick={() => handleExportCSV(filteredProducts)}
  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 text-emerald-700 font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
  Exporter CSV (Excel)
</button>
```

### B. Impression Directe ou Exportation PDF de la page
Bouton natif qui déclenche l'aperçu avant impression du navigateur. Vous pouvez masquer des éléments indésirables en CSS à l'aide de la classe Tailwind `print:hidden`.
```jsx
<button 
  onClick={() => window.print()}
  className="bg-purple-50 hover:bg-purple-100 border border-purple-150 text-purple-700 font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer print:hidden"
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2zm5-17v2m-3-2v2m6-2v2" />
  </svg>
  Imprimer / Exporter PDF
</button>
```

---

## 5. Tri Dynamique des Données

Ajouter un système de tri par colonnes avec indicateurs visuels (flèches montantes/descendantes) qui s'activent au clic.

### Logique React (Tri)
```javascript
const [sortConfig, setSortConfig] = useState({ key: "id", direction: "ascending" });

const requestSort = (key) => {
  let direction = "ascending";
  if (sortConfig.key === key && sortConfig.direction === "ascending") {
    direction = "descending";
  }
  setSortConfig({ key, direction });
};

// Intégrer le tri dans votre filtre useMemo
const sortedProducts = useMemo(() => {
  let sortableItems = [...filteredProducts]; // filteredProducts vient de l'étape 3
  
  sortableItems.sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    
    // Conversion numérique si applicable
    if (!isNaN(Number(aVal)) && !isNaN(Number(bVal))) {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }

    if (aVal < bVal) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (aVal > bVal) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });
  
  return sortableItems;
}, [filteredProducts, sortConfig]);
```

### Rendu d'En-tête de Table Cliquable (Tailwind CSS)
```jsx
<th 
  onClick={() => requestSort("price")}
  className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-blue-600 transition-colors group"
>
  <div className="flex items-center gap-1.5">
    Prix
    <span className="flex flex-col text-[8px] text-gray-300 group-hover:text-blue-400 transition-colors">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-2.5 w-2.5 ${sortConfig.key === "price" && sortConfig.direction === "ascending" ? "text-blue-600 font-bold scale-110" : ""}`} 
        viewBox="0 0 20 20" fill="currentColor"
      >
        <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
      </svg>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-2.5 w-2.5 -mt-1 ${sortConfig.key === "price" && sortConfig.direction === "descending" ? "text-blue-600 font-bold scale-110" : ""}`} 
        viewBox="0 0 20 20" fill="currentColor"
      >
        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
      </svg>
    </span>
  </div>
</th>
```

---

## 6. Composant de Pagination Réactive et Design

Pour découper de longues listes de produits ou de commandes sans surcharger l'interface.

### Logique React (Pagination)
```javascript
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 8;

const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

// Obtenir uniquement les éléments de la page active
const currentItems = useMemo(() => {
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  return sortedProducts.slice(indexOfFirstItem, indexOfLastItem);
}, [sortedProducts, currentPage]);
```

### Rendu de la Pagination Premium
```jsx
<div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-100">
  <span className="text-xs font-semibold text-gray-400">
    Page <b>{currentPage}</b> sur <b>{totalPages || 1}</b>
  </span>

  <div className="flex items-center gap-1.5">
    {/* Bouton Précédent */}
    <button
      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
      disabled={currentPage === 1}
      className="bg-white disabled:opacity-40 disabled:hover:bg-white disabled:pointer-events-none hover:bg-gray-50 border border-gray-200 text-gray-600 p-2.5 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    {/* Pages numérotées intelligentes */}
    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNumber) => (
      <button
        key={pageNumber}
        onClick={() => setCurrentPage(pageNumber)}
        className={`w-9 h-9 rounded-xl font-black text-xs transition-all cursor-pointer ${
          currentPage === pageNumber
            ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
            : "bg-white hover:bg-gray-50 border border-gray-200 text-gray-600"
        }`}
      >
        {pageNumber}
      </button>
    ))}

    {/* Bouton Suivant */}
    <button
      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
      disabled={currentPage === totalPages || totalPages === 0}
      className="bg-white disabled:opacity-40 disabled:hover:bg-white disabled:pointer-events-none hover:bg-gray-50 border border-gray-200 text-gray-600 p-2.5 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</div>
```

---

## 7. Modale de Confirmation Premium (Glassmorphism & Overlay)

Idéal pour sécuriser les suppressions ou les actions irréversibles.

### Structure React et Animation
```jsx
{isOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Fond flouté interactif */}
    <div 
      className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-all"
      onClick={() => setIsOpen(false)}
    ></div>

    {/* Fenêtre Modale */}
    <div className="bg-white rounded-[2.5rem] border border-gray-150 p-8 shadow-2xl max-w-md w-full relative z-10 animate-[scaleUp_0.3s_ease-out]">
      <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 border border-red-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <h3 className="text-xl font-black text-gray-900 mb-2">Confirmation requise</h3>
      <p className="text-gray-500 text-sm font-semibold mb-6">
        Êtes-vous sûr de vouloir supprimer définitivement cet élément ? Cette action est irréversible.
      </p>

      <div className="flex gap-3.5">
        <button
          onClick={() => setIsOpen(false)}
          className="flex-grow bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-3 rounded-2xl transition-all cursor-pointer text-center text-xs active:scale-95"
        >
          Annuler
        </button>
        <button
          onClick={() => {
            handleDelete();
            setIsOpen(false);
          }}
          className="flex-grow bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-2xl transition-all cursor-pointer text-center text-xs uppercase tracking-wider shadow-md hover:shadow-red-200 active:scale-95"
        >
          Supprimer
        </button>
      </div>
    </div>
  </div>
)}
```

---

## 8. Système de Toast Notifications Éphémères

Permet d'informer l'utilisateur d'un succès (ex: "Produit ajouté au panier") sans bloquer sa navigation.

### Logique React (Toast Hook local)
```javascript
const [toast, setToast] = useState(null); // structure: { type: 'success'|'error', message: string }

const showToast = (message, type = "success") => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000); // disparait après 3s
};
```

### Rendu UI avec Animation Premium
```jsx
{toast && (
  <div className="fixed bottom-6 right-6 z-50 animate-[slideIn_0.3s_ease-out]">
    <div className={`p-4 rounded-2.5xl shadow-xl border flex items-center gap-3 backdrop-blur-md max-w-sm ${
      toast.type === "success" 
        ? "bg-emerald-50/90 border-emerald-100 text-emerald-800" 
        : "bg-red-50/90 border-red-100 text-red-800"
    }`}>
      {toast.type === "success" ? (
        <span className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-sm">✓</span>
      ) : (
        <span className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-sm">!</span>
      )}
      <p className="text-xs font-black tracking-wide pr-2">{toast.message}</p>
      
      {/* Bouton fermeture manuelle */}
      <button 
        onClick={() => setToast(null)}
        className="ml-auto text-gray-400 hover:text-gray-600 transition-colors text-xs cursor-pointer"
      >
        ✕
      </button>
    </div>
  </div>
)}
```

---

## 9. Squelettes de Chargement Interactifs (Skeleton Shimmer)

Idéal pour occuper l'attention de l'utilisateur de manière ultra-premium pendant la récupération réseau, plutôt qu'un spinner de chargement basique.

```jsx
{/* Exemple de Squelette de Carte Produit en cours de chargement */}
<div className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm overflow-hidden flex flex-col gap-4 animate-pulse">
  {/* Zone Image */}
  <div className="h-44 bg-gray-100 rounded-2xl relative overflow-hidden">
    {/* L'effet Shimmer de balayage brillant */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
  </div>

  {/* Ligne Titre */}
  <div className="w-3/4 h-5 bg-gray-100 rounded-lg relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
  </div>

  {/* Ligne SKU / Code */}
  <div className="w-1/2 h-3.5 bg-gray-100 rounded-lg relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
  </div>

  {/* Zone footer (Prix + Bouton) */}
  <div className="mt-4 flex justify-between items-center gap-4">
    <div className="w-20 h-6 bg-gray-100 rounded-lg relative overflow-hidden"></div>
    <div className="w-24 h-10 bg-gray-100 rounded-xl relative overflow-hidden"></div>
  </div>
</div>
```

---

## 10. Styles CSS / Tailwind recommandés pour les Animations du Guide

Pour profiter pleinement des micro-animations ci-dessus, assurez-vous d'incorporer ces configurations ou classes CSS globales dans votre fichier `index.css` ou de configuration :

```css
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@keyframes slideIn {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes scaleUp {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

---

## 11. Sélecteur de Mode Sombre Premium (Dark Mode Toggle)

Bouton interactif avec une bulle glissante, des icônes réactives et un branchement automatique sur la classe `.dark` de la balise HTML pour l'intégration de Tailwind Dark Mode.

```jsx
import { useEffect, useState } from "react";

export function DarkModeToggle() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-1.5 rounded-full w-16 h-8 cursor-pointer transition-all duration-300 shadow-inner group border border-gray-200 dark:border-gray-700"
      aria-label="Changer de thème"
    >
      {/* Icône Soleil */}
      <span className="z-10 flex items-center justify-center w-5 h-5 text-amber-500 transition-transform duration-300 transform group-hover:scale-110">
        ☀️
      </span>
      {/* Icône Lune */}
      <span className="z-10 flex items-center justify-center w-5 h-5 text-indigo-400 transition-transform duration-300 transform group-hover:scale-110">
        🌙
      </span>
      {/* Bulle glissante physique */}
      <span
        className={`absolute bg-white dark:bg-gray-900 w-6.5 h-6.5 rounded-full shadow-md transition-transform duration-300 ease-out border border-gray-150 dark:border-gray-800 ${
          theme === "dark" ? "translate-x-7.5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
```

---

## 12. Composant Graphique Minimaliste (Pure SVG & CSS Sales Bar Chart)

Un graphique à colonnes entièrement responsive sans aucune dépendance NPM externe. Il intègre des barres dynamiques, des indicateurs de progression, des infobulles de survol et des gradients HSL.

```jsx
import { useMemo } from "react";

export function PremiumSalesBarChart({ data = [240, 360, 180, 520, 410, 600, 480] }) {
  const maxValue = useMemo(() => Math.max(...data, 100), [data]);
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-[2rem] shadow-sm flex flex-col gap-6 w-full max-w-lg">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Activité</span>
          <h3 className="text-xl font-black text-gray-900 dark:text-white">Ventes Hebdomadaires</h3>
        </div>
        <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-black text-xs px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-1">
          ↑ +14.2%
        </span>
      </div>

      {/* Barres Graphiques */}
      <div className="flex items-end justify-between h-48 pt-4 gap-3">
        {data.map((value, idx) => {
          const percentage = (value / maxValue) * 100;
          return (
            <div key={idx} className="flex flex-col items-center flex-grow group gap-2 relative">
              {/* Infobulle de survol (Tooltip) */}
              <div className="absolute -top-8 scale-0 group-hover:scale-100 transition-all bg-gray-900 text-white text-[10px] font-black px-2 py-1.5 rounded-xl shadow-lg pointer-events-none z-10 whitespace-nowrap">
                {value} €
              </div>
              
              {/* Fût de la barre de statistiques */}
              <div className="w-full bg-gray-50 dark:bg-gray-800/40 rounded-t-2xl h-full flex items-end overflow-hidden">
                <div 
                  style={{ height: `${percentage}%` }}
                  className="w-full bg-gradient-to-t from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-t-2xl transition-all duration-700 ease-out origin-bottom transform group-hover:scale-y-102"
                />
              </div>

              {/* Libellé des jours */}
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {days[idx]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 13. Navigation par Onglets Premium (Premium Sliding Tabs Component)

Ce composant crée un système de filtres ou d'onglets dont la bulle d'arrière-plan glisse de manière ultra-fluide avec une transition CSS lorsque l'utilisateur sélectionne un onglet.

```jsx
import { useState, useRef, useEffect } from "react";

export function SlidingTabs() {
  const tabs = [
    { id: "all", label: "Tous les Produits" },
    { id: "instock", label: "En Stock" },
    { id: "outofstock", label: "Rupture de Stock" }
  ];
  const [activeTab, setActiveTab] = useState("all");
  const [style, setStyle] = useState({});
  const tabRefs = useRef({});

  useEffect(() => {
    const activeElement = tabRefs.current[activeTab];
    if (activeElement) {
      setStyle({
        width: activeElement.offsetWidth,
        left: activeElement.offsetLeft
      });
    }
  }, [activeTab]);

  return (
    <div className="relative bg-gray-50 dark:bg-gray-850 p-1.5 rounded-2xl flex border border-gray-100 dark:border-gray-800 w-fit">
      {/* Glisseur actif fluide en arrière-plan */}
      <span
        style={style}
        className="absolute top-1.5 bottom-1.5 bg-white dark:bg-gray-900 rounded-xl shadow-sm transition-all duration-300 ease-out"
      />
      
      {/* Boutons d'onglets */}
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => (tabRefs.current[tab.id] = el)}
          onClick={() => setActiveTab(tab.id)}
          className={`relative z-10 px-5 py-2.5 rounded-xl text-xs font-black tracking-wide cursor-pointer transition-colors duration-200 ${
            activeTab === tab.id
              ? "text-blue-600 dark:text-blue-450"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

---

## 14. Gestion de Catalogue Admin (Liste des Produits & Bouton Supprimer Dynamique)

Modèle complet de tableau réactif pour lister les produits du catalogue dans l'espace d'administration. Il comprend des en-têtes design, des libellés de stocks sensibles aux seuils d'alerte, un badge de catégorie, et un **bouton Supprimer** asynchrone avec un spinner de chargement (loading state) et une alerte de notification (Toast).

```jsx
import { useState } from "react";

export function AdminProductTable() {
  // Liste locale réactive pour gestion de l'affichage en temps réel
  const [products, setProducts] = useState([
    { id: 1, name: "iPhone 15 Pro", sku: "iph-15-pro", price: 1200.00, stock: 45, category: "Téléphone" },
    { id: 2, name: "MacBook Air M3", sku: "mac-air-m3", price: 1500.00, stock: 12, category: "Ordinateur" },
    { id: 3, name: "AirPods Pro", sku: "airp-pro", price: 279.00, stock: 85, category: "Audio" }
  ]);

  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Fonction de suppression asynchrone avec retour d'état visuel (Loading + Toast)
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce produit définitivement ?")) return;

    setDeletingId(productId);
    try {
      // Simulation d'une requête DELETE vers l'API d'administration
      // const response = await fetch(`/api/v1/admin/catalog/products/${productId}`, { method: 'DELETE' });
      await new Promise(resolve => setTimeout(resolve, 1000)); // simulation latence de suppression

      // Filtrage du produit supprimé pour mise à jour réactive
      setProducts(prev => prev.filter(p => p.id !== productId));
      
      setToast({ message: "Produit supprimé avec succès !", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast({ message: "Échec de la suppression.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm relative overflow-hidden">
      
      {/* Toast Alert intégrée pour la suppression */}
      {toast && (
        <div className="absolute top-6 right-6 z-50 animate-[slideIn_0.2s_ease-out]">
          <div className={`px-4 py-3 rounded-2xl shadow-lg border text-xs font-black flex items-center gap-2 ${
            toast.type === "success" 
              ? "bg-emerald-50 dark:bg-emerald-950/90 border-emerald-100 dark:border-emerald-900/50 text-emerald-850 dark:text-emerald-300" 
              : "bg-red-50 dark:bg-red-955/90 border-red-100 dark:border-red-900/50 text-red-850 dark:text-red-300"
          }`}>
            <span className="w-4 h-4 rounded-full bg-current flex items-center justify-center text-white text-[9px] font-bold">
              {toast.type === "success" ? "✓" : "!"}
            </span>
            {toast.message}
          </div>
        </div>
      )}

      {/* En-tête de la table */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Administration</span>
          <h3 className="text-xl font-black text-gray-900 dark:text-white">Gestion du Catalogue</h3>
        </div>
        <span className="bg-gray-50 dark:bg-gray-800 px-3.5 py-1.5 rounded-xl text-xs font-black text-gray-500 dark:text-gray-400">
          📦 <b>{products.length}</b> Produits actifs
        </span>
      </div>

      {/* Container de table responsive */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-50 dark:border-gray-800">
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Produit</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">SKU / Code</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Catégorie</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Prix</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40">
            {products.map((product) => (
              <tr 
                key={product.id} 
                className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
              >
                {/* 1. Nom & Image du produit */}
                <td className="px-6 py-4.5 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-450 border border-gray-100 dark:border-gray-700">
                      📦
                    </div>
                    <span className="text-sm font-black text-gray-850 dark:text-gray-150">{product.name}</span>
                  </div>
                </td>

                {/* 2. SKU */}
                <td className="px-6 py-4.5 whitespace-nowrap text-xs font-semibold text-gray-400 tracking-wider">
                  {product.sku}
                </td>

                {/* 3. Catégorie */}
                <td className="px-6 py-4.5 whitespace-nowrap">
                  <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border border-blue-100/50 dark:border-blue-900/30">
                    {product.category}
                  </span>
                </td>

                {/* 4. Stock sensible au seuil d'alerte (<= 15) */}
                <td className="px-6 py-4.5 whitespace-nowrap">
                  <span className={`text-xs font-black ${product.stock <= 15 ? 'text-amber-600 dark:text-amber-450' : 'text-gray-650 dark:text-gray-400'}`}>
                    {product.stock} unités
                  </span>
                </td>

                {/* 5. Prix */}
                <td className="px-6 py-4.5 whitespace-nowrap text-sm font-black text-gray-800 dark:text-gray-150">
                  {product.price.toFixed(2)} €
                </td>

                {/* 6. Bouton Supprimer */}
                <td className="px-6 py-4.5 whitespace-nowrap text-right">
                  <button
                    type="button"
                    disabled={deletingId === product.id}
                    onClick={() => handleDeleteProduct(product.id)}
                    className="bg-red-50 hover:bg-red-150 dark:bg-red-955/40 hover:dark:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 hover:border-red-200 disabled:opacity-50 p-2.5 rounded-xl transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center"
                    title="Supprimer définitivement"
                  >
                    {deletingId === product.id ? (
                      <svg className="animate-spin h-4 w-4 text-red-600 dark:text-red-450" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 15. Visualisation des Produits Importés (Logs d'Importation & Analyse Réactive)

Ce composant est conçu spécifiquement pour lister les produits après un processus d'import (CSV, JSON). Il intègre des compteurs de statut (KPI), un filtre réactif par état (Succès, Avertissement, Erreurs), et des cartes de logs interactives indiquant la ligne du fichier et le diagnostic précis pour chaque produit.

```jsx
import { useState, useMemo } from "react";

export function ImportReportDashboard() {
  // Données de simulation issues d'un import de catalogue
  const [importLogs, setImportLogs] = useState([
    { row: 2, sku: "iph-15-pro", name: "iPhone 15 Pro", status: "success", message: "Nouveau produit créé et associé à la catégorie 'Téléphone'." },
    { row: 3, sku: "mac-air-m3", name: "MacBook Air M3", status: "success", message: "Produit existant détecté. Stock mis à jour (+12)." },
    { row: 4, sku: "airp-pro", name: "AirPods Pro", status: "warning", message: "Prix invalide ou manquant. Remplacé par le tarif standard de 279 €." },
    { row: 5, sku: "invalid-sku", name: "Écran Externe 4K", status: "error", message: "Code SKU vide ou mal formé. Ligne rejetée." },
    { row: 6, sku: "iph-15-pro", name: "iPhone 15 Pro", status: "error", message: "Conflit d'unicité : ce SKU existe déjà en base de données." }
  ]);

  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'success' | 'warning' | 'error'

  // Statistiques calculées par type
  const stats = useMemo(() => {
    return {
      total: importLogs.length,
      success: importLogs.filter(l => l.status === "success").length,
      warning: importLogs.filter(l => l.status === "warning").length,
      error: importLogs.filter(l => l.status === "error").length,
    };
  }, [importLogs]);

  // Filtrage réactif des logs par statut choisi
  const filteredLogs = useMemo(() => {
    if (statusFilter === "all") return importLogs;
    return importLogs.filter(l => l.status === statusFilter);
  }, [importLogs, statusFilter]);

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
      
      {/* En-tête du Rapport */}
      <div className="flex justify-between items-start mb-8 gap-4 flex-col sm:flex-row">
        <div>
          <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Rapport de données</span>
          <h3 className="text-xl font-black text-gray-900 dark:text-white">Analyse des Produits Importés</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-850 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs font-black">
          <span className="px-3 py-1.5 text-gray-500">Fichier traité : <b className="text-blue-600">catalogue_produits.csv</b></span>
        </div>
      </div>

      {/* Cartes KPI de Synthèse et Boutons de Filtres Raccourcis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        
        {/* KPI: Total */}
        <button 
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "all" 
              ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-500" 
              : "bg-gray-50 dark:bg-gray-850 border-gray-100 dark:border-gray-800 hover:border-blue-200"
          }`}
        >
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Lignes Traitées</span>
          <div className="text-2xl font-black text-gray-800 dark:text-gray-150 mt-1">{stats.total}</div>
        </button>

        {/* KPI: Succès */}
        <button 
          type="button"
          onClick={() => setStatusFilter("success")}
          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "success" 
              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500" 
              : "bg-gray-50 dark:bg-gray-850 border-gray-100 dark:border-gray-800 hover:border-emerald-200"
          }`}
        >
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-wider">Réussis ✓</span>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{stats.success}</div>
        </button>

        {/* KPI: Avertissements */}
        <button 
          type="button"
          onClick={() => setStatusFilter("warning")}
          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "warning" 
              ? "bg-amber-50/50 dark:bg-amber-955/20 border-amber-500" 
              : "bg-gray-50 dark:bg-gray-850 border-gray-100 dark:border-gray-800 hover:border-amber-200"
          }`}
        >
          <span className="text-[10px] font-black text-amber-600 dark:text-amber-450 uppercase tracking-wider">Alerte !</span>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">{stats.warning}</div>
        </button>

        {/* KPI: Erreurs */}
        <button 
          type="button"
          onClick={() => setStatusFilter("error")}
          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "error" 
              ? "bg-red-50/50 dark:bg-red-955/20 border-red-500" 
              : "bg-gray-50 dark:bg-gray-850 border-gray-100 dark:border-gray-800 hover:border-red-200"
          }`}
        >
          <span className="text-[10px] font-black text-red-600 dark:text-red-450 uppercase tracking-wider">Erreurs ✗</span>
          <div className="text-2xl font-black text-red-700 dark:text-red-400 mt-1">{stats.error}</div>
        </button>

      </div>

      {/* Entête Logs */}
      <div className="flex justify-between items-center mb-5">
        <h4 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">Logs et diagnostics du fichier</h4>
        {statusFilter !== "all" && (
          <button 
            type="button"
            onClick={() => setStatusFilter("all")}
            className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase"
          >
            Afficher tout le rapport
          </button>
        )}
      </div>

      {/* Liste des logs d'importation */}
      <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-2">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-semibold text-gray-400">
            Aucun log trouvé pour cette catégorie de filtre.
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-3.5 items-start md:items-center transition-all ${
                log.status === "success" 
                  ? "bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-100/50 dark:border-emerald-900/20" 
                  : log.status === "warning" 
                  ? "bg-amber-50/20 dark:bg-amber-955/5 border-amber-100/50 dark:border-amber-900/20" 
                  : "bg-red-50/20 dark:bg-red-955/5 border-red-100/50 dark:border-red-900/20"
              }`}
            >
              {/* Ligne n° */}
              <span className="text-[10px] font-black text-gray-450 uppercase tracking-widest min-w-[60px]">
                Ligne {log.row}
              </span>

              {/* Status Badge */}
              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${
                log.status === "success" 
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950 dark:text-emerald-450 dark:border-emerald-900" 
                  : log.status === "warning" 
                  ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950 dark:text-amber-450 dark:border-amber-900" 
                  : "bg-red-50 text-red-600 border-red-100 dark:bg-red-955 dark:text-red-450 dark:border-red-900"
              }`}>
                {log.status === "success" ? "Réussi" : log.status === "warning" ? "Alerte" : "Erreur"}
              </span>

              {/* SKU & Produit */}
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-800 dark:text-gray-250">
                  {log.name || "Produit Inconnu"}
                </span>
                <span className="text-[9px] font-bold text-gray-400 tracking-wider">
                  SKU: {log.sku || "Aucun"}
                </span>
              </div>

              {/* Description message */}
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 md:ml-auto pr-2">
                {log.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## 16. Sélecteur de Disposition (Grid vs List View Switcher)

Un sélecteur esthétique à micro-animation pour changer la disposition de l'affichage des produits ou des catégories entre une grille et une liste.

```jsx
import { useState } from "react";

export function ViewSwitcher() {
  const [view, setView] = useState("grid"); // 'grid' ou 'list'

  return (
    <div className="bg-gray-50 dark:bg-gray-850 p-1 rounded-xl flex border border-gray-100 dark:border-gray-850 gap-0.5 w-fit">
      {/* Bouton Grille */}
      <button
        onClick={() => setView("grid")}
        className={`p-2 rounded-lg transition-all cursor-pointer border-none bg-transparent ${
          view === "grid"
            ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm"
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        }`}
        title="Afficher en Grille"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>

      {/* Bouton Liste */}
      <button
        onClick={() => setView("list")}
        className={`p-2 rounded-lg transition-all cursor-pointer border-none bg-transparent ${
          view === "list"
            ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm"
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        }`}
        title="Afficher en Liste"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}
```

---

## 17. Prévisualisateur d'Image Dynamique avec Fallback d'Erreur

Empêche l'affichage désagréable d'icônes cassées (broken link) lors de la saisie manuelle ou de l'import d'URLs d'images défectueuses de produits en utilisant un fallback ultra-premium et un badge d'avertissement.

```jsx
import { useState } from "react";

export function ImageInputWithPreview() {
  const [imageUrl, setImageUrl] = useState("");
  const [isValidImage, setIsValidImage] = useState(true);

  // Splendide image par défaut en cas d'échec ou d'absence d'URL
  const fallbackPlaceholder = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&q=80";

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-[2rem] shadow-sm flex flex-col gap-4 w-full max-w-sm">
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Image du produit (URL)</label>
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setIsValidImage(true);
          }}
          placeholder="Entrez une URL d'image valide..."
          className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-850 dark:text-gray-100 text-sm px-4 py-3 rounded-2xl outline-none transition-all"
        />
      </div>

      {/* Cadre de Prévisualisation */}
      <div className="h-48 border border-gray-100 dark:border-gray-800 rounded-2.5xl bg-gray-50 dark:bg-gray-900/60 overflow-hidden flex items-center justify-center relative group">
        {imageUrl && isValidImage ? (
          <img
            src={imageUrl}
            onError={() => setIsValidImage(false)}
            alt="Aperçu produit"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-center p-4 flex flex-col items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300 dark:text-gray-650" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide">
              {imageUrl && !isValidImage ? "Image non trouvée (Affichage défaut)" : "En attente d'une URL"}
            </span>
          </div>
        )}

        {/* Incrustation d'erreur avec verre dépoli */}
        {imageUrl && !isValidImage && (
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center">
            <img
              src={fallbackPlaceholder}
              alt="Default placeholder fallback"
              className="w-full h-full object-cover opacity-60"
            />
            <span className="absolute bg-red-650 text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg border border-red-500/20">
              Lien mort - Aperçu par défaut
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 18. Flux d'Activité Récent / Historique des Actions (Timeline)

Idéal pour afficher l'historique en temps réel des actions sur les données (telles que les réinitialisations de données, les imports réussis ou les erreurs système) avec des indicateurs colorés et pulsés.

```jsx
export function ActivityTimeline() {
  const events = [
    {
      id: 1,
      title: "Base de données réinitialisée",
      user: "Administrateur",
      time: "Il y a 2 min",
      color: "bg-red-550 ring-red-100 dark:ring-red-950/50"
    },
    {
      id: 2,
      title: "Importation terminée (128 produits)",
      user: "Système (CSV)",
      time: "Il y a 15 min",
      color: "bg-blue-500 ring-blue-100 dark:ring-blue-950/50"
    },
    {
      id: 3,
      title: "Connexion API authentifiée",
      user: "Service Bagisto",
      time: "Il y a 1 h",
      color: "bg-emerald-500 ring-emerald-100 dark:ring-emerald-950/50"
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-[2rem] shadow-sm w-full max-w-md">
      <h3 className="text-base font-black text-gray-900 dark:text-white mb-6">Flux d'Activité Récent</h3>
      <div className="relative pl-6 border-l-2 border-gray-100 dark:border-gray-800 space-y-6">
        {events.map((event) => (
          <div key={event.id} className="relative">
            {/* Puce d'étape pulsée haut de gamme */}
            <span className={`absolute -left-[30px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ring-4 ${event.color} animate-pulse`} />
            
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between items-baseline gap-4">
                <span className="text-xs font-black text-gray-800 dark:text-gray-200">{event.title}</span>
                <span className="text-[10px] font-bold text-gray-400">{event.time}</span>
              </div>
              <span className="text-[10px] font-bold text-gray-450 dark:text-gray-500">
                Opérateur : <b className="text-gray-600 dark:text-gray-300">{event.user}</b>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```
