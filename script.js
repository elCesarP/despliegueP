// script.js (CORREGIDO)

const products = [
  {
    name: "Camiseta Roja",
    price: 19.99, // Precio final con IVA
    image: "https://via.placeholder.com/200x150/ff4444/ffffff?text=Camiseta",
    taxRate: 0.12 // Asumimos una tasa de impuesto del 12% para ejemplo
  },
  {
    name: "Zapatos Negros",
    price: 49.99, // Precio final con IVA
    image: "https://via.placeholder.com/200x150/333333/ffffff?text=Zapatos",
    taxRate: 0.12
  },
  {
    name: "Gorra Azul",
    price: 14.99, // Precio final con IVA
    image: "https://via.placeholder.com/200x150/008cba/ffffff?text=Gorra",
    taxRate: 0.12
  }
];

const productListContainer = document.getElementById('product-list');
const cartList = document.getElementById('cart');
const ppButtonContainer = document.getElementById('pp-button-container'); 
const checkoutButton = document.getElementById('checkout-button'); 

let cart = []; 

// --- CONFIGURACIÓN DE PAYPHONE (¡IMPORTANTE! REEMPLAZA CON TUS CREDENCIALES REALES) ---
const PAYPHONE_TOKEN = 'xsS6ZwzYvyVhTgYVit33hV_U7IHn6R_8RqmuAkTJQ0tUupLLiHjINtBGU7SCBuVz_SeU32NME8RVC_eXWkJeu2c3O1MapUDOuYEWgaJ60qcecnSQMEwW4V9AugwEfQbBXsXzh8f9_SM569M4tLn4qakWUz9jdAQRo4uhaeNRd4diVXQm2I9EXI6oG_0pPcQflB7Nsjx66t5yDjRihTNsmqVHR9rQZ4IV6S8b5MkVBuYrMIuKzEAmT0o9RwmsBKXPA_yNYsqhd-2NRNmooE8i-LMDVxc3Ww7a3BtGO9Wpe1cD6VNxzz45h_ASWw6g-bTA4OBCy_6VHpN_HPyQ6NnJAfLX3hU'; 
const PAYPHONE_STORE_ID = '01158883-d925-43cd-8d39-38150818a199'; 

// --- Funciones del Carrito ---
function updateCart() {
    cartList.innerHTML = "";
    if (cart.length === 0) {
        cartList.innerHTML = "<li>El carrito está vacío.</li>";
        checkoutButton.disabled = true;
    } else {
        cart.forEach((item) => {
            const li = document.createElement("li");
            li.textContent = `${item.name} - $${item.price.toFixed(2)}`;
            cartList.appendChild(li);
        });
        checkoutButton.disabled = false;
    }
    ppButtonContainer.innerHTML = '';
}

