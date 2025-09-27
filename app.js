const input = document.getElementById("taskInput");
const addBtn = document.getElementById("addTask");
const list = document.getElementById("taskList");

function addTask() {
  if (input.value.trim() === "") return;

  const li = document.createElement("li");
  li.textContent = input.value;
  li.addEventListener("click", () => li.classList.toggle("done"));

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "✖";
  removeBtn.onclick = () => li.remove();
  li.appendChild(removeBtn);

  list.appendChild(li);
  input.value = "";
}

addBtn.addEventListener("click", addTask);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});
