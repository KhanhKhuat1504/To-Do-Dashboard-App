new Vue({
  el: "#app",
  vuetify: new Vuetify(),
  // Data
  data: (vm) => {
    // Create a currentDate variable to store today's date
    const currentDate = new Date(
      Date.now() - new Date().getTimezoneOffset() * 60000
    )
      .toISOString()
      .substr(0, 10);
    return {
      description: "Description",
      dialog: false,
      errorMessages: "",
      errorMessagesTitle: "",
      formHasErrors: false,
      dialogPrimaryButtonTitle: "Add",
      iconText: "mdi-plus-circle",
      headers: [
        { text: "Title", align: "center", value: "title" },
        { text: "Description", align: "center", value: "description" },
        { text: "Deadline", align: "center", value: "deadline" },
        { text: "Priority", align: "center", value: "priority" },
        { text: "Is Complete", align: "center", value: "is_complete" },
        { text: "Action", value: "action", sortable: false, align: "center" }
      ],
      // Create a tuple to store all the to do tasks objects
      tasks: [],
      editedIndex: -1,
      editedItem: {
        title: "",
        description: "",
        deadline: "",
        priority: "",
        is_complete: false
      },
      defaultItem: {
        title: "",
        description: "",
        deadline: "",
        priority: "",
        is_complete: false
      },
      date: currentDate,
      dateFormatted: vm.formatDate(currentDate),
      menu1: false,
      // Validation rules for Title and Description textbox
      rules: {
        requiredTitle: (val) => !!val || "Title is Required!",
        requiredDescription: (val) => !!val || "Description is Required!"
      }
    };
  },
  // Computed
  computed: {
    // Get date from date picker
    computedDateFormatted() {
      return this.formatDate(this.date);
    },
    // Get Title of form
    formTitle() {
      return this.editedIndex === -1 ? "Add Task" : "Edit Task";
    },
    // Get table values
    form() {
      const { title, description, priority } = this.editedItem;
      const deadline = this.dateFormatted;
      const is_complete = false;
      return { title, description, deadline, priority, is_complete };
    },
    // Get dynamically changed icon
    iconClass() {
      return this.iconText;
    }
  },
  // Watchers
  watch: {
    // Watch for changes in date and update dateFormatted
    date(val) {
      this.dateFormatted = this.formatDate(this.date);
    },
    // Watch for changes in dialog and call close() if dialog is falsy
    dialog(val) {
      val || this.close();
    }
  },
  // Methods
  methods: {
    // Method for formatting date string
    formatDate(date) {
      const [year, month, day] = date.split("-");
      return `${month}/${day}/${year}`;
    },
    // Method for parsing date string
    parseDate(date) {
      const [month, day, year] = date.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    },
    // Method for dialog form Update mode
    updateItem(item) {
      this.dialogPrimaryButtonTitle = "Edit";
      this.iconText = "mdi-note-edit";
      this.editedIndex = this.tasks.indexOf(item);
      const { deadline, priority } = this.tasks[this.editedIndex];
      this.dateFormatted = deadline;
      this.form.deadline = deadline;
      this.form.priority = priority;
      this.editedItem = { ...item };
      this.dialog = true;
    },
    // Method to delete table entry
    deleteItem(item) {
      const index = this.tasks.indexOf(item);
      const response = confirm(
        `Task ${this.tasks[index].title} will be deleted.`
      );
      if (response) {
        this.tasks.splice(index, 1);
        this.$toasted.show("Task was successfully deleted!");
      }
    },
    // Method for Add button
    addButton() {
      this.editedItem.priority = "low";
      this.iconText = "mdi-plus-circle";
      this.dialogPrimaryButtonTitle = "Add";
      const now = new Date();
      const timezoneOffset = now.getTimezoneOffset() * 60000;
      this.date = new Date(Date.now() - timezoneOffset)
        .toISOString()
        .substr(0, 10);
    },
    // Method to close dialog
    close() {
      this.rules.requiredTitle = true;
      this.rules.uniqueTitle = true;
      this.errorMessagesTitle = "";
      this.rules.requiredDescription = true;
      this.errorMessages = "";
      this.formHasErrors = false;
      this.dialog = false;
      this.priorityRadios = "low";
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },
    // Method for Add/ Edit button
    save() {
      // Edit button
      if (this.dialogPrimaryButtonTitle === "Edit") {
        let isDescriptionValid = this.descriptSubmit();
        // Pass validation
        if (isDescriptionValid > 0) {
          this.editedItem.deadline = this.dateFormatted;
          this.editedItem.description = this.form.description;
          this.editedItem.priority = this.form.priority;
          Object.assign(this.tasks[this.editedIndex], this.editedItem);
          this.$toasted.show("Task was successfully updated!");
        } else if (isDescriptionValid < 0) {
          return;
        }
      }
      // Add button
      else {
        let test = this.submit();
        // Validation failed
        if (test < 0) {
          return;
        }
        // Validation succeeded
        this.editedItem.is_complete = false;
        this.editedItem.deadline = this.dateFormatted;
        if (this.editedIndex > -1) {
          Object.assign(this.tasks[this.editedIndex], this.editedItem);
        } else {
          this.tasks.push(this.editedItem);
        }
        this.$toasted.show("Task was successfully added!");
      }
      this.close();
    },
    // Method to toggle the completion status of a task
    onChangeCheck(item) {
      let checkIndex = this.tasks.indexOf(item);
      this.tasks[checkIndex].is_complete = !this.tasks[checkIndex].is_complete;
    },
    // Method for saving validation
    submit() {
      // Double check validation
      let titleExists = this.titleSubmit();
      let titleUnique = this.validateUniqueTitle();
      let descriptExists = this.descriptSubmit();
      // Update hasErrors field
      this.formHasErrors = !(this.form.title && this.form.description);
      return Math.min(titleExists, titleUnique, descriptExists);
    },
    // Method for title validation used in submit()
    titleSubmit() {
      this.rules.requiredTitle =
        this.form.title.length > 0 ? true : "Title is Required!";
      this.rules.uniqueTitle = true;
      return this.form.title.length > 0 ? 1 : -1;
    },
    // Method for unique title validation used in submit()
    validateUniqueTitle() {
      let tempTitleRequired = 0;
      let currentTitle = this.form.title.trim();
      let currentSum = 0;
      if (currentTitle.length > 0) {
        this.rules.requiredTitle = true;
        tempTitleRequired = 1;
        // Get sum of current title
        for (let j = 0; j < currentTitle.length; j++) {
          currentSum = currentSum + currentTitle.charCodeAt(j);
        }
      } else {
        this.rules.requiredTitle = "Title is Required!";
        tempTitleRequired = -1;
      }
      let spaceFlag = false;
      let taskWordSums = this.tasks.map((task) => {
        let taskTitle = task.title.trim();
        let taskTitleSum = 0;
        // Get sums of all titles
        for (let u = 0; u < taskTitle.length; u++) {
          taskTitleSum = taskTitleSum + taskTitle.charCodeAt(u);
        }
        if (taskTitle === currentTitle) {
          spaceFlag = true;
        }
        let temp = taskTitle.replace(/ +(?= )/g, "");
        if (temp === currentTitle) {
          spaceFlag = true;
        }
        return taskTitleSum;
      });
      let isEqual =
        taskWordSums.some((taskSum) => taskSum === currentSum) || spaceFlag;
      let tempUniqueTitle = isEqual ? -1 : 1;
      this.rules.uniqueTitle = !isEqual;
      this.errorMessagesTitle = isEqual ? "Title must be unique!" : "";
      return Math.min(tempUniqueTitle, tempTitleRequired);
    },
    // Method for description validation used in submit()
    descriptSubmit() {
      let currentDescr = this.form.description;
      if (currentDescr.length > 0) {
        this.rules.requiredDescription = true;
        return 1;
      } else {
        this.rules.requiredDescription = "Description is Required!";
        return -1;
      }
    }
  }
});
//Toaster appear on the bottom right corner of the application
Vue.use(Toasted, {
  duration: 5000,
  position: "bottom-right",
  type: "success",
  closeOnSwipe: true,
  singleton: false,
  theme: "bubble"
});
