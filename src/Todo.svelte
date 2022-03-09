<script>
    import { onMount } from 'svelte';
    import DropDown from './DropDown.svelte';

    export let todo;
    export let completeTodo;
    export let removeTodo;
    export let changePriority;

    let month, day, year;
    let date = todo.dueAt;
    let dateString;

    onMount(()=> {
        if (date === undefined) return;

        month = '' + (date.getMonth() + 1),
        day = '' + date.getDate(),
        year = date.getFullYear();

        if (month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;

        dateString = [year, month, day].join('-');
	})
</script>

<li class="list-group-item d-flex justify-content-between align-items-center">
    <div class="position-relative {todo.isComplete ? 'completed' : ''}" >
        <input type="checkbox" value="" on:change={completeTodo(todo.id)} checked={todo.isComplete}>
        {todo.name}
        <DropDown {todo} {changePriority}/>
    </div>
    <div>
        <input type="date" min={new Date()} max="2050-12-31" bind:value={dateString}>
        <button class="btn-close" type="button"  aria-label="Close" on:click={removeTodo(todo)}></button>
    </div>
    
</li>

<style>
    .completed {
        text-decoration: line-through;
    }
</style>