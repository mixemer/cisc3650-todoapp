<script>
    export let todo;
    export let changePriority;
</script>

<span type="button" class="badge btn dropdown-toggle {todo.isComplete ? 'bg-secondary' : todo.priority === "low" ? 'btn-success' : todo.priority === "mid" ? 'bg-warning' : 'bg-danger'}" data-bs-toggle="dropdown" aria-expanded="false" disabled={todo.isComplete}>
    {todo.priority === "low" ? 'No rush' : todo.priority === "mid" ? 'Important' : 'Urgent'}
  </span>
  <ul class="dropdown-menu">
    {#if todo.priority !== "low"}
    <li><button class="dropdown-item bg-success text-white" on:click={changePriority(todo, "low")}>No rush</button></li>
    {/if}
    {#if todo.priority !== "mid"} 
    <li><button class="dropdown-item bg-warning text-white" on:click={changePriority(todo, "mid")}>Important</button></li>
    {/if}
    {#if todo.priority !== "high"}
    <li><button class="dropdown-item bg-danger text-white" on:click={changePriority(todo, "high")}>Urgent</button></li>
    {/if}
  </ul>