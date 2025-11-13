new Vue({
  el: "#app",
  data: {
    sitename: "Lessons WebStore",
    showProduct: true,
    showSortOptions: false,
    selectedSort: null,
    products: [],
    cart: [],
  },
  created() {
    this.fetchLessons();
  },
  methods: {
    async fetchLessons() {
      try {
        const response = await fetch("http://localhost:3000/lessons");
        const data = await response.json();
        this.products = data.map(lesson => ({
          id: lesson.id,
          subject: lesson.topic,
          price: lesson.price,
          location: lesson.location,
          availableItems: lesson.spaces,
          maxItems: lesson.spaces,
          icon: this.getLessonIcon(lesson.topic)
        }));
      } catch (error) {
        console.error("Error fetching lessons:", error);
      }
    },
    getLessonIcon(subject) {
      const icons = {
        Math: "fa-solid fa-calculator",
        English: "fa-solid fa-pen-nib",
        Foodtech: "fa-solid fa-utensils",
        Science: "fa-solid fa-flask",
        Art: "fa-solid fa-palette",
        Business: "fa-solid fa-money-bill-trend-up",
        History: "fa-solid fa-landmark",
        "Religious Studies": "fa-solid fa-person-praying",
        Music: "fa-solid fa-music",
        Law: "fa-solid fa-gavel",
      };
      return icons[subject] || "fa-solid fa-book";
    },
    showCheckout() {
      if (this.cart.length > 0) this.showProduct = false;
    },
    toggleSort() {
      this.showSortOptions = !this.showSortOptions;
      this.selectedSort = null;
    },
    selectSortCategory(category) {
      this.selectedSort = category;
    },
    sortBySubject(order) {
      this.products.sort((a, b) =>
        order === "asc" ? a.subject.localeCompare(b.subject) : b.subject.localeCompare(a.subject)
      );
    },
    sortByLocation(order) {
      this.products.sort((a, b) =>
        order === "asc" ? a.location.localeCompare(b.location) : b.location.localeCompare(a.location)
      );
    },
    sortByPrice(order) {
      this.products.sort((a, b) => (order === "asc" ? a.price - b.price : b.price - a.price));
    },
    sortBySpaces(order) {
      this.products.sort((a, b) =>
        order === "asc" ? a.availableItems - b.availableItems : b.availableItems - a.availableItems
      );
    },
    addItemToTheCart(product) {
      if (product.availableItems > 0) {
        const cartItem = this.cart.find(item => item.id === product.id);
        if (cartItem) cartItem.quantity++;
        else this.cart.push({ id: product.id, quantity: 1 });
        product.availableItems--;
      }
    },
    removeItemFromCart(product) {
      const cartItem = this.cart.find(item => item.id === product.id);
      if (cartItem) {
        cartItem.quantity--;
        product.availableItems++;
        if (cartItem.quantity === 0) {
          this.cart = this.cart.filter(item => item.id !== product.id);
        }
      }
    },
    async storeUser() {
      let firstName = document.getElementById("FirstnameInput").value.trim();
      let phone = document.getElementById("phoneInput").value.trim();
      let email = document.getElementById("EmailInput").value.trim();

      if (!firstName || !phone || !email) {
        document.getElementById("Result").innerHTML = "<b>Please fill in all fields.</b>";
        return;
      }

      const namePattern = /^[A-Za-z\s]+$/;
      if (!namePattern.test(firstName)) {
        document.getElementById("Result").innerHTML = "<b>First name can only contain letters.</b>";
        return;
      }

      if (phone.length !== 11 || isNaN(phone)) {
        document.getElementById("Result").innerHTML = "<b>Please enter a valid 11-digit phone number.</b>";
        return;
      }

      const orderData = { firstName, phone, email, cart: this.checkoutItems };

      try {
        const orderResponse = await fetch("http://localhost:3000/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });
        const data = await orderResponse.json();

        if (data.success) {
          // Update lesson spaces 
          await Promise.all(this.checkoutItems.map(item =>
            fetch(`http://localhost:3000/lessons/${item.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ quantityPurchased: item.quantity }),
            })
          ));

          alert("Order has been submitted");
          this.cart = [];
          document.getElementById("FirstnameInput").value = "";
          document.getElementById("phoneInput").value = "";
          document.getElementById("EmailInput").value = "";
          document.getElementById("Result").innerHTML = "";

          // Refresh lessons to show updated spaces
          this.fetchLessons();
          this.showProduct = true;
        } else {
          document.getElementById("Result").innerHTML = "<b>Error: Could not place order.</b>";
        }
      } catch (error) {
        console.error("Error posting order:", error);
        document.getElementById("Result").innerHTML = "<b>Server error. Please try again.</b>";
      }
    },
  },
  computed: {
    itemsInCart() {
      return this.cart.reduce((total, item) => total + item.quantity, 0);
    },
    checkoutItems() {
      return this.cart.map(cartItem => {
        const product = this.products.find(p => p.id === cartItem.id);
        return { ...product, quantity: cartItem.quantity };
      });
    },
  },
});
