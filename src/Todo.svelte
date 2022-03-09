<script>
    import DropDown from './DropDown.svelte';

    export let todo;
    export let completeTodo;
    export let removeTodo;
    export let changePriority;
    export let dateChaged;

    $: isComplete = todo.isComplete;

	let now = new Date();
    $: dateString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000 )).toISOString().split("T")[0];
</script>

<li class="list-group-item d-flex justify-content-between align-items-center">
    <div class="position-relative {todo.isComplete ? 'completed' : ''}" >
        <input type="checkbox" value="" on:change={completeTodo(todo.id)} checked={isComplete}>
        {todo.name}
        <DropDown {todo} {changePriority}/>
    </div>
    <div>
        <input type="date" min={dateString} bind:value={todo.dueAt} on:change={dateChaged(todo)}>
        <button class="btn-close" type="button"  aria-label="Close" on:click={removeTodo(todo)}></button>
    </div>
</li>

<style>
    .completed {
        text-decoration: line-through;
    }
</style>