// --- Renderizado de Productos ---
products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h2>${product.name}</h2>
        <p>Precio: $${product.price.toFixed(2)}</p>
        <button>Añadir al carrito</button>
    `;

    const button = card.querySelector('button');
    button.addEventListener('click', () => {
        cart.push(product);
        updateCart(); 
    });

    productListContainer.appendChild(card);
});

// --- Lógica para la Cajita de Pagos de Payphone ---
function calculateCartTotals() {
    let totalAmountFinalCents = 0;         // Será 'amount'
    let amountWithTaxCents = 0;            // Será 'amountWithTax' (base imponible de productos gravados)
    let amountWithoutTaxCents = 0;         // Será 'amountWithoutTax' (monto de productos exentos de IVA)
    let taxAmountCents = 0;                // Será 'tax'

    cart.forEach(item => {
        // Precio final del ítem en centavos (ej: 19.99 * 100 = 1999)
        const itemPriceFullInCents = Math.round(item.price * 100); 
        if (item.taxRate > 0) {
            // Calcular la base imponible del ítem (precio sin IVA)
            // ej: 1999 / (1 + 0.12) = 1784.82 -> redondeado 1785
            const itemBaseInCents = Math.round(itemPriceFullInCents / (1 + item.taxRate));
            
            // Calcular el impuesto para este ítem
            // ej: 1999 - 1785 = 214
            const itemTax = itemPriceFullInCents - itemBaseInCents;
            
            amountWithTaxCents += itemBaseInCents; // Sumamos a la base imponible gravada
            taxAmountCents += itemTax;              // Sumamos al total de impuestos
        } else {
            // Si el producto no tiene impuesto (es exento)
            amountWithoutTaxCents += itemPriceFullInCents; // Sumamos al total sin impuesto
        }
        totalAmountFinalCents += itemPriceFullInCents; // Siempre sumamos al total final
    });

    // Validar que la suma de componentes sea igual al total (requisito de Payphone)
    // La fórmula oficial de Payphone es:
    // amount = amountWithoutTax + amountWithTax + tax + service + tip
    const service = 0; // Por ahora, sin servicio
    const tip = 0;     // Por ahora, sin propina

    const sumOfAllComponents = amountWithoutTaxCents + amountWithTaxCents + taxAmountCents + service + tip;

    // Aseguramos que el total final cuadre con la suma de los componentes.
    // Si hay una diferencia de centavos por redondeo, ajustamos el impuesto.
    // Esto es CRUCIAL para evitar el error "El campo Amount no es igual..."
    if (sumOfAllComponents !== totalAmountFinalCents) {
        // Si no cuadra, ajustamos el impuesto para que la suma sea exacta.
        // La diferencia de un centavo suele ir en el impuesto.
        taxAmountCents = totalAmountFinalCents - (amountWithoutTaxCents + amountWithTaxCents + service + tip);
    }

    return {
        totalAmount: totalAmountFinalCents,
        amountWithoutTax: amountWithoutTaxCents,
        amountWithTax: amountWithTaxCents, 
        taxAmount: taxAmountCents,
        service: service, 
        tip: tip      
    };
}


// Función que se llama al hacer clic en el botón "Pagar con PayPhone"
checkoutButton.addEventListener('click', () => {
    if (cart.length === 0) {
        alert("Por favor, agrega productos al carrito antes de pagar.");
        return;
    }

    ppButtonContainer.innerHTML = ''; 

    const { totalAmount, amountWithoutTax, amountWithTax, taxAmount, service, tip } = calculateCartTotals();

    // --- INICIO DE DEPURACIÓN CRÍTICA ---
    console.log("--- DEBUG DE MONTOS PARA PAYPHONE ---");
    console.log("TOKEN:", PAYPHONE_TOKEN.substring(0, 10) + "..."); 
    console.log("STORE_ID:", PAYPHONE_STORE_ID);
    console.log("amount:", totalAmount);
    console.log("amountWithoutTax:", amountWithoutTax);
    console.log("amountWithTax:", amountWithTax);
    console.log("tax:", taxAmount);
    console.log("service:", service);
    console.log("tip:", tip);
    
    const sumaComponentesConsola = amountWithoutTax + amountWithTax + taxAmount + service + tip;
    console.log("Suma de componentes (centavos para consola):", sumaComponentesConsola);
    console.log("¿Suma de componentes === amount (para consola)?", sumaComponentesConsola === totalAmount);
    console.log("Diferencia (si existe, para consola):", totalAmount - sumaComponentesConsola);
    console.log("--- FIN DEBUG DE MONTOS PARA PAYPHONE ---");
    // --- FIN DEPURACIÓN ---

    const clientTransactionId = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    if (typeof PPaymentButtonBox === 'function') {
        try {
            new PPaymentButtonBox({
                token: PAYPHONE_TOKEN,
                clientTransactionId: clientTransactionId,
                amount: totalAmount,         
                amountWithoutTax: amountWithoutTax, 
                amountWithTax: amountWithTax,   
                tax: taxAmount,                 
                service: service,
                tip: tip,
                currency: "USD",
                storeId: PAYPHONE_STORE_ID,
                reference: "Compra de productos en el catálogo web",
                lang: "es", 
                defaultMethod: "card", 
                timeZone: -5, 
            }).render('pp-button-container');

        } catch (error) {
            console.error("Error al inicializar la Cajita de Pagos de Payphone:", error);
            ppButtonContainer.innerHTML = `
                <p style="color: red;">
                    Error al cargar el botón de pago. Por favor, revisa la consola para más detalles.
                    Asegúrate que tu TOKEN y StoreID son correctos y que tu dominio está autorizado en Payphone Developer.
                </p>`;
        }
    } else {
        ppButtonContainer.innerHTML = `
            <p style="color: red;">
                El SDK de Payphone (payphone-payment-box.js) no está disponible.
                Verifica la URL en el <head> de tu HTML.
            </p>`;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    updateCart(); 
});