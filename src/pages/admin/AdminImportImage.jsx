import React, { useState } from "react";
import JSZip from "jszip";
import { useNavigate } from "react-router-dom";

export default function AdminImportImage() {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [status, setStatus] = useState(null);
    const [logs, setLogs] = useState([]);
    
    const navigate = useNavigate();
    
    // Helper pour obtenir un token administrateur valide à la volée
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
                    password: "bonjour7"
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.token) {
                    sessionStorage.setItem("bagisto_real_admin_token", data.token);
                    addLog("Authentification automatique réussie avec le serveur Bagisto.", "success");
                    return data.token;
                }
            }
        } catch (e) {
            console.error("Erreur login auto", e);
        }
        
        // Fallback
        const SESSION_TOKEN = sessionStorage.getItem("bagisto_admin_token");
        const DEV_TOKEN = "41|Y8QQW9fezzEnu5uD3VTvuZvIt6uS1yKgqwdXidge18351ff3";
        return (SESSION_TOKEN && SESSION_TOKEN !== "fake_admin_token_for_ui") ? SESSION_TOKEN : DEV_TOKEN;
    };

    const addLog = (msg, type = "info") => {
        setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, type }, ...prev]);
    };

    const handleZipUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setStatus({ type: "info", message: "Lecture du fichier ZIP en cours..." });
        setLogs([]);

        try {
            const token = await getValidAdminToken();
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);
            
            const imageEntries = [];
            contents.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir && relativePath.match(/\.(jpe?g|png|webp|gif)$/i)) {
                    // Ignore les fichiers cachés du Mac (ex: __MACOSX/._sk-l.jpg)
                    if (!relativePath.includes('__MACOSX') && !zipEntry.name.split('/').pop().startsWith('.')) {
                        imageEntries.push(zipEntry);
                    }
                }
            });

            if (imageEntries.length === 0) {
                throw new Error("Aucune image trouvée dans le fichier ZIP.");
            }

            setProgress({ current: 0, total: imageEntries.length });
            setStatus({ type: "info", message: `Traitement de ${imageEntries.length} images...` });

            let successCount = 0;

            for (let i = 0; i < imageEntries.length; i++) {
                const entry = imageEntries[i];
                const filename = entry.name.split('/').pop();
                const sku = filename.substring(0, filename.lastIndexOf('.'));
                const extension = filename.split('.').pop().toLowerCase();
                
                let mimeType = "image/jpeg";
                if (extension === "png") mimeType = "image/png";
                if (extension === "webp") mimeType = "image/webp";
                if (extension === "gif") mimeType = "image/gif";

                try {
                    addLog(`Recherche du produit avec le SKU: ${sku}...`, "info");
                    
                    // 1. Trouver l'ID du produit via le SKU
                    const searchRes = await fetch(`http://localhost:8008/api/v1/admin/catalog/products?sku=${sku}`, {
                        headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
                    });
                    
                    const searchData = await searchRes.json();
                    
                    if (!searchRes.ok || !searchData.data || searchData.data.length === 0) {
                        addLog(`SKU non trouvé: ${sku}`, "error");
                        continue;
                    }

                    const productId = searchData.data[0].id;
                    const product = searchData.data[0];
                    const productName = product.name || sku;
                    const urlKey = product.url_key || sku.toLowerCase();
                    const price = parseFloat(product.price) || 0;
                    const weight = parseFloat(product.weight) || 1;
                    const shortDescription = product.short_description || productName;
                    const description = product.description || productName;

                    addLog(`Produit trouvé (ID: ${productId}, Nom: ${productName}). Préparation de l'upload...`, "success");

                    // 2. Extraire l'image du zip en Blob
                    const blob = await entry.async("blob");
                    const imageFile = new File([blob], filename, { type: mimeType });

                    // 3. Envoyer l'image via l'API Bagisto avec TOUTES les propriétés requises pour passer le validateur
                    const formData = new FormData();
                    formData.append('_method', 'PUT');
                    formData.append('sku', sku);
                    formData.append('name', productName);
                    formData.append('url_key', urlKey);
                    formData.append('price', price);
                    formData.append('weight', weight);
                    formData.append('status', '1');
                    formData.append('visible_individually', '1');
                    formData.append('attribute_family_id', '1');
                    formData.append('short_description', shortDescription);
                    formData.append('description', description);
                    
                    // Relations indispensables
                    formData.append('channels[0]', '1');
                    formData.append('categories[0]', '1');
                    
                    // Traductions obligatoires
                    formData.append('fr[name]', productName);
                    formData.append('fr[url_key]', urlKey);
                    formData.append('fr[short_description]', shortDescription);
                    formData.append('fr[description]', description);
                    
                    formData.append('en[name]', productName);
                    formData.append('en[url_key]', urlKey);
                    formData.append('en[short_description]', shortDescription);
                    formData.append('en[description]', description);

                    // L'image au format attendu par Bagisto
                    formData.append('images[files][0]', imageFile);

                    const uploadRes = await fetch(`http://localhost:8008/api/v1/admin/catalog/products/${productId}`, {
                        method: "POST", // Utilise POST avec _method=PUT dans formData pour supporter le multipart/form-data
                        headers: { 
                            "Accept": "application/json",
                            "Authorization": `Bearer ${token}` 
                        },
                        body: formData
                    });

                    const uploadData = await uploadRes.json();

                    if (uploadRes.ok) {
                        addLog(`Image ${filename} uploadée avec succès sur ${sku}.`, "success");
                        successCount++;
                    } else {
                        addLog(`Erreur upload ${filename}: ${uploadData.message || JSON.stringify(uploadData)}`, "error");
                    }

                } catch (err) {
                    addLog(`Erreur sur l'image ${filename}: ${err.message}`, "error");
                }

                setProgress({ current: i + 1, total: imageEntries.length });
            }

            setStatus({ 
                type: "success", 
                message: `Importation terminée ! ${successCount}/${imageEntries.length} images associées.` 
            });

        } catch (err) {
            console.error("Erreur ZIP JS:", err);
            setStatus({ type: "error", message: "Erreur : " + err.message });
        } finally {
            setLoading(false);
            e.target.value = null; // Reset input
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate("/admin/dashboard")} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                            Importation d'Images
                        </h1>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-1">Version 100% React (JSX)</p>
                    </div>
                </div>
            </header>

            <main className="p-10 flex-grow max-w-4xl mx-auto w-full flex flex-col gap-8">
                {/* Status Box */}
                {status && (
                    <div className={`p-6 rounded-2xl shadow-sm border ${
                        status.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 
                        status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 
                        'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                        <div className="flex items-center gap-3">
                            {status.type === 'info' && <span className="loading loading-spinner loading-sm"></span>}
                            <p className="font-bold">{status.message}</p>
                        </div>
                        {progress.total > 0 && (
                            <div className="mt-4">
                                <div className="flex justify-between text-sm mb-1 font-bold">
                                    <span>Progression</span>
                                    <span>{progress.current} / {progress.total}</span>
                                </div>
                                <div className="w-full bg-black/10 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-300 ${status.type === 'error' ? 'bg-red-500' : status.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}
                                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Upload Card */}
                <div className="p-10 border-4 border-dashed border-gray-300 rounded-[3rem] hover:border-purple-500 hover:bg-purple-50 transition-all group flex flex-col items-center justify-center cursor-pointer relative min-h-[300px] bg-white">
                    <div className="w-24 h-24 bg-purple-100 text-purple-600 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-3 text-center">Glisser-déposer le fichier ZIP</h3>
                    <p className="text-gray-500 text-center text-lg font-medium">Les images doivent porter le même nom que le SKU du produit (ex: <span className="text-purple-600 bg-purple-100 px-2 py-1 rounded">sk-l.jpg</span>)</p>
                    <input 
                        type="file" 
                        accept=".zip" 
                        onChange={(e) => handleZipUpload(e)}
                        disabled={loading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                </div>

                {/* Logs Console */}
                <div className="bg-gray-900 rounded-[2rem] shadow-xl overflow-hidden flex flex-col h-80">
                    <div className="bg-gray-800 px-6 py-4 flex justify-between items-center border-b border-gray-700">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                            Console d'Exécution
                        </h3>
                    </div>
                    <div className="p-6 overflow-y-auto flex-grow font-mono text-sm flex flex-col gap-2">
                        {logs.length === 0 ? (
                            <p className="text-gray-600 text-center italic mt-10">En attente d'importation...</p>
                        ) : (
                            logs.map((log, index) => (
                                <div key={index} className="flex gap-3">
                                    <span className="text-gray-500 whitespace-nowrap">[{log.time}]</span>
                                    <span className={`${
                                        log.type === 'error' ? 'text-red-400' : 
                                        log.type === 'success' ? 'text-green-400' : 
                                        'text-blue-300'
                                    }`}>
                                        {log.type === 'error' && '✗ '}
                                        {log.type === 'success' && '✓ '}
                                        {log.type === 'info' && 'ℹ '}
                                        {log.msg}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
