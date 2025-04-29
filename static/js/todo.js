// Initialize task arrays
let todayTasks = []
let tomorrowTasks = []
let upcomingTasks = []
const selectedTaskId = null

// Format and display today's date
function formatDate(date) {
  const options = { year: "numeric", month: "long", day: "numeric" }
  return date.toLocaleDateString("en-US", options)
}

// Count total tasks
function countTotalTasks() {
  return todayTasks.length + tomorrowTasks.length + upcomingTasks.length
}

// Check if task limit reached
function isTaskLimitReached() {
  return countTotalTasks() >= 5
}

// Generate unique ID for tasks
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Render all tasks
function renderTasks() {
  renderTaskList("today", todayTasks)
  renderTaskList("tomorrow", tomorrowTasks)
  renderTaskList("upcoming", upcomingTasks)
}

// Render a specific task list
function renderTaskList(type, tasks) {
  const listElement = document.getElementById(`${type}-tasks`)
  listElement.innerHTML = ""

  if (tasks.length === 0) {
    listElement.innerHTML = `<li class="p-6 text-center text-gray-500">No tasks for ${type}. Click the + button to add.</li>`
    return
  }

  tasks.forEach((task, index) => {
    const li = document.createElement("li")
    li.className = "flex items-center justify-between"
    li.dataset.id = task.id
    li.innerHTML = `
      <div class="flex items-center">
        <input type="checkbox" id="${type}-task-${index}" 
          class="w-6 h-6 appearance-none border-2 border-gray-300 rounded-full 
          checked:bg-[#8491D3] checked:border-transparent focus:outline-none relative"
          ${task.completed ? "checked" : ""}>
        <label for="${type}-task-${index}" class="ml-3 text-gray-800">
          <span class="task-text">${task.text}</span>
          ${type === "upcoming" ? `<span class="text-xs text-gray-500 ml-2">(${task.date})</span>` : ""}
        </label>
      </div>
      <button type="button" class="delete-btn hidden hover:text-red-700 leading-none" data-id="${task.id}">
        <i class="fa-solid fa-trash text-red-500 text-xl"></i>
      </button>
    `
    listElement.appendChild(li)

    // Add event listener for checkbox
    const checkbox = li.querySelector('input[type="checkbox"]')
    checkbox.addEventListener("change", () => {
      const taskIndex = tasks.findIndex((t) => t.id === li.dataset.id)
      if (taskIndex !== -1) {
        tasks[taskIndex].completed = checkbox.checked
      }
    })
  })
}

// Helper function to check if two dates are the same day
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

