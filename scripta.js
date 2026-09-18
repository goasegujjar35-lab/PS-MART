// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCobymdd3J8Kr1vaxMh1_ACBAO5ksoCrxA",
    authDomain: "psmart-54692.firebaseapp.com",
    projectId: "psmart-54692",
    storageBucket: "psmart-54692.firebasestorage.app",
    messagingSenderId: "849705500339",
    appId: "1:849705500339:web:492ba5628fa109cec4fac6",
    measurementId: "G-V65VXGLHJK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* =====================================================
   UTILITY FUNCTIONS
   ===================================================== */
function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function escapeAttr(unsafe) {
    return escapeHtml(unsafe);
}

/* =====================================================
   LOGIN / AUTHENTICATION
   ===================================================== */
const loginPage = document.getElementById("loginPage");
const appView = document.getElementById("app");

document.getElementById("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errorMsg = document.getElementById("loginError");

    errorMsg.textContent = "Logging in...";

    try {
        await signInWithEmailAndPassword(auth, email, password);
        errorMsg.textContent = "";
        // onAuthStateChanged will handle UI swap
    } catch (error) {
        errorMsg.textContent = error.message;
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginPage.style.display = "none";
        appView.style.display = "block";
        loadEverything();
    } else {
        loginPage.style.display = "flex";
        appView.style.display = "none";
    }
});

async function logoutAdmin() {
    await signOut(auth);
}

/* =====================================================
   NAVIGATION
   ===================================================== */
const titles = {
    dashboard: "Dashboard", products: "Products", orders: "Orders",
    homepage: "Homepage Settings", store: "Store Settings",
    pages: "Website Pages", social: "Social Links"
};

