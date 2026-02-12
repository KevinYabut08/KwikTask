// ================= STRIPE - PRODUCTION READY =================
async function startCheckout() {
  const user = auth.currentUser;
  if (!user) return alert("Please log in first");

  try {
    // Show loading state
    const stripeBtn = document.getElementById("stripeCheckoutBtn");
    const originalText = stripeBtn.innerHTML;
    stripeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> redirecting...';
    stripeBtn.disabled = true;

    // ✅ Use your actual Vercel API endpoint
    const response = await fetch("https://kwik-task.vercel.app/api/create-checkout-session", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        uid: user.uid, 
        email: user.email 
      }),
    });

    const session = await response.json();
    
    if (!response.ok) {
      throw new Error(session.error || "Failed to create checkout session");
    }

    // Redirect to Stripe Checkout
    const stripe = Stripe("pk_test_51SzautGqBhYoGeXbv4LSy6PQVpfO2oPzexUMoCAijD9ELFMtKxn6AjFgEaQkgQg24h2q4aZC3DTRzKhT8kBSOLhD00jpeLGhhk");
    const { error } = await stripe.redirectToCheckout({
      sessionId: session.id
    });

    if (error) {
      throw error;
    }
  } catch (err) {
    console.error("Checkout error:", err);
    alert("Failed to start checkout. Please try again.");
    
    // Reset button
    const stripeBtn = document.getElementById("stripeCheckoutBtn");
    stripeBtn.innerHTML = '<i class="fab fa-stripe"></i> subscribe now';
    stripeBtn.disabled = false;
  }
}