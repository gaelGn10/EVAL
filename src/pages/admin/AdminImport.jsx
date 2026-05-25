import { useState } from "react";
import { Link } from "react-router-dom";
import Papa from "papaparse";

export default function AdminImport() {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, type: "" });
    const [status, setStatus] = useState(null);

    // Récupération du token (priorité au sessionStorage, sinon fallback sur le token de dev)
    const SESSION_TOKEN = sessionStorage.getItem("bagisto_admin_token");
    const DEV_TOKEN = "41|Y8QQW9fezzEnu5uD3VTvuZvIt6uS1yKgqwdXidge18351ff3";
    const TOKEN = (SESSION_TOKEN && SESSION_TOKEN !== "fake_admin_token_for_ui") ? SESSION_TOKEN : DEV_TOKEN;

    // Helper pour obtenir un token administrateur valide à la volée (résistant aux resets DB)
    const getValidAdminToken = async () => {
        const cached = sessionStorage.getItem("bagisto_real_admin_token");
        if (cached) return cached;

        try {
            const res = await fetch("http://localhost:8008/api/v1/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    email: "rambelosongael@gmail.com",
                    password: "bonjour7",
                    device_name: "web"
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.token) {
                    sessionStorage.setItem("bagisto_real_admin_token", data.token);
                    return data.token;
                }
            }
        } catch (e) {
            console.error("Erreur login auto admin", e);
        }

        return TOKEN;
    };

    const parseFile = (file) => {
        return new Promise((resolve, reject) => {

            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                encoding: "UTF-8",

                transformHeader: (header) => {
                    return header
                        .trim()
                        .toLowerCase()
                        .replace(/['"\s\ufeff]+/g, "");
                },

                complete: (results) => {

                    if (!results.data || results.data.length === 0) {
                        reject(new Error("Fichier vide ou invalide"));
                        return;
                    }

                    console.log("CSV détecté :", results.data);

                    resolve(results.data);
                },

                error: (err) => {
                    reject(err);
                }
            });

        });
    };

    // Découpe une ligne en respectant le contenu entre {} (colonne achat)
    const splitRespectingBraces = (line, sep) => {
        const parts = [];
        let current = "";
        let depth = 0;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === "{") depth++;
            else if (ch === "}") depth--;

            if (ch === sep && depth === 0) {
                parts.push(current);
                current = "";
            } else {
                current += ch;
            }
        }
        parts.push(current);
        return parts;
    };

    const importProducts = async (file) => {

        // ✅ Fonction robuste pour convertir les nombres français
        const parseNumber = (value) => {

            if (value === null || value === undefined) return 0;

            return parseFloat(
                value
                    .toString()
                    .trim()
                    .replace(/\s/g, "") // retire espaces
                    .replace(/,/g, ".") // virgule -> point
                    .replace(/[^\d.-]/g, "")
            ) || 0;
        };

        // ✅ Normalisation des headers
        const normalizeHeader = (header) => {
            return header
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim();
        };

        try {

            setLoading(true);

            const activeToken = await getValidAdminToken();
            const TOKEN = activeToken;

            setStatus({
                type: "info",
                message: "Analyse du fichier..."
            });

            const rawData = await parseFile(file);

            if (!rawData || rawData.length === 0) {
                throw new Error("Fichier vide");
            }
            let existingCategories = [];

            try {

                const catRes = await fetch(
                    "http://localhost:8008/api/v1/admin/catalog/categories?limit=100",
                    {
                        headers: {
                            "Accept": "application/json",
                            "Authorization": `Bearer ${TOKEN}`
                        }
                    }
                );

                if (catRes.ok) {

                    const catData = await catRes.json();
                    existingCategories = catData?.data || [];
                }
            } catch (e) {

                console.error(
                    "Impossible de charger le cache des catégories",
                    e
                );
            }
            const rootCategory =
                existingCategories.find(
                    c =>
                        c.id === 1 ||
                        c.id === "1" ||
                        c.slug === "root" ||
                        c.name?.toLowerCase() === "racine"
                ) ||
                existingCategories.find(
                    c => c.parent_id === null || !c.parent_id
                ) ||
                existingCategories[0];

            const rootCategoryId = rootCategory
                ? parseInt(rootCategory.id)
                : 1;

            console.log(
                `ID de la catégorie racine détecté : ${rootCategoryId}`
            );
            const activeLocales = [];

            if (rootCategory) {

                if (
                    rootCategory.translations &&
                    Array.isArray(rootCategory.translations)
                ) {

                    rootCategory.translations.forEach(t => {

                        if (
                            t.locale &&
                            !activeLocales.includes(t.locale)
                        ) {
                            activeLocales.push(t.locale);
                        }
                    });
                }

                const commonLocales = [
                    "fr",
                    "en",
                    "fr_FR",
                    "en_US"
                ];

                commonLocales.forEach(loc => {

                    if (
                        rootCategory[loc] &&
                        !activeLocales.includes(loc)
                    ) {
                        activeLocales.push(loc);
                    }
                });
            }

            if (activeLocales.length === 0) {
                activeLocales.push("fr", "en");
            }

            console.log(
                "Locales actives détectées :",
                activeLocales
            );
            const headers = Object.keys(rawData[0] || {})
                .map(normalizeHeader);

            const hasSkuHeader = headers.some(h =>
                ["sku", "ref"].includes(h)
            );

            const hasNameHeader = headers.some(h =>
                ["name", "nom", "label"].includes(h)
            );

            const hasPriceHeader = headers.some(h =>
                ["price", "prix", "prix_vente"].includes(h)
            );

            const hasStockHeader = headers.some(h =>
                ["stock_initial", "stock"].includes(h)
            );

            if (
                !hasSkuHeader ||
                !hasNameHeader ||
                !hasPriceHeader ||
                !hasStockHeader
            ) {

                throw new Error(
                    "Nom de colonne non conforme. " +
                    "Les colonnes SKU, nom, prix et stock sont requises."
                );

            }
            const skuSet = new Set();

            for (let i = 0; i < rawData.length; i++) {

                const row = rawData[i];

                const sku = (
                    row.sku ||
                    row.ref ||
                    ""
                ).toString().trim();

                const name = (
                    row.name ||
                    row.nom ||
                    row.label ||
                    ""
                ).toString().trim();

                const promoVal = (
                    row.prix_promo ||
                    row.promo ||
                    ""
                ).toString().trim();

                const promoPrice = parseNumber(
                    row.prix_promo ||
                    row.promo
                );

                const regularPrice = parseNumber(
                    row.prix_vente ||
                    row.prix ||
                    row.price
                );

                const achatPrice = parseNumber(
                    row.prix_achat ||
                    row.achat ||
                    row.cost
                );

                const qty = Number(
                    row.stock_initial ||
                    row.stock ||
                    0
                );
                if (!sku) {

                    throw new Error(
                        `SKU manquant ligne ${i + 1}`
                    );

                }

                if (!name) {

                    throw new Error(
                        `Nom produit manquant ligne ${i + 1}`
                    );

                }

                if (skuSet.has(sku)) {

                    throw new Error(
                        `SKU dupliqué détecté : ${sku}`
                    );

                }

                skuSet.add(sku);

                if (
                    !regularPrice ||
                    regularPrice <= 0
                ) {

                    throw new Error(
                        `Prix invalide pour le produit ${sku}`
                    );

                }

                if (
                    promoVal && promoPrice <= 0
                ) {

                    throw new Error(
                        `Montant positif requis pour le prix promo de ${sku}`
                    );

                }

                if (
                    isNaN(qty) ||
                    qty < 0
                ) {

                    throw new Error(
                        `Stock invalide pour ${sku}`
                    );

                }

            }
            setProgress({
                current: 0,
                total: rawData.length,
                type: "Produits"
            });

            // ======================================================
            // IMPORT DES PRODUITS
            // ======================================================

            let successCount = 0;
            const failedCategories = [];

            for (let i = 0; i < rawData.length; i++) {

                const row = rawData[i];

                setProgress(prev => ({
                    ...prev,
                    current: i + 1
                }));

                const name = (
                    row.name ||
                    row.nom ||
                    row.label ||
                    "Produit sans nom"
                ).toString().trim();

                const sku = (
                    row.sku ||
                    row.ref ||
                    `sku-${Date.now()}-${i}`
                ).toString().trim();

                const promoPrice = parseNumber(
                    row.prix_promo ||
                    row.promo
                );

                const regularPrice = parseNumber(
                    row.prix_vente ||
                    row.prix ||
                    row.price
                );

                const achatPrice = parseNumber(
                    row.prix_achat ||
                    row.achat ||
                    row.cost
                );

                const hasPromo = promoPrice > 0;

                const qty = Number(
                    row.stock_initial ||
                    row.stock ||
                    0
                );

                console.log(
                    `📦 Produit lu: ${sku} → prix_vente: ${regularPrice} € ${hasPromo
                        ? `| PROMO: ${promoPrice} €`
                        : "(pas de promo)"
                    }${achatPrice > 0 ? ` | prix_achat: ${achatPrice} €` : ""}`
                );

                // Détermination de la catégorie
                const categoryKey = Object.keys(row).find(k =>
                    k === "categorie" ||
                    k === "catégorie" ||
                    k === "category" ||
                    k.includes("categor") ||
                    k.includes("catégor") ||
                    k === "class" ||
                    k === "type_produit"
                );
                const categoryName = (
                    (categoryKey ? row[categoryKey] : "") ||
                    row.categorie ||
                    row.catégorie ||
                    row.category ||
                    row.class ||
                    row.type_produit ||
                    Object.values(row)[3] ||
                    ""
                ).toString().trim();
                let categoryId = null;

                if (categoryName) {
                    const catSlug = categoryName.toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)+/g, "");

                    // Recherche ultra-robuste dans le cache des catégories
                    const matchedCat = existingCategories.find(c => {
                        const nameLower = categoryName.toLowerCase();
                        const slugLower = catSlug.toLowerCase();

                        // 1. Recherche par nom ou slug direct au premier niveau
                        if (c.name?.toLowerCase() === nameLower) return true;
                        if (c.slug?.toLowerCase() === slugLower) return true;

                        // 2. Recherche dans les traductions (cas standard Bagisto)
                        if (c.translations && Array.isArray(c.translations)) {
                            return c.translations.some(t =>
                                t.name?.toLowerCase() === nameLower ||
                                t.slug?.toLowerCase() === slugLower
                            );
                        }

                        // 3. Recherche sous toutes les locales détectées et courantes
                        const checkLocales = Array.from(new Set([...activeLocales, "fr", "en", "fr_FR", "en_US"]));
                        for (const loc of checkLocales) {
                            if (c[loc] && typeof c[loc] === 'object') {
                                if (c[loc].name?.toLowerCase() === nameLower || c[loc].slug?.toLowerCase() === slugLower) {
                                    return true;
                                }
                            }
                        }

                        return false;
                    });

                    if (matchedCat) {
                        categoryId = parseInt(matchedCat.id);
                        console.log(`✓ Catégorie trouvée dans le cache: ${categoryName} (ID: ${categoryId})`);
                    } else {
                        // Créer la catégorie dynamiquement si elle n'existe vraiment pas
                        try {
                            const catPayload = {
                                name: categoryName,
                                slug: catSlug,
                                position: 1,
                                status: 1,
                                display_mode: "products_and_description",
                                description: categoryName,
                                parent_id: rootCategoryId,
                                attributes: [11],
                                locales: activeLocales
                            };

                            // Double-mapping des traductions pour toutes les locales actives et courantes
                            const allLocalesToMap = Array.from(new Set([...activeLocales, "fr", "en", "fr_FR", "en_US"]));
                            allLocalesToMap.forEach(loc => {
                                catPayload[loc] = {
                                    name: categoryName,
                                    slug: catSlug,
                                    description: categoryName,
                                    meta_title: categoryName,
                                    meta_description: categoryName,
                                    meta_keywords: categoryName
                                };
                            });

                            catPayload.translations = {};
                            activeLocales.forEach(loc => {
                                catPayload.translations[loc] = {
                                    name: categoryName,
                                    slug: catSlug,
                                    description: categoryName,
                                    meta_title: categoryName,
                                    meta_description: categoryName,
                                    meta_keywords: categoryName
                                };
                            });

                            console.log(`Création de la catégorie: ${categoryName}...`, catPayload);
                            const newCatRes = await fetch("http://localhost:8008/api/v1/admin/catalog/categories", {
                                method: "POST",
                                headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` },
                                body: JSON.stringify(catPayload)
                            });

                            if (newCatRes.ok) {
                                const newCatData = await newCatRes.json();
                                categoryId = newCatData?.data?.id || newCatData?.category?.id || newCatData?.data?.category?.id || newCatData?.id;

                                if (!categoryId) {
                                    console.log(`⚠️ ID de catégorie non résolu à partir de la réponse. Recherche active via l'API...`);
                                    try {
                                        const checkRes = await fetch("http://localhost:8008/api/v1/admin/catalog/categories?limit=100", {
                                            headers: { "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` }
                                        });
                                        if (checkRes.ok) {
                                            const checkData = await checkRes.json();
                                            const list = checkData?.data || [];
                                            const matched = list.find(c => c.slug === catSlug || c.name?.toLowerCase() === categoryName.toLowerCase());
                                            if (matched) {
                                                categoryId = matched.id;
                                            }
                                        }
                                    } catch (err) {
                                        console.error("Erreur lors de la récupération de secours de l'ID de catégorie", err);
                                    }
                                }

                                if (categoryId) {
                                    categoryId = parseInt(categoryId);
                                    console.log(`✓ Catégorie créée/résolue avec succès: ${categoryName} (ID: ${categoryId})`);

                                    // On ajoute le nom et slug au premier niveau dans le cache pour faciliter les prochaines recherches directes
                                    const cachedCat = {
                                        id: categoryId,
                                        name: categoryName,
                                        slug: catSlug,
                                        translations: activeLocales.map(loc => ({ locale: loc, name: categoryName, slug: catSlug }))
                                    };
                                    allLocalesToMap.forEach(loc => {
                                        cachedCat[loc] = { name: categoryName, slug: catSlug };
                                    });
                                    existingCategories.push(cachedCat);
                                } else {
                                    console.warn(`✗ Impossible de résoudre l'ID de la catégorie créée : ${categoryName}`);
                                    failedCategories.push(`${categoryName} (ID non résolu)`);
                                }
                            } else {
                                const errorText = await newCatRes.text();
                                let errorDetail = errorText;
                                try {
                                    const parsed = JSON.parse(errorText);
                                    errorDetail = parsed.message || JSON.stringify(parsed.errors) || errorText;
                                } catch (e) { }
                                console.warn(`✗ Échec création catégorie ${categoryName}:`, errorDetail);
                                failedCategories.push(`${categoryName} (${errorDetail})`);

                                // Si l'erreur indique que le slug existe déjà, on tente de re-fetcher toutes les catégories pour récupérer l'ID
                                if (errorText.includes("already been taken") || errorText.includes("déjà pris")) {
                                    console.log(`🔄 Le slug existe déjà. Re-chargement de la liste des catégories Bagisto...`);
                                    try {
                                        const refreshRes = await fetch("http://localhost:8008/api/v1/admin/catalog/categories?limit=100", {
                                            headers: { "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` }
                                        });
                                        if (refreshRes.ok) {
                                            const refreshData = await refreshRes.json();
                                            existingCategories = refreshData?.data || [];

                                            // Nouvelle recherche avec les données rafraîchies
                                            const foundCat = existingCategories.find(c => {
                                                const nameLower = categoryName.toLowerCase();
                                                const slugLower = catSlug.toLowerCase();
                                                if (c.name?.toLowerCase() === nameLower || c.slug?.toLowerCase() === slugLower) return true;
                                                if (c.translations && Array.isArray(c.translations)) {
                                                    return c.translations.some(t =>
                                                        t.name?.toLowerCase() === nameLower ||
                                                        t.slug?.toLowerCase() === slugLower
                                                    );
                                                }
                                                for (const loc of allLocalesToMap) {
                                                    if (c[loc] && typeof c[loc] === 'object') {
                                                        if (c[loc].name?.toLowerCase() === nameLower || c[loc].slug?.toLowerCase() === slugLower) {
                                                            return true;
                                                        }
                                                    }
                                                }
                                                return false;
                                            });
                                            if (foundCat) {
                                                categoryId = parseInt(foundCat.id);
                                                console.log(`✓ ID de catégorie récupéré avec succès après rafraîchissement : ${categoryId}`);
                                            }
                                        }
                                    } catch (refreshErr) {
                                        console.error("Erreur lors du rafraîchissement des catégories", refreshErr);
                                    }
                                }
                            }
                        } catch (err) {
                            console.error("Erreur création catégorie", err);
                        }
                    }
                }

                const urlKey = name.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)+/g, "");

                try {
                    let productId;
                    let existingProduct = null;

                    // ÉTAPE 1 : CRÉATION DU PRODUIT (BASE)
                    console.log(`Étape 1 : Création du produit ${sku}...`);
                    const createRes = await fetch("http://localhost:8008/api/v1/admin/catalog/products", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` },
                        body: JSON.stringify({ type: row.type?.trim() || "simple", attribute_family_id: 1, sku: sku })
                    });

                    const createData = await createRes.json();

                    if (createRes.ok) {
                        productId = createData.data.id;
                        console.log(`✓ Produit créé (ID: ${productId}).`);
                    } else if (createData.errors?.sku || createData.message?.includes("déjà")) {
                        console.log(`! SKU ${sku} existe déjà. Recherche de l'ID...`);
                        const searchRes = await fetch(`http://localhost:8008/api/v1/admin/catalog/products?sku=${sku}`, {
                            headers: { "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` }
                        });
                        const searchData = await searchRes.json();
                        existingProduct = searchData.data?.[0];
                        productId = existingProduct?.id;
                        if (!productId) throw new Error("Impossible de trouver l'ID du produit existant.");
                        console.log(`✓ ID trouvé : ${productId}. Mise à jour forcée...`);
                    } else {
                        throw new Error(createData.message || "Erreur création");
                    }

                    // Déterminer la liste des categories à associer
                    let categoryIds = categoryId ? [categoryId] : [rootCategoryId];
                    if (!categoryId && existingProduct) {
                        if (existingProduct.categories && Array.isArray(existingProduct.categories)) {
                            const ids = existingProduct.categories.map(c => typeof c === 'object' ? c.id : c).filter(Boolean);
                            if (ids.length > 0) {
                                categoryIds = ids;
                            }
                        }
                    }

                    // Déterminer la liste des canaux à associer
                    let channelIds = [1];
                    if (existingProduct && existingProduct.channels && Array.isArray(existingProduct.channels)) {
                        const ids = existingProduct.channels.map(c => typeof c === 'object' ? c.id : c).filter(Boolean);
                        if (ids.length > 0) {
                            channelIds = ids;
                        }
                    }

                    // Récupérer les images existantes pour éviter de les supprimer
                    const imagesPayload = {
                        files: []
                    };
                    if (existingProduct && existingProduct.images && Array.isArray(existingProduct.images)) {
                        existingProduct.images.forEach(img => {
                            if (img.id) {
                                imagesPayload[img.id] = img.path || img.url || "keep";
                            }
                        });
                    }

                    // ÉTAPE 2 : MISE À JOUR DES ATTRIBUTS (NOM, PRIX, ETC.)
                    const updatePayload = {
                        sku: sku,
                        name: name,
                        url_key: urlKey,
                        price: regularPrice,                           // prix_vente → affiché barré si promo
                        special_price: promoPrice > 0 ? promoPrice : null, // prix_promo → prix appliqué à l'achat
                        cost: achatPrice > 0 ? achatPrice : undefined,  // prix_achat → coût interne
                        prix_vente: regularPrice,                      // attribut personnalisé Bagisto
                        prix_promo: promoPrice > 0 ? promoPrice : null,// attribut personnalisé Bagisto
                        prix_achat: achatPrice > 0 ? achatPrice : undefined, // attribut personnalisé Bagisto
                        weight: row.weight || row.poids || 1,
                        status: 1,
                        visible_individually: 1,
                        attribute_family_id: 1,
                        short_description: name,
                        description: name,
                        channels: channelIds,
                        categories: categoryIds,
                        images: imagesPayload,
                        locales: activeLocales,
                        inventories: { "1": qty },
                        new: 1,
                        featured: 1
                    };

                    const allProductLocales = Array.from(new Set([...activeLocales, "fr", "en", "fr_FR", "en_US"]));
                    allProductLocales.forEach(loc => {
                        updatePayload[loc] = {
                            name: name,
                            url_key: urlKey,
                            description: name,
                            short_description: name
                        };
                    });

                    const updateRes = await fetch(`http://localhost:8008/api/v1/admin/catalog/products/${productId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` },
                        body: JSON.stringify(updatePayload)
                    });

                    const updateData = await updateRes.json();
                    if (updateRes.ok) {
                        successCount++;
                        console.log(`✓ Produit ${sku} mis à jour avec succès !`);
                    } else {
                        console.error(`✗ Échec mise à jour ${sku}:`, updateData);
                    }
                } catch (e) {
                    console.error(`! Erreur pour ${sku}:`, e.message);
                }
            }
            if (failedCategories.length > 0) {
                setStatus({
                    type: "warning",
                    message: `${successCount}/${rawData.length} produits importés. Attention, certaines catégories n'ont pas pu être créées (repliées sur Racine) : ${failedCategories.join(', ')}`
                });
            } else {
                setStatus({
                    type: successCount > 0 ? "success" : "error",
                    message: `${successCount}/${rawData.length} produits importés avec succès !`
                });
            }
        } catch (err) {
            setStatus({ type: "error", message: "Erreur d'importation : " + err.message });
        } finally {
            setLoading(false);
        }
    };

    const importCustomers = async (file) => {
        try {
            setLoading(true);
            setStatus({ type: "info", message: "Lecture du fichier clients..." });
            const customers = await parseFile(file);

            if (!customers || customers.length === 0) {
                throw new Error("Le fichier semble vide ou mal formaté.");
            }

            // 1. Validation : Nom de colonne non conforme
            const headers = Object.keys(customers[0] || {});
            const hasEmailHeader = headers.some(h => ["client", "email", "mail"].includes(h));
            const hasFirstNameHeader = headers.some(h => ["first_name", "prenom"].includes(h));
            const hasLastNameHeader = headers.some(h => ["last_name", "nom"].includes(h));
            const hasPasswordHeader = headers.some(h => ["password", "pwd"].includes(h));

            if (!hasEmailHeader || !hasFirstNameHeader || !hasLastNameHeader || !hasPasswordHeader) {
                throw new Error("Nom de colonne non conforme. Les colonnes 'email', 'prenom', 'nom' et 'password' sont requises.");
            }

            setProgress({ current: 0, total: customers.length, type: "Clients" });

            let successCount = 0;
            for (let i = 0; i < customers.length; i++) {
                const customer = customers[i];
                setProgress(prev => ({ ...prev, current: i + 1 }));

                // Mapping très flexible et tolérant aux espaces/caractères spéciaux
                const email = (customer.client || customer.email || customer.mail || Object.values(customer)[2] || "").toString().trim();

                console.log(`Traitement ligne ${i + 1}: email=${email}`);

                if (!email || !email.includes("@")) {
                    console.warn(`Ligne ${i + 1} sautée : Email invalide ou absent`, customer);
                    continue;
                }

                const emailPrefix = email.split("@")[0];
                const firstName = customer.first_name || customer.prenom || emailPrefix.split(".")[0] || "Client";
                const lastName = customer.last_name || customer.nom || emailPrefix.split(".")[1] || "Inconnu";
                const password = customer.password || customer.pwd || "password123";

                // Sauvegarde du mot de passe pour pouvoir se connecter lors de l'import des commandes
                const credentials = JSON.parse(localStorage.getItem('customer_credentials') || '{}');
                credentials[email] = password.toString().trim();
                localStorage.setItem('customer_credentials', JSON.stringify(credentials));

                const payload = {
                    first_name: firstName.toString().trim(),
                    last_name: lastName.toString().trim(),
                    email: email,
                    password: password.toString().trim(),
                    password_confirmation: password.toString().trim()
                };

                try {
                    // Utilisation de l'API Register publique de Bagisto (pas besoin de token admin)
                    const response = await fetch("http://localhost:8008/api/v1/customer/register", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        successCount++;
                        console.log(`✓ Succès (Register) pour ${email}`);
                    } else {
                        const errorText = await response.text();
                        let errorMsg = errorText;
                        try {
                            const errorJson = JSON.parse(errorText);
                            errorMsg = errorJson.message || JSON.stringify(errorJson.errors);

                            // Si l'erreur est que l'email est déjà pris, on le compte comme un succès pour l'import
                            if (errorMsg.includes("already been taken") || errorMsg.includes("déjà pris")) {
                                successCount++;
                                console.log(`✓ Le client ${email} existe déjà.`);
                                continue;
                            }
                        } catch (e) { }
                        console.error(`✗ Échec pour ${email}:`, errorMsg);
                    }
                } catch (e) {
                    console.error(`! Erreur réseau pour ${email}:`, e);
                }
            }
            setStatus({
                type: successCount > 0 ? "success" : "error",
                message: successCount > 0
                    ? `${successCount}/${customers.length} clients créés avec succès !`
                    : `Échec de l'import : 0/${customers.length} créés. Vérifiez la console (F12).`
            });
        } catch (err) {
            setStatus({ type: "error", message: "Erreur d'importation : " + err.message });
        } finally {
            setLoading(false);
        }
    };

    const importOrders = async (file) => {
        try {
            setLoading(true);
            const activeToken = await getValidAdminToken();
            const TOKEN = activeToken;
            setStatus({ type: "info", message: "Lecture du fichier commandes..." });
            const rows = await parseFile(file);

            if (!rows || rows.length === 0) throw new Error("Le fichier est vide.");

            // 1. Validation : Nom de colonne non conforme
            const headers = Object.keys(rows[0] || {});
            const hasDateHeader = headers.some(h => ["date"].includes(h));
            const hasClientHeader = headers.some(h => ["client", "email"].includes(h));
            const hasAchatHeader = headers.some(h => ["achat", "achats", "produits"].includes(h));

            if (!hasDateHeader || !hasClientHeader || !hasAchatHeader) {
                throw new Error("Nom de colonne non conforme. Les colonnes 'date', 'client' (ou 'email') et 'achat' sont requises.");
            }

            // 2. Validation : format de date DD/MM/YYYY & montant positif (quantité)
            const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const email = (row.client || row.email || Object.values(row)[2] || "").toString().trim();
                const date = (row.date || Object.values(row)[0] || "").toString().trim();
                const achatStr = (row.achat || row.achats || row.produits || Object.values(row)[3] || "").toString().trim();

                // Validation Date Format
                if (!datePattern.test(date)) {
                    throw new Error(`format de date différente de DD/MM/YYYY à la ligne ${i + 1} : la valeur '${date}' est invalide.`);
                }

                // Validation Montant (Quantités de produits)
                if (achatStr) {
                    const cleaned = achatStr.replace(/[\{\}]/g, "");
                    const parts = cleaned.split("],");
                    for (const p of parts) {
                        const inner = p.replace(/[\[\]]/g, "").trim();
                        if (!inner) continue;
                        const [skuRaw, qtyRaw] = inner.split(";");
                        const qty = parseInt(qtyRaw) || 0;
                        if (qty <= 0) {
                            throw new Error(`montant positif requis : la quantité du produit '${skuRaw || 'Ligne ' + (i + 1)}' doit être supérieure à 0.`);
                        }
                    }
                }
            }

            setProgress({ current: 0, total: rows.length, type: "Commandes" });

            let successCount = 0;
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];

                setProgress(prev => ({ ...prev, current: i + 1 }));

                const email = (row.client || row.email || Object.values(row)[2] || "").toString().trim();
                const achatStr = (row.achat || row.achats || row.produits || Object.values(row)[3] || "").toString().trim();
                const date = (row.date || Object.values(row)[0] || "").toString().trim();
                const heure = (row.heure || Object.values(row)[1] || "").toString().trim();
                const statusRaw = (row.status || row.statut || row.etat || row["état"] || Object.values(row)[4] || "pending").toString().trim().toLowerCase();
                let statusStr = "pending";
                if (statusRaw.includes("cours") || statusRaw.includes("traitement") || statusRaw.includes("processing")) statusStr = "processing";
                else if (statusRaw.includes("livré") || statusRaw.includes("terminé") || statusRaw.includes("completed")) statusStr = "completed";
                else if (statusRaw.includes("annul") || statusRaw.includes("cancel")) statusStr = "canceled";
                else if (statusRaw.includes("attente") || statusRaw.includes("pending")) statusStr = "pending";
                else statusStr = statusRaw; // fallback

                if (!email || !achatStr) {
                    console.warn(`Ligne ${i + 1} sautée : données manquantes`, row);
                    continue;
                }

                // ✅ Parsing robuste du format {["sku";qty],["sku2";qty2]} ou "{["sku";qty]}"
                const parseItems = (str) => {
                    const cleaned = str.replace(/[\{\}]/g, ""); // retire TOUTES les accolades (même s'il y a des guillemets autour)
                    const parts = cleaned.split("],");
                    return parts.map(p => {
                        const inner = p.replace(/[\[\]]/g, "").trim();
                        const [skuRaw, qtyRaw] = inner.split(";");
                        const sku = skuRaw?.trim()?.replace(/["']/g, "");
                        const qty = parseInt(qtyRaw) || 1;
                        return { sku, qty };
                    }).filter(item => item.sku && item.sku.length > 0);
                };

                const items = parseItems(achatStr);
                console.log(`📋 Commande ${email} — items parsés:`, items);

                // ✅ Calculer le total en récupérant le prix via l'API Admin
                let grandTotal = 0;
                const itemsWithPrices = [];

                for (const item of items) {
                    let pId = null;
                    let pPrice = 0;
                    let pName = `Produit (${item.sku})`;

                    try {
                        const pRes = await fetch(`http://localhost:8008/api/v1/admin/catalog/products?sku=${item.sku}`, {
                            headers: { "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` }
                        });
                        const pData = await pRes.json();
                        if (pData.data && pData.data.length > 0) {
                            const productData = pData.data[0];
                            pId = productData.id;
                            pPrice = parseFloat(productData.price) || 0;
                            pName = productData.name || pName;

                            // Récupérer la quantité actuelle en stock
                            const inventories = productData.inventories || [];
                            const currentQty = inventories.length > 0 ? (parseInt(inventories[0].qty) || 0) : 0;

                            // Si le stock actuel est inférieur à la quantité commandée, on l'ajuste via l'API dédiée
                            if (currentQty < item.qty) {
                                console.log(`🔄 Ajustement de stock requis pour ${item.sku} : actuel ${currentQty} < requis ${item.qty}. Ajustement à ${item.qty}...`);
                                await fetch(`http://localhost:8008/api/v1/admin/catalog/products/${pId}/inventories`, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "Accept": "application/json",
                                        "Authorization": `Bearer ${TOKEN}`
                                    },
                                    body: JSON.stringify({
                                        inventories: {
                                            "1": item.qty
                                        }
                                    })
                                });
                            }
                        }
                    } catch (e) {
                        console.error(`Erreur fetch produit ${item.sku}`, e);
                    }

                    const lineTotal = pPrice * item.qty;
                    grandTotal += lineTotal;

                    itemsWithPrices.push({
                        ...item,
                        id: pId,
                        price: pPrice,
                        name: pName,
                        total: lineTotal
                    });
                }

                console.log(`📋 Commande ${email} — total: ${grandTotal}€, items:`, itemsWithPrices);

                // Récupération du mot de passe sauvegardé lors de l'import client
                const credentials = JSON.parse(localStorage.getItem('customer_credentials') || '{}');
                const userPassword = credentials[email] || "password123";

                try {
                    console.log(` Tentative création via API pour ${email}`);

                    // 1. Login as customer
                    let loginRes = await fetch("http://localhost:8008/api/v1/customer/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Accept": "application/json" },
                        body: JSON.stringify({ email: email, password: userPassword, device_name: "web" })
                    });

                    // Si le login échoue (ex: client n'existe pas), on tente de le créer à la volée !
                    if (!loginRes.ok) {
                        console.log(`⚠️ Client non trouvé ou mot de passe invalide pour ${email}. Tentative de création...`);
                        const emailPrefix = email.split("@")[0];
                        const firstName = emailPrefix.split(".")[0] || "Client";
                        const lastName = emailPrefix.split(".")[1] || "Inconnu";

                        const registerRes = await fetch("http://localhost:8008/api/v1/customer/register", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Accept": "application/json" },
                            body: JSON.stringify({
                                first_name: firstName,
                                last_name: lastName,
                                email: email,
                                password: userPassword,
                                password_confirmation: userPassword
                            })
                        });

                        if (registerRes.ok) {
                            console.log(`✓ Client ${email} créé avec succès ! Nouvel essai de login...`);
                            // On retente le login
                            loginRes = await fetch("http://localhost:8008/api/v1/customer/login", {
                                method: "POST",
                                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                                body: JSON.stringify({ email: email, password: userPassword, device_name: "web" })
                            });
                        } else {
                            console.warn(`⚠️ Impossible de créer le client ${email}. Le mot de passe original est peut-être différent.`);
                        }
                    }

                    if (loginRes.ok) {
                        const { token } = await loginRes.json();

                        // 2. Clear cart
                        await fetch("http://localhost:8008/api/v1/customer/cart/empty", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${token}` }
                        });

                        // 3. Add items to cart
                        for (const item of itemsWithPrices) {
                            if (item.id) {
                                await fetch(`http://localhost:8008/api/v1/customer/cart/add/${item.id}`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${token}` },
                                    body: JSON.stringify({ quantity: item.qty, product_id: item.id })
                                });
                            } else {
                                console.warn(`⚠️ Produit ignoré (SKU inconnu): ${item.sku}`);
                            }
                        }

                        // 4. Addresses
                        const nameParts = email.split('@')[0].split('.');
                        const fName = nameParts[0] || "Client";
                        const lName = nameParts[1] || "Import";
                        const addressData = {
                            billing: {
                                first_name: fName, last_name: lName, email: email,
                                address: ["Adresse Import"], city: "Paris", state: "IDF", postcode: "75000", country: "FR", phone: "0102030405",
                                use_for_shipping: true
                            },
                            shipping: {
                                first_name: fName, last_name: lName, email: email,
                                address: ["Adresse Import"], city: "Paris", state: "IDF", postcode: "75000", country: "FR", phone: "0102030405"
                            }
                        };
                        await fetch("http://localhost:8008/api/v1/customer/checkout/save-address", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${token}` },
                            body: JSON.stringify(addressData)
                        });

                        // 5. Shipping
                        await fetch("http://localhost:8008/api/v1/customer/checkout/save-shipping", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${token}` },
                            body: JSON.stringify({ shipping_method: "free_free" })
                        });

                        // 6. Payment
                        await fetch("http://localhost:8008/api/v1/customer/checkout/save-payment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${token}` },
                            body: JSON.stringify({ payment: { method: "cashondelivery" } })
                        });

                        // 7. Place Order
                        const orderRes = await fetch("http://localhost:8008/api/v1/customer/checkout/save-order", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${token}` }
                        });

                        if (orderRes.ok) {
                            const orderData = await orderRes.json();
                            const bagistoOrderId = orderData.data?.order?.id || orderData.data?.id;
                            console.log(`✓ Commande insérée dans l'API Bagisto pour ${email} (ID: ${bagistoOrderId})`);
                            if (statusStr !== "pending") {
                                try {
                                    console.log(`🔄 Mise à jour du statut Bagisto vers : ${statusStr} pour la commande ${bagistoOrderId}`);

                                    // 1. Récupération de la commande admin pour avoir les ID internes des items
                                    const adminOrderRes = await fetch(`http://localhost:8008/api/v1/admin/sales/orders/${bagistoOrderId}`, {
                                        headers: { "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` }
                                    });
                                    if (adminOrderRes.ok) {
                                        const adminOrderData = await adminOrderRes.json();
                                        const fullOrder = adminOrderData.data || adminOrderData;

                                        if (statusStr === "canceled") {
                                            // Annulation
                                            await fetch(`http://localhost:8008/api/v1/admin/sales/orders/${bagistoOrderId}/cancel`, {
                                                method: "POST",
                                                headers: { "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` }
                                            });
                                        }
                                        else if (statusStr === "completed" || statusStr === "processing") {
                                            // Facturation (Invoice) requise pour processing ET completed
                                            const invoiceItems = {};
                                            fullOrder.items.forEach(item => { invoiceItems[item.id] = parseInt(item.qty_ordered); });

                                            await fetch(`http://localhost:8008/api/v1/admin/sales/invoices/${bagistoOrderId}`, {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` },
                                                body: JSON.stringify({ invoice: { items: invoiceItems } })
                                            });

                                            // --- DECREASE STOCK ON INVOICE FOR IMPORTED ORDERS (STATUS BECOMES 'PROCESSING' / 'EN COURS' OR 'COMPLETED') ---
                                            console.log("📉 Diminution du stock pour les articles de la commande importée facturée...");
                                            for (const item of fullOrder.items) {
                                                const matchedItem = itemsWithPrices.find(iwp => iwp.sku === item.sku);
                                                const pId = item.product_id || matchedItem?.id || item.additional?.product_id || item.additional_fields?.product_id;
                                                if (pId && item.qty_ordered) {
                                                    try {
                                                        const pRes = await fetch(`http://localhost:8008/api/v1/admin/catalog/products/${pId}`, {
                                                            headers: { "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` }
                                                        });
                                                        const pData = await pRes.json();
                                                        const productData = pData.data || pData;

                                                        if (productData) {
                                                            const inventories = productData.inventories || [];
                                                            const currentQty = inventories.length > 0 ? (parseInt(inventories[0].qty) || 0) : 0;
                                                            const orderedQty = parseInt(item.qty_ordered) || 0;
                                                            const newQty = Math.max(0, currentQty - orderedQty);

                                                            console.log(`📉 Produit ID ${pId} (${item.name}) : stock actuel ${currentQty} - commandé ${orderedQty} => nouveau stock ${newQty}`);

                                                            await fetch(`http://localhost:8008/api/v1/admin/catalog/products/${pId}/inventories`, {
                                                                method: "POST",
                                                                headers: {
                                                                    "Content-Type": "application/json",
                                                                    "Accept": "application/json",
                                                                    "Authorization": `Bearer ${TOKEN}`
                                                                },
                                                                body: JSON.stringify({
                                                                    inventories: {
                                                                        "1": newQty
                                                                    }
                                                                })
                                                            });
                                                        }
                                                    } catch (pErr) {
                                                        console.error(`Erreur diminution stock pour produit ID ${pId}`, pErr);
                                                    }
                                                }
                                            }

                                            // Expédition (Shipment) requise uniquement pour completed
                                            if (statusStr === "completed") {
                                                // --- PRE-SHIPMENT STOCK ADJUSTMENT TO PRESERVE POST-INVOICE STOCK ---
                                                console.log("🔄 Ajustement compensatoire des stocks avant expédition (import) pour conserver le niveau de stock après facturation...");
                                                for (const item of fullOrder.items) {
                                                    const qty = parseInt(item.qty_ordered || 0);
                                                    const matchedItem = itemsWithPrices.find(iwp => iwp.sku === item.sku);
                                                    const pId = item.product_id || matchedItem?.id || item.additional?.product_id || item.additional_fields?.product_id;
                                                    if (pId && qty > 0) {
                                                        try {
                                                            const pRes = await fetch(`http://localhost:8008/api/v1/admin/catalog/products/${pId}`, {
                                                                headers: { "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` }
                                                            });
                                                            const pData = await pRes.json();
                                                            const productData = pData.data || pData;

                                                            if (productData) {
                                                                const inventories = productData.inventories || [];
                                                                const currentQty = inventories.length > 0 ? (parseInt(inventories[0].qty) || 0) : 0;
                                                                const tempQty = currentQty + qty;

                                                                console.log(`⚡ Produit ID ${pId} : stock actuel ${currentQty} + expédié ${qty} => ajustement temporaire à ${tempQty} pour compenser la livraison.`);
                                                                await fetch(`http://localhost:8008/api/v1/admin/catalog/products/${pId}/inventories`, {
                                                                    method: "POST",
                                                                    headers: {
                                                                        "Content-Type": "application/json",
                                                                        "Accept": "application/json",
                                                                        "Authorization": `Bearer ${TOKEN}`
                                                                    },
                                                                    body: JSON.stringify({
                                                                        inventories: {
                                                                            "1": tempQty
                                                                        }
                                                                    })
                                                                });
                                                            }
                                                        } catch (pErr) {
                                                            console.error(`Erreur ajustement stock compensatoire avant expédition pour produit ID ${pId}`, pErr);
                                                        }
                                                    }
                                                }

                                                const itemsMap = {};
                                                let totalQty = 0;
                                                fullOrder.items.forEach(item => {
                                                    const qty = parseInt(item.qty_ordered || 0);
                                                    if (qty > 0) {
                                                        itemsMap[item.id] = { "1": qty };
                                                        totalQty += qty;
                                                    }
                                                });

                                                await fetch(`http://localhost:8008/api/v1/admin/sales/shipments/${bagistoOrderId}`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` },
                                                    body: JSON.stringify({
                                                        shipment: {
                                                            carrier_title: "Service Livraison Import",
                                                            track_number: "SHIP-IMP-" + bagistoOrderId,
                                                            source: 1,
                                                            total_qty: totalQty,
                                                            items: itemsMap
                                                        }
                                                    })
                                                });
                                            }
                                        }
                                    }
                                } catch (e) {
                                    console.error(`Erreur de synchronisation du statut pour la commande ${bagistoOrderId}`, e);
                                }
                            }
                            if (statusStr !== "completed" && statusStr !== "processing" && statusStr !== "canceled") {
                                console.log("📉 Diminution du stock pour les articles de la commande importée en attente...");
                                for (const item of itemsWithPrices) {
                                    if (item.id && item.qty) {
                                        try {
                                            const pRes = await fetch(`http://localhost:8008/api/v1/admin/catalog/products/${item.id}`, {
                                                headers: { "Accept": "application/json", "Authorization": `Bearer ${TOKEN}` }
                                            });
                                            const pData = await pRes.json();
                                            const productData = pData.data || pData;

                                            if (productData) {
                                                const inventories = productData.inventories || [];
                                                const currentQty = inventories.length > 0 ? (parseInt(inventories[0].qty) || 0) : 0;
                                                const orderedQty = parseInt(item.qty) || 0;
                                                const newQty = Math.max(0, currentQty - orderedQty);

                                                console.log(`📉 [En attente] Produit ID ${item.id} (${item.name}) : stock actuel ${currentQty} - commandé ${orderedQty} => nouveau stock ${newQty}`);

                                                await fetch(`http://localhost:8008/api/v1/admin/catalog/products/${item.id}/inventories`, {
                                                    method: "POST",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                        "Accept": "application/json",
                                                        "Authorization": `Bearer ${TOKEN}`
                                                    },
                                                    body: JSON.stringify({
                                                        inventories: {
                                                            "1": newQty
                                                        }
                                                    })
                                                });
                                            }
                                        } catch (pErr) {
                                            console.error(`Erreur diminution stock pour produit ID ${item.id}`, pErr);
                                        }
                                    }
                                }
                            }
                            const existingOrders = JSON.parse(localStorage.getItem('imported_orders_meta') || '[]');
                            existingOrders.push({
                                bagisto_order_id: bagistoOrderId,
                                customer_email: email,
                                status: statusStr,
                                // Dériver les flags depuis le statut importé
                                invoiced: statusStr === 'completed' || statusStr === 'processing',
                                shipped: statusStr === 'completed',
                                created_at: `${date} ${heure}`,
                                grand_total: grandTotal,
                                items: itemsWithPrices
                            });
                            localStorage.setItem('imported_orders_meta', JSON.stringify(existingOrders));

                            successCount++;
                        } else {
                            console.warn(`⚠️ Échec insertion API Bagisto pour ${email}`);
                        }
                    } else {
                        console.warn(`⚠️ Impossible de se connecter en tant que ${email} (mot de passe inconnu).`);
                    }
                } catch (e) {
                    console.error(`! Erreur inattendue pour ${email}:`, e);
                }
            }

            setStatus({
                type: successCount > 0 ? "success" : "error",
                message: `${successCount}/${rows.length} commandes importées avec succès !`
            });
        } catch (err) {
            setStatus({ type: "error", message: "Erreur d'importation : " + err.message });
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                    <Link to="/admin/dashboard" className="hover:text-blue-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight">Importation des données</h1>
                </div>
            </header>
            <main className="p-10 flex-grow max-w-4xl mx-auto w-full">
                {status && (
                    <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300 ${status.type === "success" ? "bg-green-50 border-green-100 text-green-700" :
                        status.type === "error" ? "bg-red-50 border-red-100 text-red-700" :
                            "bg-blue-50 border-blue-100 text-blue-700"
                        }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${status.type === "success" ? "bg-green-100" :
                            status.type === "error" ? "bg-red-100" :
                                "bg-blue-100"
                            }`}>
                            {status.type === "success" ? "✓" : status.type === "error" ? "!" : "i"}
                        </div>
                        <p className="font-bold">{status.message}</p>
                        <button onClick={() => setStatus(null)} className="ml-auto text-current opacity-50 hover:opacity-100 font-bold">×</button>
                    </div>
                )}
                <div className="grid gap-8">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">Import Produits</h2>
                                <p className="text-gray-500 text-sm">Fichier CSV/TXT avec colonnes: sku, name, type...</p>
                            </div>
                        </div>

                        <label className="block">
                            <span className="sr-only">Choisir un fichier</span>
                            <input
                                type="file"
                                accept=".csv,.txt"
                                disabled={loading}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-3 file:px-6
                                    file:rounded-xl file:border-0
                                    file:text-sm file:font-bold
                                    file:bg-blue-50 file:text-blue-700
                                    hover:file:bg-blue-100 transition-all cursor-pointer disabled:opacity-50"
                                onChange={(e) => {
                                    if (e.target.files[0]) importProducts(e.target.files[0]);
                                }}
                            />
                        </label>
                    </div>

                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">Import Clients</h2>
                                <p className="text-gray-500 text-sm">Fichier CSV/TXT avec colonnes: nom, prenom, email, pwd...</p>
                            </div>
                        </div>

                        <label className="block">
                            <span className="sr-only">Choisir un fichier</span>
                            <input
                                type="file"
                                accept=".csv,.txt"
                                disabled={loading}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-3 file:px-6
                                    file:rounded-xl file:border-0
                                    file:text-sm file:font-bold
                                    file:bg-purple-50 file:text-purple-700
                                    hover:file:bg-purple-100 transition-all cursor-pointer disabled:opacity-50"
                                onChange={(e) => {
                                    if (e.target.files[0]) importCustomers(e.target.files[0]);
                                }}
                            />
                        </label>
                    </div>

                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">Import Commandes</h2>
                                <p className="text-gray-500 text-sm">Format: date, heure, client, achat, status</p>
                            </div>
                        </div>
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700 block mb-2">Fichier de commandes</span>
                            <input
                                type="file"
                                accept=".csv,.txt"
                                disabled={loading}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-3 file:px-6
                                    file:rounded-xl file:border-0
                                    file:text-sm file:font-bold
                                    file:bg-orange-50 file:text-orange-700
                                    hover:file:bg-orange-100 transition-all cursor-pointer disabled:opacity-50"
                                onChange={(e) => {
                                    if (e.target.files[0]) importOrders(e.target.files[0]);
                                }}
                            />
                        </label>
                    </div>

                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-16 h-16 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">Import Images</h2>
                                <p className="text-gray-500 text-sm">Fichier ZIP via script JSX 100% Client</p>
                            </div>
                        </div>

                        <Link
                            to="/admin/import-image"
                            className="block w-full text-center py-4 px-6 rounded-xl border-2 border-dashed border-pink-200 text-pink-600 font-bold hover:bg-pink-50 transition-all cursor-pointer"
                        >
                            Aller à la page d'import d'images →
                        </Link>
                    </div>
                </div>
            </main>

            {loading && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-50 p-6 text-center">
                    <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-8"></div>
                    <h3 className="text-3xl font-black mb-2 uppercase tracking-tighter">Importation en cours</h3>
                    <p className="text-blue-400 font-bold text-xl mb-4">{progress.type} : {progress.current} / {progress.total}</p>
                    <div className="w-full max-w-md bg-gray-800 rounded-full h-4 overflow-hidden">
                        <div
                            className="bg-blue-500 h-full transition-all duration-300"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
}
