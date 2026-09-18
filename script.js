// Import the functions you need from the Firebase SDKs you provided
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";

// Your web app's Firebase configuration
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
const analytics = getAnalytics(app);


// ==========================================
// WEBSITE FRONT-END LOGIC
// ==========================================

const products = [
    {
        id: 1,
        name: "Classic Black Watch",
        category: "Men",
        price: 3499,
        oldPrice: 4499,
        image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 2,
        name: "Luxury Silver Watch",
        category: "Men",
        price: 3999,
        oldPrice: 4999,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 3,
        name: "Elegant Women's Watch",
        category: "Women",
        price: 2999,
        oldPrice: 3999,
        image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 4,
        name: "Premium Couple Set",
        category: "Couple",
        price: 5999,
        oldPrice: 7499,
        image: "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=700&q=80"
    }
];

let cart = [];

function renderProducts() {
    const grid = document.getElementById("productGrid");

    grid.innerHTML = products.map(p => `
        <div class="product">
            <div class="productImg">
                <span class="badge">SALE</span>
                <img src="${p.image}" alt="${p.name}">
            </div>
            <div class="productInfo">
                <small>${p.category}</small>
                <h3>${p.name}</h3>
                <span class="price">Rs. ${p.price.toLocaleString()}</span>
                <span class="old">Rs. ${p.oldPrice.toLocaleString()}</span>
                <button class="add" onclick="addToCart(${p.id})">
                    <i class="fa-solid fa-cart-plus"></i> ADD TO CART
                </button>
            </div>
        </div>
    `).join("");
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    cart.push(product);
    updateCart();
    openCart();
}

function updateCart() {
    document.getElementById("cartCount").textContent = cart.length;

    const items = document.getElementById("cartItems");

    if (cart.length === 0) {
        items.innerHTML = "<p style='color:#777'>Your cart is empty.</p>";
    } else {
        items.innerHTML = cart.map((p, index) => `
            <div class="cartItem">
                <img src="${p.image}">
                <div style="flex:1">
                    <h4>${p.name}</h4>
                    <p style="color:#d71920;margin-top:6px">
                        Rs. ${p.price.toLocaleString()}
                    </p>
                    <button onclick="removeItem(${index})"
                    style="border:0;background:none;color:#999;cursor:pointer;margin-top:5px">
                    <i class="fa-solid fa-trash-can"></i> Remove
                    </button>
                </div>
            </div>
        `).join("");
    }

    const total = cart.reduce((sum, p) => sum + p.price, 0);
    document.getElementById("cartTotal").textContent = "Rs. " + total.toLocaleString();
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCart();
}

function openCart() {
    document.getElementById("cartPanel").classList.add("open");
}

function closeCart() {
    document.getElementById("cartPanel").classList.remove("open");
}

function checkout() {
    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    let message = "Assalam-o-Alaikum, PS MART mein order karna hai:%0A%0A";

    cart.forEach((p, i) => {
        message += (i + 1) + ". " + p.name + " - Rs. " + p.price + "%0A";
    });

    const total = cart.reduce((sum, p) => sum + p.price, 0);

    message += "%0ATotal: Rs. " + total + "%0A%0AMy Name:%0AMy Address:";

    window.open("https://wa.me/923440681490?text=" + message, "_blank");
}

function subscribe(e) {
    e.preventDefault();
    alert("Thank you for subscribing to PS MART!");
    e.target.reset();
}

function focusSearch() {
    alert("Search system will be connected with the Firebase database soon.");
}

// Attach functions to the global 'window' object so they can be accessed 
// directly by the inline HTML onclick="" handlers, because module scope isolates them.
window.addToCart = addToCart;
window.removeItem = removeItem;
window.openCart = openCart;
window.closeCart = closeCart;
window.checkout = checkout;
window.subscribe = subscribe;
window.focusSearch = focusSearch;

// Initialize on page load
renderProducts();
updateCart();
