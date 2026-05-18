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

    const parseFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
                
                if (lines.length < 2) {
                    reject(new Error("Le fichier est vide ou mal formaté."));
                    return;
                }

                // Détection automatique du séparateur : tabulation ou point-virgule ou virgule
                const firstLine = lines[0];
                const sep = firstLine.includes("\t") ? "\t"
                          : firstLine.includes(";") ? ";"
                          : ",";

                const headers = firstLine.split(sep).map(h => h.trim().toLowerCase().replace(/\s+/g, ""));
                
                const data = [];
                for (let i = 1; i < lines.length; i++) {
                    // On découpe uniquement sur le séparateur PRINCIPAL (tab/; /,)
                    // La colonne "achat" contient des ; internes qu'il ne faut PAS couper
                    const parts = splitRespectingBraces(lines[i], sep);
                    if (parts.length < 2) continue;
                    
                    const row = {};
                    headers.forEach((h, idx) => {
                        row[h] = (parts[idx] || "").trim();
                    });
                    data.push(row);
                }

                console.log("Données brutes détectées:", data);
                resolve(data);
            };
            reader.onerror = () => reject(new Error("Impossible de lire le fichier."));
            reader.readAsText(file, "UTF-8");
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
        try {
            setLoading(true);
            setStatus({ type: "info", message: "Analyse du fichier..." });
            const rawData = await parseFile(file);
            if (!rawData || rawData.length === 0) throw new Error("Fichier vide");

            setProgress({ current: 0, total: rawData.length, type: "Produits" });

            let successCount = 0;
            for (let i = 0; i < rawData.length; i++) {
                let row = rawData[i];

                setProgress(prev => ({ ...prev, current: i + 1 }));

                const name = (row.name || row.nom || row.label || Object.values(row)[2] || "Produit sans nom").toString().trim();
                const sku = (row.sku || row.ref || Object.values(row)[1] || `sku-${Date.now()}-${i}`).toString().trim();

                // ✅ Priorité au prix promo s'il existe et est valide
                const promoVal = (row.prix_promo || row.promo || "").toString().trim();
                const promoPrice = promoVal ? parseFloat(promoVal.replace(",", ".").replace(/[^0-9.]/g, "")) || 0 : 0;
                const regularVal = (row.prix_vente || row.prix || row.price || Object.values(row)[4] || "0").toString();
                const regularPrice = parseFloat(regularVal.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
                // Le prix effectif : promo si dispo, sinon prix vente
                const price = promoPrice > 0 ? promoPrice : regularPrice;
                const hasPromo = promoPrice > 0;

                const qty = parseInt(row.stock_initial || row.stock || Object.values(row)[7] || 0);

                if (sku && price > 0) {
                    console.log(`📦 Produit lu: ${sku} → ${price} € ${hasPromo ? `(PROMO, prix normal: ${regularPrice} €)` : "(prix normal)"}`);
                }

                const urlKey = name.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)+/g, "");

                try {
                    let productId;

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
                        productId = searchData.data?.[0]?.id;
                        if (!productId) throw new Error("Impossible de trouver l'ID du produit existant.");
                        console.log(`✓ ID trouvé : ${productId}. Mise à jour forcée...`);
                    } else {
                        throw new Error(createData.message || "Erreur création");
                    }



                    // ÉTAPE 2 : MISE À JOUR DES ATTRIBUTS (NOM, PRIX, ETC.)
                    const updatePayload = {
                        sku: sku,
                        name: name,
                        url_key: urlKey,
                        price: price,
                        weight: row.weight || row.poids || 1,
                        status: 1,
                        visible_individually: 1,
                        attribute_family_id: 1,
                        short_description: name,
                        description: name,
                        channels: [1],
                        categories: [1],
                        locales: ["fr", "en"],
                        fr: { name, url_key: urlKey, description: name, short_description: name },
                        en: { name, url_key: urlKey, description: name, short_description: name },
                        inventories: { "1": qty },
                        new: 1,
                        featured: 1
                    };

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
            setStatus({
                type: successCount > 0 ? "success" : "error",
                message: `${successCount}/${rawData.length} produits importés. Vérifiez la console.`
            });
        } catch (err) {
            setStatus({ type: "error", message: "Erreur critique : " + err.message });
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
            setStatus({ type: "error", message: "Erreur critique : " + err.message });
        } finally {
            setLoading(false);
        }
    };



    const importOrders = async (file) => {
        try {
            setLoading(true);
            setStatus({ type: "info", message: "Lecture du fichier commandes..." });
            const rows = await parseFile(file);

            if (!rows || rows.length === 0) throw new Error("Le fichier est vide.");

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
                            pId = pData.data[0].id;
                            pPrice = parseFloat(pData.data[0].price) || 0;
                            pName = pData.data[0].name || pName;
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
                            
                            // ==============================================================================
                            // SYNCHRONISATION DU STATUT DANS LE BACKEND OFFICIEL BAGISTO (INVOICE, SHIP, CANCEL)
                            // ==============================================================================
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

                                            // Expédition (Shipment) requise uniquement pour completed
                                            if (statusStr === "completed") {
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
                            // ==============================================================================

                            // Sauvegarde des métadonnées (status, date, vrai total) pour l'affichage FrontOffice
                            const existingOrders = JSON.parse(localStorage.getItem('imported_orders_meta') || '[]');
                            existingOrders.push({
                                bagisto_order_id: bagistoOrderId,
                                customer_email: email,
                                status: statusStr,
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
            setStatus({ type: "error", message: "Erreur critique : " + err.message });
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
