<script>
	import HeaderName from './HeaderName.svelte';
	import Todo from './Todo.svelte';
	import { quintOut } from 'svelte/easing'
	import { crossfade } from 'svelte/transition'
	import { flip } from 'svelte/animate'

	let todos = [
		{
			id: 0,
			name: "example",
			isComplete: false,
			priority: "low",
			createdAt: new Date(),
			dueAt: undefined,
		},
		{
			id: 1,
			name: "example2",
			isComplete: true,
			priority: "high",
			createdAt: new Date(),
			dueAt: new Date(),
		},
	];
	let task = "";
	$: disabled = task.trim() === "";
	var sounds = {
		info: "https://res.cloudinary.com/dxfq3iotg/video/upload/v1557233294/info.mp3",
		// path to sound for successfull message:
		success: "https://res.cloudinary.com/dxfq3iotg/video/upload/v1557233524/success.mp3",
		// path to sound for warn message:
		warning: "https://res.cloudinary.com/dxfq3iotg/video/upload/v1557233563/warning.mp3",
		// path to sound for error message:
		error: "https://res.cloudinary.com/dxfq3iotg/video/upload/v1557233574/error.mp3",
	};


	function generateRandomId() {
		return Math.random().toString(16).slice(2);
	}
	
	const addTodo = () => {
		let todo = {
			id: generateRandomId(),
			name: task,
			isComplete: false,
			priority: "low",
			createdAt: new Date(),
			dueAt: undefined
		};

		todos = [todo, ...todos];
		var audio = new Audio(sounds.success);
		audio.play();
		task = "";
	}

	const completeTodo = (id) => {
		todos = todos.map((todo) => {
			if (todo.id === id) {
				todo.isComplete = !todo.isComplete;
			}
			return todo;
		});
		todos = todos.sort(function (a, b) {
			return a.isComplete - b.isComplete;
		});
		var audio = new Audio(sounds.info);
		audio.play();
		task = "";
	}


	const removeTodo = (todo) => {
		let confirmAction = confirm("Are you sure to delete task: " + todo.name + "?");
		
		if (confirmAction) {
			todos = todos.filter((t)=>t.id !== todo.id);

			var audio = new Audio(sounds.warning);
			audio.play();
		}
	}

	const changePriority = (todo, priority) => {
		var elements = document.getElementsByClassName("dropdown-menu");
		for(var i = 0; i < elements.length; i++) {
			elements[i].classList.remove('show');
		}

		todo.priority = priority;
		todos = todos;
    }

	const dateChaged = (t) =>{
		todos = todos;
	}

  // FLIP ANIMATION
  const [send, receive] = crossfade({
  	duration: d => Math.sqrt(d * 200),
  	fallback(node, params) {
  		const style = getComputedStyle(node)
  		const transform = style.transform === 'none' ? '' : style.transform
  		return {
  			duration: 600,
  			easing: quintOut,
  			css: t => `
  			transform: ${transform} scale(${t})
  			opacity: ${t}
  			`
  		}
  	}
  })
</script>

<div class="p-5">
	<HeaderName name="Task"/>

	<div class="px-4">
		<input type="text" placeholder="Add a task" bind:value={task}>
		<button type="button" class="btn btn-success" on:click={addTodo} disabled={disabled}>Add</button>

		<br>
		
		<ul class="list-group">
			{#each todos as todo (todo.id)}
				<div in:receive="{{key: todo.id}}" out:send="{{key: todo.id}}" animate:flip>
					<Todo {todo} {completeTodo} {removeTodo} {changePriority} {dateChaged}/>
				</div>
			{:else}
			    <li class="list-group-item"> No task, add one! </li>
			{/each}
		</ul >
	</div>
</div>