// Format date for display in upcoming tasks (e.g., "May 1")
function formatShortDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// Set up event listeners
function setupEventListeners() {
  // Display today's date
  document.getElementById("todaysDate").textContent = `Today's date: ${formatDate(new Date())}`

  // Edit mode functionality
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card")
      const isEditing = card.classList.toggle("editing")
      btn.textContent = isEditing ? "Done" : "Edit"

      const todos = card.querySelectorAll("li")
      todos.forEach((todo) => {
        const label = todo.querySelector("label")
        const checkbox = todo.querySelector('input[type="checkbox"]')
        const deleteBtn = todo.querySelector(".delete-btn")

        if (isEditing) {
          label.setAttribute("contenteditable", "true") // Allow editing
          checkbox.disabled = true // Disable checkbox
          deleteBtn.classList.remove("hidden") // Show delete button
        } else {
          label.removeAttribute("contenteditable") // Stop editing
          checkbox.disabled = false // Enable checkbox
          deleteBtn.classList.add("hidden") // Hide delete button
        }
      })
    })
  })

  // Delete task
  document.addEventListener("click", (e) => {
    if (e.target.closest(".delete-btn")) {
      const deleteBtn = e.target.closest(".delete-btn")
      const taskId = deleteBtn.dataset.id

      // Remove from todayTasks
      todayTasks = todayTasks.filter((task) => task.id !== taskId)
      // Remove from tomorrowTasks
      tomorrowTasks = tomorrowTasks.filter((task) => task.id !== taskId)
      // Remove from upcomingTasks
      upcomingTasks = upcomingTasks.filter((task) => task.id !== taskId)

      renderTasks()
    }
  })

  // Modal functionality
  document.getElementById("openAddTodo").addEventListener("click", () => {
    if (isTaskLimitReached()) {
      document.getElementById("premiumUpgradeModal").classList.remove("hidden")
      document.getElementById("premiumUpgradeModal").classList.add("flex")
      return
    }
    document.getElementById("addTodoModal").classList.remove("hidden")
    document.getElementById("newTodoText").focus()
  })

  document.getElementById("cancelAddTodo").addEventListener("click", () => {
    document.getElementById("addTodoModal").classList.add("hidden")
    document.getElementById("newTodoText").value = ""
    document.getElementById("newTodoDate").value = ""
  })

  // Close premium modal
  document.getElementById("closePremiumModal").addEventListener("click", () => {
    document.getElementById("premiumUpgradeModal").classList.add("hidden")
    document.getElementById("premiumUpgradeModal").classList.remove("flex")
  })

  // Upgrade premium button
  document.getElementById("upgradePremiumBtn").addEventListener("click", () => {
    document.getElementById("premiumUpgradeModal").classList.add("hidden")
    document.getElementById("premiumUpgradeModal").classList.remove("flex")
    alert("Redirecting to premium upgrade page...")
  })

  // Save new task
  document.getElementById("saveAddTodo").addEventListener("click", () => {
    const text = document.getElementById("newTodoText").value.trim()
    const selectedDate = document.getElementById("newTodoDate").value

    if (!text || !selectedDate) {
      alert("Please enter a task and select a date.")
      return
    }

    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)

    const inputDate = new Date(selectedDate)
    today.setHours(0, 0, 0, 0)
    tomorrow.setHours(0, 0, 0, 0)
    inputDate.setHours(0, 0, 0, 0)

    const newTask = {
      id: generateId(),
      text: text,
      completed: false,
      date: selectedDate, // Store the date string for all tasks
    }

    // Determine which list to add the task to
    if (isSameDay(inputDate, today)) {
      todayTasks.push(newTask)
    } else if (isSameDay(inputDate, tomorrow)) {
      tomorrowTasks.push(newTask)
    } else {
      // Format the date for display in upcoming tasks
      const formattedDate = formatShortDate(inputDate)
      newTask.date = formattedDate
      upcomingTasks.push(newTask)
    }

    renderTasks()

    // Reset modal
    document.getElementById("addTodoModal").classList.add("hidden")
    document.getElementById("newTodoText").value = ""
    document.getElementById("newTodoDate").value = ""
  })
}

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  // Set current date
  const currentDate = new Date()
  const dateOptions = { year: "numeric", month: "long", day: "numeric" }
  document.getElementById("todaysDate").textContent =
    `Today's date: ${currentDate.toLocaleDateString("en-US", dateOptions)}`

  // Modal functionality
  const addModal = document.getElementById("addTodoModal")
  const editModal = document.getElementById("editTasksModal")
  const deleteModal = document.getElementById("deleteConfirmationModal")
  const openAddModalBtn = document.getElementById("openAddTodo")
  const cancelAddBtn = document.getElementById("cancelAddTodo")
  const addForm = document.getElementById("addTodoForm")
  const editForm = document.getElementById("editTaskForm")
  const taskSelect = document.getElementById("taskSelect")
  const noTaskSelected = document.getElementById("noTaskSelected")
  const editModalCloseBtn = document.getElementById("editModalCloseBtn")
  const editTasksBtn = document.getElementById("editTasksBtn")
  const cancelEditBtn = document.getElementById("cancelEditTask")
  const deleteTaskBtn = document.getElementById("deleteTaskBtn")
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn")
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn")

  // Tasks data
  let todayTasks = []
  let tomorrowTasks = []
  let upcomingTasks = []
  let selectedTaskId = null

  const premiumModal = document.getElementById("premiumUpgradeModal")
  const closePremiumBtn = document.getElementById("closePremiumModal")
  const upgradePremiumBtn = document.getElementById("upgradePremiumBtn")

  // Close premium modal
  function closePremiumModal() {
    premiumModal.classList.add("hidden")
    premiumModal.classList.remove("flex")
  }

  closePremiumBtn.addEventListener("click", closePremiumModal)
  upgradePremiumBtn.addEventListener("click", () => {
    alert("This would redirect to the premium upgrade page.")
    closePremiumModal()
  })

  // Close modal when clicking outside
  premiumModal.addEventListener("click", (e) => {
    if (e.target === premiumModal) {
      closePremiumModal()
    }
  })

  // Count total tasks
  function countTotalTasks() {
    return todayTasks.length + tomorrowTasks.length + upcomingTasks.length
  }

  // Check if task limit reached
  function isTaskLimitReached() {
    return countTotalTasks() >= 5
  }

  // Open add modal
  openAddModalBtn.addEventListener("click", () => {
    // Check task count
    if (isTaskLimitReached()) {
      premiumModal.classList.remove("hidden")
      premiumModal.classList.add("flex")
    } else {
      addModal.classList.remove("hidden")
      addModal.classList.add("flex")

      // Set default date to today
      const today = new Date()
      const formattedDate = today.toISOString().split("T")[0]
      document.getElementById("newTodoDate").value = formattedDate
    }
  })

  // Close add modal
  function closeAddModal() {
    addModal.classList.add("hidden")
    addModal.classList.remove("flex")
    addForm.reset()
  }

  cancelAddBtn.addEventListener("click", closeAddModal)

  // Close modal when clicking outside
  addModal.addEventListener("click", (e) => {
    if (e.target === addModal) {
      closeAddModal()
    }
  })

  // Open edit modal
  editTasksBtn.addEventListener("click", () => {
    populateTaskSelect()
    editModal.classList.remove("hidden")
    editModal.classList.add("flex")
  })

  // Close edit modal
  function closeEditModal() {
    editModal.classList.add("hidden")
    editModal.classList.remove("flex")
    editForm.classList.add("hidden")
    noTaskSelected.classList.remove("hidden")
    selectedTaskId = null
  }

  editModalCloseBtn.addEventListener("click", closeEditModal)
  cancelEditBtn.addEventListener("click", closeEditModal)

  // Close modal when clicking outside
  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) {
      closeEditModal()
    }
  })

  // Open delete confirmation modal
  deleteTaskBtn.addEventListener("click", (e) => {
    e.preventDefault()
    deleteModal.classList.remove("hidden")
    deleteModal.classList.add("flex")
  })

  // Close delete confirmation modal
  function closeDeleteModal() {
    deleteModal.classList.add("hidden")
    deleteModal.classList.remove("flex")
  }

  cancelDeleteBtn.addEventListener("click", closeDeleteModal)

  // Close modal when clicking outside
  deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) {
      closeDeleteModal()
    }
  })

  // Generate unique ID for tasks
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Populate task select dropdown
  function populateTaskSelect() {
    // Clear existing options except the first one
    while (taskSelect.options.length > 1) {
      taskSelect.remove(1)
    }

    // Add all tasks to select
    const allTasks = [...todayTasks, ...tomorrowTasks, ...upcomingTasks]
    allTasks.forEach((task) => {
      const option = document.createElement("option")
      option.value = task.id
      option.textContent = `${task.text} (${formatShortDate(new Date(task.date))})`
      taskSelect.appendChild(option)
    })
  }

  // Handle task selection
  taskSelect.addEventListener("change", function () {
    const selectedId = this.value

    if (selectedId) {
      selectedTaskId = selectedId
      const allTasks = [...todayTasks, ...tomorrowTasks, ...upcomingTasks]
      const task = allTasks.find((t) => t.id === selectedId)

      if (task) {
        // Fill form with task data
        editForm.elements.text.value = task.text
        editForm.elements.date.value = task.date

        // Show form, hide message
        editForm.classList.remove("hidden")
        noTaskSelected.classList.add("hidden")
        editModalCloseBtn.classList.add("hidden")
      }
    } else {
      // Hide form, show message
      editForm.classList.add("hidden")
      noTaskSelected.classList.remove("hidden")
      editModalCloseBtn.classList.remove("hidden")
      selectedTaskId = null
    }
  })

  // Confirm delete
  confirmDeleteBtn.addEventListener("click", () => {
    if (selectedTaskId) {
      // Remove from task arrays
      todayTasks = todayTasks.filter((task) => task.id !== selectedTaskId)
      tomorrowTasks = tomorrowTasks.filter((task) => task.id !== selectedTaskId)
      upcomingTasks = upcomingTasks.filter((task) => task.id !== selectedTaskId)

      // Close modals
      closeDeleteModal()
      closeEditModal()

      // Clear the selected task ID
      selectedTaskId = null

      // Re-render tasks
      renderTasks()

      // Save to local storage
      saveTasksToLocalStorage()
    }
  })

  // Handle form submission for adding task
  addForm.addEventListener("submit", (e) => {
    e.preventDefault()

    const formData = new FormData(addForm)
    const task = {
      id: generateId(),
      text: formData.get("text"),
      date: formData.get("date"),
      completed: false,
    }

    // Add task to appropriate array
    addTaskToCorrectArray(task)

    // Re-render tasks
    renderTasks()

    // Save to local storage
    saveTasksToLocalStorage()

    // Close modal and reset form
    closeAddModal()
  })

  // Handle form submission for editing task
  editForm.addEventListener("submit", (e) => {
    e.preventDefault()

    if (selectedTaskId) {
      const formData = new FormData(editForm)
      const updatedTask = {
        id: selectedTaskId,
        text: formData.get("text"),
        date: formData.get("date"),
        completed: false, // Reset completion status when edited
      }

      // Remove from all arrays
      todayTasks = todayTasks.filter((task) => task.id !== selectedTaskId)
      tomorrowTasks = tomorrowTasks.filter((task) => task.id !== selectedTaskId)
      upcomingTasks = upcomingTasks.filter((task) => task.id !== selectedTaskId)

      // Add to correct array
      addTaskToCorrectArray(updatedTask)

      // Re-render tasks
      renderTasks()

      // Save to local storage
      saveTasksToLocalStorage()

      // Close modal
      closeEditModal()
    }
  })

  // Add task to correct array based on date
  function addTaskToCorrectArray(task) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const taskDate = new Date(task.date)
    taskDate.setHours(0, 0, 0, 0)

    if (isSameDay(taskDate, today)) {
      todayTasks.push(task)
    } else if (isSameDay(taskDate, tomorrow)) {
      tomorrowTasks.push(task)
    } else {
      upcomingTasks.push(task)
    }
  }

  // Check if two dates are the same day
  function isSameDay(date1, date2) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  // Format date for display in upcoming tasks (e.g., "May 1")
  function formatShortDate(date) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Save tasks to local storage
  function saveTasksToLocalStorage() {
    localStorage.setItem("todayTasks", JSON.stringify(todayTasks))
    localStorage.setItem("tomorrowTasks", JSON.stringify(tomorrowTasks))
    localStorage.setItem("upcomingTasks", JSON.stringify(upcomingTasks))
  }

  // Load tasks from local storage
  function loadTasksFromLocalStorage() {
    const storedTodayTasks = localStorage.getItem("todayTasks")
    const storedTomorrowTasks = localStorage.getItem("tomorrowTasks")
    const storedUpcomingTasks = localStorage.getItem("upcomingTasks")

    if (storedTodayTasks) todayTasks = JSON.parse(storedTodayTasks)
    if (storedTomorrowTasks) tomorrowTasks = JSON.parse(storedTomorrowTasks)
    if (storedUpcomingTasks) upcomingTasks = JSON.parse(storedUpcomingTasks)
  }

  // Render all tasks
  function renderTasks() {
    renderTaskList("today", todayTasks)
    renderTaskList("tomorrow", tomorrowTasks)
    renderTaskList("upcoming", upcomingTasks)
  }

  // Render a specific task list
  function renderTaskList(type, tasks) {
    const container = document.getElementById(`${type}-tasks`)
    const emptyState = document.getElementById(`${type}-empty-state`)

    // Clear existing tasks (except empty state)
    Array.from(container.children).forEach((child) => {
      if (child !== emptyState) {
        child.remove()
      }
    })

    // Reset visibility of empty state
    emptyState.style.display = "block"

    if (tasks.length > 0) {
      emptyState.style.display = "none"

      tasks.forEach((task) => {
        const taskElement = createTaskElement(task, type)
        container.appendChild(taskElement)
      })
    }
  }

  // Create task element
  function createTaskElement(task, section) {
    const div = document.createElement("div")
    div.className = "p-4 flex items-center justify-between task-card"
    div.dataset.id = task.id

    // Create inner HTML based on section
    if (section === "upcoming") {
      div.innerHTML = `
        <div class="flex items-center">
          <input type="checkbox" id="task-${task.id}" 
            class="w-6 h-6 appearance-none border-2 border-gray-300 rounded-full 
            checked:bg-[#8491D3] checked:border-transparent focus:outline-none relative"
            ${task.completed ? "checked" : ""}>
          <label for="task-${task.id}" class="ml-3 text-gray-800">
            <span class="task-text">${task.text}</span>
            <span class="text-xs text-gray-500 ml-2">(${formatShortDate(new Date(task.date))})</span>
          </label>
        </div>
      `
    } else {
      div.innerHTML = `
        <div class="flex items-center">
          <input type="checkbox" id="task-${task.id}" 
            class="w-6 h-6 appearance-none border-2 border-gray-300 rounded-full 
            checked:bg-[#8491D3] checked:border-transparent focus:outline-none relative"
            ${task.completed ? "checked" : ""}>
          <label for="task-${task.id}" class="ml-3 text-gray-800">
            <span class="task-text">${task.text}</span>
          </label>
        </div>
      `
    }

    // Add event listener for checkbox
    setTimeout(() => {
      const checkbox = div.querySelector('input[type="checkbox"]')
      checkbox.addEventListener("change", () => {
        const taskId = div.dataset.id
        const allTasks = [...todayTasks, ...tomorrowTasks, ...upcomingTasks]
        const taskIndex = allTasks.findIndex((t) => t.id === taskId)

        if (taskIndex !== -1) {
          // Find which array contains the task
          let taskArray
          let taskArrayIndex

          const todayIndex = todayTasks.findIndex((t) => t.id === taskId)
          if (todayIndex !== -1) {
            taskArray = todayTasks
            taskArrayIndex = todayIndex
          } else {
            const tomorrowIndex = tomorrowTasks.findIndex((t) => t.id === taskId)
            if (tomorrowIndex !== -1) {
              taskArray = tomorrowTasks
              taskArrayIndex = tomorrowIndex
            } else {
              const upcomingIndex = upcomingTasks.findIndex((t) => t.id === taskId)
              if (upcomingIndex !== -1) {
                taskArray = upcomingTasks
                taskArrayIndex = upcomingIndex
              }
            }
          }

          // Update the task's completed status
          if (taskArray && taskArrayIndex !== undefined) {
            taskArray[taskArrayIndex].completed = checkbox.checked

            // Save to local storage
            saveTasksToLocalStorage()
          }
        }
      })
    }, 0)

    return div
  }

  // Initialize the app
  loadTasksFromLocalStorage()
  renderTasks()
})
