
//index.js
new Vue({
  el: "#app",
  data: {
    sitename: "Lessons",
    showProduct: true,
    showSortOptions: false,
    selectedSort: null,
    products: [
      { id: "1001", subject: "Math", price: 100, location: "Newport", availableItems: 8, maxItems: 8 },
      { id: "1002", subject: "English", price: 90, location: "London", availableItems: 9, maxItems: 9 },
    ],
    cart: [],
  },
  methods: {
    showCheckout() {
      if (this.cart.length > 0) {
        this.showProduct = false;
      }
    },

    toggleSort() {
      this.showSortOptions = !this.showSortOptions;
      this.selectedSort = null; // reset when closed
    },

    selectSortCategory(category) {
      this.selectedSort = category;
    },

    // subject sorting 
    sortBySubject(order) {
      if (order === 'asc') {
        this.products.sort((a, b) => a.subject.localeCompare(b.subject));
      } else {
        this.products.sort((a, b) => b.subject.localeCompare(a.subject));
      }
    },

    // location sorting 
    sortByLocation(order) {
      if (order === 'asc') {
        this.products.sort((a, b) => a.location.localeCompare(b.location));
      } else {
        this.products.sort((a, b) => b.location.localeCompare(a.location));
      }
    },

    // price Sorting 
    sortByPrice(order) {
      if (order === 'asc') {
        this.products.sort((a, b) => a.price - b.price);
      } else {
        this.products.sort((a, b) => b.price - a.price);
      }
    },

    // space Sorting 
    sortBySpaces(order) {
      if (order === 'asc') {
        this.products.sort((a, b) => a.availableItems - b.availableItems);
      } else {
        this.products.sort((a, b) => b.availableItems - a.availableItems);
      }
    },

    addItemToTheCart(product) {
      if (product.availableItems > 0) {
        this.cart.push(product.id);
        product.availableItems--;
      }
    },

    removeItemFromCart(product) {
      for (let i = 0; i < this.cart.length; i++) {
        if (this.cart[i] === product.id) {
          this.cart.splice(i, 1);
          product.availableItems++;
          break;
        }
      }
    },

    // Store and validate user info
    storeUser() {
      let firstName = document.getElementById("FirstnameInput").value.trim();
      let phone = document.getElementById("phoneInput").value.trim();
      let email = document.getElementById("EmailInput").value.trim();

      let missingFields = [];

      if (firstName === "") missingFields.push("First name");
      if (phone === "") missingFields.push("Phone number");
      if (email === "") missingFields.push("Email");

      if (missingFields.length > 0) {
        document.getElementById("Result").innerHTML =
          "<b>Please fill in the following fields: " + missingFields.join(", ") + ".</b>";
        return;
      }

      // Validate phone number
      if (phone.length !== 11 || isNaN(phone)) {
        document.getElementById("Result").innerHTML =
          "<b>Please enter a valid 11-digit phone number.</b>";
        return;
      }

      // Clear any previous message
      document.getElementById("Result").innerHTML = "";

      //Check
      alert("order has been submitted!");

      //clear fields after success
      document.getElementById("FirstnameInput").value = "";
      document.getElementById("phoneInput").value = "";
      document.getElementById("EmailInput").value = "";
    }
  },
  computed: {
    itemsInCart() {
      return this.cart.length;
    },
    checkoutItems() {
      return this.products.filter(product => this.cart.includes(product.id));
    },
  },

});