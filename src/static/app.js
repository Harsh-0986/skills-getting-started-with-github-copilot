document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function renderActivities(activities) {
    activitiesList.replaceChildren();
    activitySelect.length = 1;

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;
      const heading = document.createElement("h4");
      heading.textContent = name;
      activityCard.append(heading);

      const description = document.createElement("p");
      description.textContent = details.description;
      activityCard.append(
        description,
        createActivityDetail("Schedule:", details.schedule),
        createActivityDetail("Availability:", `${spotsLeft} spots left`)
      );

      const participantsSection = document.createElement("section");
      participantsSection.className = "participants-section";
      const participantsHeading = document.createElement("h5");
      participantsHeading.textContent = "Participants";
      participantsSection.append(participantsHeading);

      if (details.participants.length > 0) {
        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";
        details.participants.forEach((participant) => {
          const listItem = document.createElement("li");
          const participantEmail = document.createElement("span");
          participantEmail.textContent = participant;
          listItem.append(participantEmail);

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "participant-remove-button";
          removeButton.setAttribute("aria-label", `Remove ${participant} from ${name}`);
          removeButton.title = `Remove ${participant}`;
          removeButton.dataset.activity = name;
          removeButton.dataset.participant = participant;
          removeButton.innerHTML = `
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round">
              <path d="M3 6h18"></path>
              <path d="M8 6V4h8v2"></path>
              <path d="m19 6-1 14H6L5 6"></path>
              <path d="M10 11v5M14 11v5"></path>
            </svg>
          `;
          listItem.append(removeButton);
          participantsList.append(listItem);
        });
        participantsSection.append(participantsList);
      } else {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "participants-empty";
        emptyMessage.textContent = "No participants yet";
        participantsSection.append(emptyMessage);
      }

      activityCard.append(participantsSection);
      activitiesList.append(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.append(option);
    });
  }

  function createActivityDetail(label, value) {
    const detail = document.createElement("p");
    const labelElement = document.createElement("strong");
    labelElement.textContent = `${label} `;
    detail.append(labelElement, document.createTextNode(value));
    return detail;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to fetch activities (${response.status})`);
      }
      const activities = await response.json();

      renderActivities(activities);
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove-button");
    if (!removeButton) {
      return;
    }

    const { activity, participant } = removeButton.dataset;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(participant)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Unable to remove participant");
      }

      messageDiv.textContent = result.message;
      messageDiv.className = "success";
      await fetchActivities();
    } catch (error) {
      messageDiv.textContent = error.message || "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      console.error("Error removing participant:", error);
    }

    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  });

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
        await fetchActivities();
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

  // Initialize app
  fetchActivities();
});