function showSection(id, btn) {
    document.querySelectorAll(".section").forEach(x => x.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    document.querySelectorAll(".nav button").forEach(x => x.classList.remove("active"));
    if (btn) btn.classList.add("active");
    document.getElementById("pageTitle").textContent = titles[id] || "Admin Panel";
    document.getElementById("sidebar").classList.remove("open");
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("open");
}

/* =====================================================
   LOAD EVERYTHING & DASHBOARD STATS
   ===================================================== */
async function loadEverything() {
    await Promise.all([
        loadProducts(),
        loadOrders(),
        loadSettings('homepage'),
        loadSettings('store'),
        loadSettings('pages'),
        loadSettings('social')
    ]);
}

async function updateDashboard(productsData, ordersData) {
    document.getElementById("totalProducts").textContent = productsData.length;
    document.getElementById("totalOrders").textContent = ordersData.length;
    document.getElementById("pendingOrders").textContent = ordersData.filter(o => o.status === 'Pending').length;
    const sales = ordersData.reduce((sum, o) => sum + Number(o.total || 0), 0);
    document.getElementById("totalSales").textContent = "PKR " + sales.toLocaleString();
}

/* =====================================================
   PRODUCTS (Firebase Firestore)
   ===================================================== */
let globalProducts = [];

async function loadProducts() {
    const table = document.getElementById("productsTable");
    try {
        const q = query(collection(db, "products"), orderBy("created_at", "desc"));
        const snapshot = await getDocs(q);
        globalProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (globalProducts.length === 0) {
            table.innerHTML = `<tr><td colspan="6">No products found.</td></tr>`;
        } else {
            table.innerHTML = globalProducts.map(p => `
            <tr>
                <td>${p.image_url ? `<img class="product-img" src="${escapeAttr(p.image_url)}">` : "—"}</td>
                <td>${escapeHtml(p.name || "")}</td>
                <td>${escapeHtml(p.category || "")}</td>
                <td>PKR ${Number(p.price || 0).toLocaleString()}</td>
                <td>${p.stock ?? 0}</td>
                <td>
                 <button class="btn btn-dark" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&apos;")})'><i class="fa-solid fa-pen"></i></button>
                 <button class="btn btn-danger" onclick="deleteProduct('${p.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
            `).join("");
        }
        updateDashboard(globalProducts, globalOrders);
    } catch (e) {
        console.error("Error loading products:", e);
        table.innerHTML = `<tr><td colspan="6">Failed to load products.</td></tr>`;
    }
}

async function saveProduct() {
    const id = document.getElementById("productId").value;
    const product = {
        name: document.getElementById("pName").value.trim(),
        category: document.getElementById("pCategory").value,
        price: Number(document.getElementById("pPrice").value || 0),
        old_price: Number(document.getElementById("pOldPrice").value || 0) || null,
        stock: Number(document.getElementById("pStock").value || 0),
        sku: document.getElementById("pSku").value.trim() || null,
        image_url: document.getElementById("pImage").value.trim() || null,
        description: document.getElementById("pDescription").value.trim(),
        featured: document.getElementById("pFeatured").checked,
        sale: document.getElementById("pSale").checked,
        updated_at: new Date().toISOString()
    };

    if (!product.name) { alert("Product name required."); return; }

    try {
        if (id) {
            await updateDoc(doc(db, "products", id), product);
            alert("Product updated.");
        } else {
            product.created_at = new Date().toISOString();
            await addDoc(collection(db, "products"), product);
            alert("Product added.");
        }
        clearProductForm();
        loadProducts();
    } catch (e) {
        console.error("Error saving product:", e);
        alert("Failed to save product.");
    }
}

function editProduct(p) {
    document.getElementById("productId").value = p.id;
    document.getElementById("pName").value = p.name || "";
    document.getElementById("pCategory").value = p.category || "Men";
    document.getElementById("pPrice").value = p.price || "";
    document.getElementById("pOldPrice").value = p.old_price || "";
    document.getElementById("pStock").value = p.stock || "";
    document.getElementById("pSku").value = p.sku || "";
    document.getElementById("pImage").value = p.image_url || "";
    document.getElementById("pDescription").value = p.description || "";
    document.getElementById("pFeatured").checked = !!p.featured;
    document.getElementById("pSale").checked = !!p.sale;
    document.getElementById("productFormTitle").textContent = "Edit Product";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    try {
        await deleteDoc(doc(db, "products", id));
        loadProducts();
    } catch (e) {
        console.error("Error deleting product:", e);
        alert("Failed to delete product.");
    }
}

function clearProductForm() {
    document.getElementById("productId").value = "";
    document.getElementById("pName").value = "";
    document.getElementById("pCategory").value = "Men";
    document.getElementById("pPrice").value = "";
    document.getElementById("pOldPrice").value = "";
    document.getElementById("pStock").value = "";
    document.getElementById("pSku").value = "";
    document.getElementById("pImage").value = "";
    document.getElementById("pDescription").value = "";
    document.getElementById("pFeatured").checked = false;
    document.getElementById("pSale").checked = false;
    document.getElementById("productFormTitle").textContent = "Add Product";
}

/* =====================================================
   ORDERS (Firebase Firestore)
   ===================================================== */
let globalOrders = [];

async function loadOrders() {
    const table = document.getElementById("ordersTable");
    try {
        const q = query(collection(db, "orders"), orderBy("created_at", "desc"));
        const snapshot = await getDocs(q);
        globalOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (globalOrders.length === 0) {
            table.innerHTML = `<tr><td colspan="7">No orders found.</td></tr>`;
        } else {
            table.innerHTML = globalOrders.map(o => `
            <tr>
             <td>${escapeHtml(o.customer_name)}</td>
             <td>${escapeHtml(o.phone)}</td>
             <td>PKR ${o.total}</td>
             <td>${escapeHtml(o.payment_method)}</td>
             <td><span class="status">${escapeHtml(o.status)}</span></td>
             <td>${new Date(o.created_at).toLocaleDateString()}</td>
             <td><button class="btn btn-dark btn-sm">View</button></td>
            </tr>
           `).join("");
        }
        updateDashboard(globalProducts, globalOrders);
    } catch (e) {
        table.innerHTML = `<tr><td colspan="7">Ready for orders!</td></tr>`;
    }
}

/* =====================================================
   SETTINGS (Firebase Firestore)
   ===================================================== */
// Configurations for mapping section IDs to input fields
const settingsFields = {
    homepage: [
        'topbarText', 'heroSmall', 'heroTitle', 'heroButton', 'heroImage', 'heroDescription',
        'featuredTitle', 'saleTitle', 'saleDescription',
        { id: 'showCategories', type: 'checkbox' }, { id: 'showFeatured', type: 'checkbox' },
        { id: 'showSale', type: 'checkbox' }, { id: 'showNewsletter', type: 'checkbox' }
    ],
    store: [
        'storeName', 'logoText', 'supportNumber', 'whatsappNumber', 'storeEmail',
        'currency', 'deliveryCharges', 'country', 'storeAddress', 'whatsappMessage',
        { id: 'whatsappEnabled', type: 'checkbox' }
    ],
    pages: ['aboutText', 'shippingText', 'returnText', 'privacyText', 'termsText'],
    social: ['facebook', 'instagram', 'tiktok', 'youtube']
};

async function loadSettings(collectionName) {
    try {
        const docRef = doc(db, "settings", collectionName);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            settingsFields[collectionName].forEach(field => {
                if (typeof field === 'string') {
                    if (document.getElementById(field)) document.getElementById(field).value = data[field] || "";
                } else if (field.type === 'checkbox') {
                    if (document.getElementById(field.id)) document.getElementById(field.id).checked = data[field.id] ?? true;
                }
            });
        }
    } catch (e) {
        console.error(`Error loading ${collectionName} settings:`, e);
    }
}

async function saveSettings(collectionName) {
    const data = {};
    settingsFields[collectionName].forEach(field => {
        if (typeof field === 'string') {
            data[field] = document.getElementById(field).value;
        } else if (field.type === 'checkbox') {
            data[field.id] = document.getElementById(field.id).checked;
        }
    });

    try {
        await setDoc(doc(db, "settings", collectionName), data, { merge: true });
        alert(`${collectionName.toUpperCase()} settings saved successfully!`);
    } catch (e) {
        console.error(`Error saving ${collectionName}:`, e);
        alert(`Failed to save ${collectionName} settings.`);
    }
}

/* =====================================================
   EXPOSE FUNCTIONS TO WINDOW (For inline HTML event listeners)
   ===================================================== */
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.loadEverything = loadEverything;
window.logoutAdmin = logoutAdmin;

window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.clearProductForm = clearProductForm;

window.saveSettings = saveSettings;
