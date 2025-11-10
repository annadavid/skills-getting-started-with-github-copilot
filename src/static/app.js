document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset activity select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;


          // Build participants list DOM (so we can attach unregister handlers)
          const participantsDiv = document.createElement("div");
          participantsDiv.className = "participants";

          const participantsTitle = document.createElement("h5");
          participantsTitle.textContent = "Participants";
          participantsDiv.appendChild(participantsTitle);

          if (Array.isArray(details.participants) && details.participants.length > 0) {
            const ul = document.createElement("ul");
            details.participants.forEach((p) => {
              const li = document.createElement("li");

              const span = document.createElement("span");
              span.className = "participant-email participant-item";
              span.textContent = p;

              const btn = document.createElement("button");
              btn.className = "unregister-btn";
              btn.setAttribute("aria-label", `Unregister ${p} from ${name}`);
              // Use a simple × glyph as the icon
              btn.innerHTML = "&times;";

              // store metadata for handler
              btn.dataset.email = p;
              btn.dataset.activity = name;

              li.appendChild(span);
              li.appendChild(btn);
              ul.appendChild(li);
            });
            participantsDiv.appendChild(ul);
          } else {
            const pNo = document.createElement("p");
            pNo.className = "no-participants";
            pNo.textContent = "No participants yet";
            participantsDiv.appendChild(pNo);
          }

          activityCard.innerHTML = `
            <h4>${escapeHtml(name)}</h4>
            <p>${escapeHtml(details.description)}</p>
            <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          `;

          activityCard.appendChild(participantsDiv);
          activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Helper to escape HTML when inserting user-provided strings
  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities to show the newly added participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Event delegation for unregister buttons
  activitiesList.addEventListener("click", async (e) => {
    const btn = e.target.closest(".unregister-btn");
    if (!btn) return;

    const email = btn.dataset.email;
    const activityName = btn.dataset.activity;

    if (!email || !activityName) return;

    // Optional: confirm
    const ok = confirm(`Unregister ${email} from ${activityName}?`);
    if (!ok) return;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (response.ok) {
        // Show a brief success message
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");

        // Refresh activities list
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Failed to unregister";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }

      setTimeout(() => messageDiv.classList.add("hidden"), 4000);
    } catch (err) {
      console.error("Error unregistering:", err);
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  });

  // Initialize app
  fetchActivities();
});
