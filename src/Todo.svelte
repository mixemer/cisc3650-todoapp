<script>
    import { onMount } from 'svelte';
    import DropDown from './DropDown.svelte';

    export let todo;
    export let completeTodo;
    export let removeTodo;
    export let changePriority;
    export let dateChaged;

    const attributes1 = {min: new Date()};
</script>

<li class="list-group-item d-flex justify-content-between align-items-center">
    <div class="position-relative {todo.isComplete ? 'completed' : ''}" >
        <input type="checkbox" value="" on:change={completeTodo(todo.id)} checked={todo.isComplete}>
        {todo.name}
        <DropDown {todo} {changePriority}/>
    </div>
    <div>
        <input type="date" min={attributes1.min} bind:value={todo.dueAt} on:change={dateChaged(todo)}>
        <button class="btn-close" type="button"  aria-label="Close" on:click={removeTodo(todo)}></button>
    </div>
    
</li>

<style>
    .completed {
        text-decoration: line-through;
    }
</style>