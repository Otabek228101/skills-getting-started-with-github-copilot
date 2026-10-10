document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (details.participants.length) {
          details.participants.forEach((participant) => {
            const participantItem = document.createElement("li");
            participantItem.className = "participant-item";

            const participantLabel = document.createElement("span");
            participantLabel.textContent = participant;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "participant-remove";
            removeButton.title = `Unregister ${participant}`;
            removeButton.setAttribute("aria-label", `Unregister ${participant}`);
            removeButton.innerHTML = "🗑️";

            removeButton.addEventListener("click", async () => {
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participant)}`,
                  {
                    method: "DELETE",
                  }
                );

                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Unable to unregister participant.");
                }

                showMessage(result.message, "success");
                await fetchActivities();
              } catch (error) {
                showMessage(error.message || "Failed to unregister participant.", "error");
              }
            });

            participantItem.append(participantLabel, removeButton);
            participantsList.appendChild(participantItem);
          });
        } else {
          const emptyState = document.createElement("p");
          emptyState.className = "no-participants";
          emptyState.textContent = "No participants yet.";
          participantsList.appendChild(emptyState);
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantSection = document.createElement("div");
        participantSection.className = "participants-section";
        participantSection.innerHTML = "<strong>Participants:</strong>";
        participantSection.appendChild(participantsList);
        activityCard.appendChild(participantSection);

        activitiesList.appendChild(activityCard);

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

      if (!response.ok) {
        throw new Error(result.detail || "An error occurred");
      }

      await fetchActivities();
      showMessage(result.message, "success");
      signupForm.reset();
    } catch (error) {
      showMessage(error.message || "Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  fetchActivities();
});
