new Vue({
  el: "#app",
  data: {
    sitename: "Lessons ",
    showProduct: true,
    showSortOptions: false,
    selectedSort: null,
    products: [],
    cart: [],
    searchQuery: "",
  },

  created() {
    // Fetch lessons once Vue instance is created
    this.fetchLessons();
  },
  methods: {
    // Fetch all lessons from the backend
    async fetchLessons() {
      try {
        const response = await fetch("http://localhost:3000/lessons");
        const data = await response.json();
        // Lessons format for frontend
        this.products = data.map(lesson => ({
          id: lesson.id,
          subject: lesson.topic,
          price: lesson.price,
          location: lesson.location,
          availableItems: lesson.spaces, // Remaining spaces
          maxItems: lesson.spaces, // Maximum available spaces
          icon: this.getLessonIcon(lesson.topic) // Font Awesome icon
        }));
      } catch (error) {
        console.error("Error fetching lessons:", error);
      }
    },

    // Search lessons based on user query
    async performSearch() {
      if (!this.searchQuery.trim()) {
        // If search box is empty, return all lessons again
        this.fetchLessons();
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/search?query=${encodeURIComponent(this.searchQuery)}`
        );
        const results = await response.json();

        // Search results for product format
        this.products = results.map(lesson => ({
          id: lesson.id,
          subject: lesson.topic,
          price: lesson.price,
          location: lesson.location,
          availableItems: lesson.spaces,
          maxItems: lesson.spaces,
          icon: this.getLessonIcon(lesson.topic)
        }));
      } catch (err) {
        console.error("Search error:", err);
      }
    },

    // Assigned Font Awesome icon to each lesson
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
      return icons[subject] || "fa-solid fa-book"; // Default icon
    },

    // Show checkout page if cart has items
    showCheckout() {
      if (this.cart.length > 0) this.showProduct = false;
    },

    // Toggle visibility of sort options
    toggleSort() {
      this.showSortOptions = !this.showSortOptions;
      this.selectedSort = null;
    },

    // The selected sort category
    selectSortCategory(category) {
      this.selectedSort = category;
    },

    // Sort products by subject
    sortBySubject(order) {
      this.products.sort((a, b) =>
        order === "asc" ? a.subject.localeCompare(b.subject) : b.subject.localeCompare(a.subject)
      );
    },

    // Sort products by location
    sortByLocation(order) {
      this.products.sort((a, b) =>
        order === "asc" ? a.location.localeCompare(b.location) : b.location.localeCompare(a.location)
      );
    },

    // Sort products by price
    sortByPrice(order) {
      this.products.sort((a, b) => (order === "asc" ? a.price - b.price : b.price - a.price));
    },

    // Sort products by available spaces
    sortBySpaces(order) {
      this.products.sort((a, b) =>
        order === "asc" ? a.availableItems - b.availableItems : b.availableItems - a.availableItems
      );
    },

    // Add lesson to cart and reduce available spaces
    addItemToTheCart(product) {
      if (product.availableItems > 0) {
        const cartItem = this.cart.find(item => item.id === product.id);
        if (cartItem) cartItem.quantity++;
        else this.cart.push({ id: product.id, quantity: 1 });
        product.availableItems--;
      }
    },

    // Remove lesson from cart and increase available spaces
    removeItemFromCart(product) {
      const cartItem = this.cart.find(item => item.id === product.id);
      if (cartItem) {
        cartItem.quantity--;
        product.availableItems++;
        // Remove item from cart if reaches 0
        if (cartItem.quantity === 0) {
          this.cart = this.cart.filter(item => item.id !== product.id);
        }
      }
    },

    // Submit user info and cart to backend
    async storeUser() {
      let firstName = document.getElementById("FirstnameInput").value.trim();
      let phone = document.getElementById("phoneInput").value.trim();
      let email = document.getElementById("EmailInput").value.trim();

        // Validate inputs
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
         // Post order to backend
        const orderResponse = await fetch("http://localhost:3000/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });
        const data = await orderResponse.json();

        if (data.success) {
           // Update lesson spaces in backend for each item purchased
          await Promise.all(this.checkoutItems.map(item =>
            fetch(`http://localhost:3000/lessons/${item.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ quantityPurchased: item.quantity }),
            })
          ));

          // Reset cart and form
          alert("Order has been submitted");
          this.cart = [];
          document.getElementById("FirstnameInput").value = "";
          document.getElementById("phoneInput").value = "";
          document.getElementById("EmailInput").value = "";
          document.getElementById("Result").innerHTML = "";

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
    // Check total items in cart
    itemsInCart() {
      return this.cart.reduce((total, item) => total + item.quantity, 0);
    },

    // Checkout items with product details and quantity
    checkoutItems() {
      return this.cart.map(cartItem => {
        const product = this.products.find(p => p.id === cartItem.id);
        return { ...product, quantity: cartItem.quantity };
      });
    },
  },
});
