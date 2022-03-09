
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\HeaderName.svelte generated by Svelte v3.46.4 */

    const file$3 = "src\\HeaderName.svelte";

    function create_fragment$3(ctx) {
    	let h3;
    	let t;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t = text(/*name*/ ctx[0]);
    			attr_dev(h3, "class", "py-1 px-3 mb-3 border-top border-dark border-3 svelte-b82da2");
    			add_location(h3, file$3, 4, 0, 45);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t, /*name*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('HeaderName', slots, []);
    	let { name } = $$props;
    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<HeaderName> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ name });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class HeaderName extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HeaderName",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console.warn("<HeaderName> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<HeaderName>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<HeaderName>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\DropDown.svelte generated by Svelte v3.46.4 */

    const file$2 = "src\\DropDown.svelte";

    // (10:4) {#if todo.priority !== "low"}
    function create_if_block_2(ctx) {
    	let li;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			button.textContent = "No rush";
    			attr_dev(button, "class", "dropdown-item bg-success text-white");
    			add_location(button, file$2, 10, 8, 518);
    			add_location(li, file$2, 10, 4, 514);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*changePriority*/ ctx[1](/*todo*/ ctx[0], "low"))) /*changePriority*/ ctx[1](/*todo*/ ctx[0], "low").apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(10:4) {#if todo.priority !== \\\"low\\\"}",
    		ctx
    	});

    	return block;
    }

    // (13:4) {#if todo.priority !== "mid"}
    function create_if_block_1(ctx) {
    	let li;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			button.textContent = "Important";
    			attr_dev(button, "class", "dropdown-item bg-warning text-white");
    			add_location(button, file$2, 13, 8, 687);
    			add_location(li, file$2, 13, 4, 683);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*changePriority*/ ctx[1](/*todo*/ ctx[0], "mid"))) /*changePriority*/ ctx[1](/*todo*/ ctx[0], "mid").apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(13:4) {#if todo.priority !== \\\"mid\\\"}",
    		ctx
    	});

    	return block;
    }

    // (16:4) {#if todo.priority !== "high"}
    function create_if_block(ctx) {
    	let li;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			button.textContent = "Urgent";
    			attr_dev(button, "class", "dropdown-item bg-danger text-white");
    			add_location(button, file$2, 16, 8, 858);
    			add_location(li, file$2, 16, 4, 854);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*changePriority*/ ctx[1](/*todo*/ ctx[0], "high"))) /*changePriority*/ ctx[1](/*todo*/ ctx[0], "high").apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(16:4) {#if todo.priority !== \\\"high\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let span;

    	let t0_value = (/*todo*/ ctx[0].priority === "low"
    	? 'No rush'
    	: /*todo*/ ctx[0].priority === "mid"
    		? 'Important'
    		: 'Urgent') + "";

    	let t0;
    	let span_class_value;
    	let span_disabled_value;
    	let t1;
    	let ul;
    	let t2;
    	let t3;
    	let if_block0 = /*todo*/ ctx[0].priority !== "low" && create_if_block_2(ctx);
    	let if_block1 = /*todo*/ ctx[0].priority !== "mid" && create_if_block_1(ctx);
    	let if_block2 = /*todo*/ ctx[0].priority !== "high" && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			ul = element("ul");
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(span, "type", "button");

    			attr_dev(span, "class", span_class_value = "badge btn dropdown-toggle " + (/*todo*/ ctx[0].isComplete
    			? 'bg-secondary'
    			: /*todo*/ ctx[0].priority === "low"
    				? 'btn-success'
    				: /*todo*/ ctx[0].priority === "mid"
    					? 'bg-warning'
    					: 'bg-danger'));

    			attr_dev(span, "data-bs-toggle", "dropdown");
    			attr_dev(span, "aria-expanded", "false");
    			attr_dev(span, "disabled", span_disabled_value = /*todo*/ ctx[0].isComplete);
    			add_location(span, file$2, 5, 0, 77);
    			attr_dev(ul, "class", "dropdown-menu");
    			add_location(ul, file$2, 8, 2, 447);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);
    			if (if_block0) if_block0.m(ul, null);
    			append_dev(ul, t2);
    			if (if_block1) if_block1.m(ul, null);
    			append_dev(ul, t3);
    			if (if_block2) if_block2.m(ul, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*todo*/ 1 && t0_value !== (t0_value = (/*todo*/ ctx[0].priority === "low"
    			? 'No rush'
    			: /*todo*/ ctx[0].priority === "mid"
    				? 'Important'
    				: 'Urgent') + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*todo*/ 1 && span_class_value !== (span_class_value = "badge btn dropdown-toggle " + (/*todo*/ ctx[0].isComplete
    			? 'bg-secondary'
    			: /*todo*/ ctx[0].priority === "low"
    				? 'btn-success'
    				: /*todo*/ ctx[0].priority === "mid"
    					? 'bg-warning'
    					: 'bg-danger'))) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty & /*todo*/ 1 && span_disabled_value !== (span_disabled_value = /*todo*/ ctx[0].isComplete)) {
    				attr_dev(span, "disabled", span_disabled_value);
    			}

    			if (/*todo*/ ctx[0].priority !== "low") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(ul, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*todo*/ ctx[0].priority !== "mid") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(ul, t3);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*todo*/ ctx[0].priority !== "high") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(ul, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DropDown', slots, []);
    	let { todo } = $$props;
    	let { changePriority } = $$props;
    	const writable_props = ['todo', 'changePriority'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DropDown> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('todo' in $$props) $$invalidate(0, todo = $$props.todo);
    		if ('changePriority' in $$props) $$invalidate(1, changePriority = $$props.changePriority);
    	};

    	$$self.$capture_state = () => ({ todo, changePriority });

    	$$self.$inject_state = $$props => {
    		if ('todo' in $$props) $$invalidate(0, todo = $$props.todo);
    		if ('changePriority' in $$props) $$invalidate(1, changePriority = $$props.changePriority);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [todo, changePriority];
    }

    class DropDown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { todo: 0, changePriority: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DropDown",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*todo*/ ctx[0] === undefined && !('todo' in props)) {
    			console.warn("<DropDown> was created without expected prop 'todo'");
    		}

    		if (/*changePriority*/ ctx[1] === undefined && !('changePriority' in props)) {
    			console.warn("<DropDown> was created without expected prop 'changePriority'");
    		}
    	}

    	get todo() {
    		throw new Error("<DropDown>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todo(value) {
    		throw new Error("<DropDown>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get changePriority() {
    		throw new Error("<DropDown>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set changePriority(value) {
    		throw new Error("<DropDown>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Todo.svelte generated by Svelte v3.46.4 */
    const file$1 = "src\\Todo.svelte";

    function create_fragment$1(ctx) {
    	let li;
    	let div0;
    	let input0;
    	let input0_checked_value;
    	let t0;
    	let t1_value = /*todo*/ ctx[0].name + "";
    	let t1;
    	let t2;
    	let dropdown;
    	let div0_class_value;
    	let t3;
    	let div1;
    	let input1;
    	let t4;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	dropdown = new DropDown({
    			props: {
    				todo: /*todo*/ ctx[0],
    				changePriority: /*changePriority*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			li = element("li");
    			div0 = element("div");
    			input0 = element("input");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			create_component(dropdown.$$.fragment);
    			t3 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t4 = space();
    			button = element("button");
    			attr_dev(input0, "type", "checkbox");
    			input0.value = "";
    			input0.checked = input0_checked_value = /*todo*/ ctx[0].isComplete;
    			add_location(input0, file$1, 31, 8, 833);
    			attr_dev(div0, "class", div0_class_value = "position-relative " + (/*todo*/ ctx[0].isComplete ? 'completed' : '') + " svelte-1eso3dz");
    			add_location(div0, file$1, 30, 4, 754);
    			attr_dev(input1, "type", "date");
    			attr_dev(input1, "min", new Date());
    			attr_dev(input1, "max", "2050-12-31");
    			add_location(input1, file$1, 36, 8, 1024);
    			attr_dev(button, "class", "btn-close");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "aria-label", "Close");
    			add_location(button, file$1, 37, 8, 1111);
    			add_location(div1, file$1, 35, 4, 1009);
    			attr_dev(li, "class", "list-group-item d-flex justify-content-between align-items-center");
    			add_location(li, file$1, 29, 0, 670);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div0);
    			append_dev(div0, input0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			mount_component(dropdown, div0, null);
    			append_dev(li, t3);
    			append_dev(li, div1);
    			append_dev(div1, input1);
    			set_input_value(input1, /*dateString*/ ctx[4]);
    			append_dev(div1, t4);
    			append_dev(div1, button);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						input0,
    						"change",
    						function () {
    							if (is_function(/*completeTodo*/ ctx[1](/*todo*/ ctx[0].id))) /*completeTodo*/ ctx[1](/*todo*/ ctx[0].id).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    					listen_dev(
    						button,
    						"click",
    						function () {
    							if (is_function(/*removeTodo*/ ctx[2](/*todo*/ ctx[0]))) /*removeTodo*/ ctx[2](/*todo*/ ctx[0]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (!current || dirty & /*todo*/ 1 && input0_checked_value !== (input0_checked_value = /*todo*/ ctx[0].isComplete)) {
    				prop_dev(input0, "checked", input0_checked_value);
    			}

    			if ((!current || dirty & /*todo*/ 1) && t1_value !== (t1_value = /*todo*/ ctx[0].name + "")) set_data_dev(t1, t1_value);
    			const dropdown_changes = {};
    			if (dirty & /*todo*/ 1) dropdown_changes.todo = /*todo*/ ctx[0];
    			if (dirty & /*changePriority*/ 8) dropdown_changes.changePriority = /*changePriority*/ ctx[3];
    			dropdown.$set(dropdown_changes);

    			if (!current || dirty & /*todo*/ 1 && div0_class_value !== (div0_class_value = "position-relative " + (/*todo*/ ctx[0].isComplete ? 'completed' : '') + " svelte-1eso3dz")) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (dirty & /*dateString*/ 16) {
    				set_input_value(input1, /*dateString*/ ctx[4]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dropdown.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dropdown.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(dropdown);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Todo', slots, []);
    	let { todo } = $$props;
    	let { completeTodo } = $$props;
    	let { removeTodo } = $$props;
    	let { changePriority } = $$props;
    	let month, day, year;
    	let date = todo.dueAt;
    	let dateString;

    	onMount(() => {
    		if (date === undefined) return;
    		(month = '' + (date.getMonth() + 1), day = '' + date.getDate(), year = date.getFullYear());
    		if (month.length < 2) month = '0' + month;
    		if (day.length < 2) day = '0' + day;
    		$$invalidate(4, dateString = [year, month, day].join('-'));
    	});

    	const writable_props = ['todo', 'completeTodo', 'removeTodo', 'changePriority'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Todo> was created with unknown prop '${key}'`);
    	});

    	function input1_input_handler() {
    		dateString = this.value;
    		$$invalidate(4, dateString);
    	}

    	$$self.$$set = $$props => {
    		if ('todo' in $$props) $$invalidate(0, todo = $$props.todo);
    		if ('completeTodo' in $$props) $$invalidate(1, completeTodo = $$props.completeTodo);
    		if ('removeTodo' in $$props) $$invalidate(2, removeTodo = $$props.removeTodo);
    		if ('changePriority' in $$props) $$invalidate(3, changePriority = $$props.changePriority);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		DropDown,
    		todo,
    		completeTodo,
    		removeTodo,
    		changePriority,
    		month,
    		day,
    		year,
    		date,
    		dateString
    	});

    	$$self.$inject_state = $$props => {
    		if ('todo' in $$props) $$invalidate(0, todo = $$props.todo);
    		if ('completeTodo' in $$props) $$invalidate(1, completeTodo = $$props.completeTodo);
    		if ('removeTodo' in $$props) $$invalidate(2, removeTodo = $$props.removeTodo);
    		if ('changePriority' in $$props) $$invalidate(3, changePriority = $$props.changePriority);
    		if ('month' in $$props) month = $$props.month;
    		if ('day' in $$props) day = $$props.day;
    		if ('year' in $$props) year = $$props.year;
    		if ('date' in $$props) date = $$props.date;
    		if ('dateString' in $$props) $$invalidate(4, dateString = $$props.dateString);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		todo,
    		completeTodo,
    		removeTodo,
    		changePriority,
    		dateString,
    		input1_input_handler
    	];
    }

    class Todo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			todo: 0,
    			completeTodo: 1,
    			removeTodo: 2,
    			changePriority: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Todo",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*todo*/ ctx[0] === undefined && !('todo' in props)) {
    			console.warn("<Todo> was created without expected prop 'todo'");
    		}

    		if (/*completeTodo*/ ctx[1] === undefined && !('completeTodo' in props)) {
    			console.warn("<Todo> was created without expected prop 'completeTodo'");
    		}

    		if (/*removeTodo*/ ctx[2] === undefined && !('removeTodo' in props)) {
    			console.warn("<Todo> was created without expected prop 'removeTodo'");
    		}

    		if (/*changePriority*/ ctx[3] === undefined && !('changePriority' in props)) {
    			console.warn("<Todo> was created without expected prop 'changePriority'");
    		}
    	}

    	get todo() {
    		throw new Error("<Todo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todo(value) {
    		throw new Error("<Todo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get completeTodo() {
    		throw new Error("<Todo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set completeTodo(value) {
    		throw new Error("<Todo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get removeTodo() {
    		throw new Error("<Todo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set removeTodo(value) {
    		throw new Error("<Todo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get changePriority() {
    		throw new Error("<Todo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set changePriority(value) {
    		throw new Error("<Todo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.46.4 */
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (85:3) {#each todos as todo}
    function create_each_block(ctx) {
    	let todo;
    	let current;

    	todo = new Todo({
    			props: {
    				todo: /*todo*/ ctx[8],
    				completeTodo: /*completeTodo*/ ctx[4],
    				removeTodo: /*removeTodo*/ ctx[5],
    				changePriority: /*changePriority*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(todo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(todo, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const todo_changes = {};
    			if (dirty & /*todos*/ 2) todo_changes.todo = /*todo*/ ctx[8];
    			todo.$set(todo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(todo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(85:3) {#each todos as todo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div1;
    	let headername;
    	let t0;
    	let div0;
    	let input;
    	let t1;
    	let button;
    	let t2;
    	let t3;
    	let br;
    	let t4;
    	let ul;
    	let current;
    	let mounted;
    	let dispose;
    	headername = new HeaderName({ props: { name: "Task" }, $$inline: true });
    	let each_value = /*todos*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			create_component(headername.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			input = element("input");
    			t1 = space();
    			button = element("button");
    			t2 = text("Add");
    			t3 = space();
    			br = element("br");
    			t4 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Add a task");
    			add_location(input, file, 78, 2, 1431);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn btn-success");
    			button.disabled = /*disabled*/ ctx[2];
    			add_location(button, file, 79, 2, 1496);
    			add_location(br, file, 81, 2, 1597);
    			attr_dev(ul, "class", "list-group");
    			add_location(ul, file, 83, 2, 1607);
    			attr_dev(div0, "class", "px-4");
    			add_location(div0, file, 77, 1, 1410);
    			attr_dev(div1, "class", "p-5");
    			add_location(div1, file, 74, 0, 1363);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			mount_component(headername, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*task*/ ctx[0]);
    			append_dev(div0, t1);
    			append_dev(div0, button);
    			append_dev(button, t2);
    			append_dev(div0, t3);
    			append_dev(div0, br);
    			append_dev(div0, t4);
    			append_dev(div0, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(button, "click", /*addTodo*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*task*/ 1 && input.value !== /*task*/ ctx[0]) {
    				set_input_value(input, /*task*/ ctx[0]);
    			}

    			if (!current || dirty & /*disabled*/ 4) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[2]);
    			}

    			if (dirty & /*todos, completeTodo, removeTodo, changePriority*/ 114) {
    				each_value = /*todos*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(headername.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(headername.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(headername);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function generateRandomId() {
    	return Math.random().toString(16).slice(2);
    }

    function instance($$self, $$props, $$invalidate) {
    	let disabled;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	let todos = [
    		{
    			id: 0,
    			name: "example",
    			isComplete: false,
    			priority: "low",
    			createdAt: new Date(),
    			dueAt: undefined
    		},
    		{
    			id: 1,
    			name: "example2",
    			isComplete: false,
    			priority: "high",
    			createdAt: new Date(),
    			dueAt: new Date()
    		}
    	];

    	let task = "";

    	const addTodo = () => {
    		let todo = {
    			id: generateRandomId(),
    			name: task,
    			isComplete: false,
    			priority: "low",
    			createdAt: new Date(),
    			dueAt: undefined
    		};

    		$$invalidate(1, todos = [todo, ...todos]);
    		$$invalidate(0, task = "");
    	};

    	const completeTodo = id => {
    		$$invalidate(1, todos = todos.map(todo => {
    			if (todo.id === id) {
    				todo.isComplete = !todo.isComplete;
    			}

    			return todo;
    		}));

    		$$invalidate(0, task = "");
    	};

    	const removeTodo = todo => {
    		let confirmAction = confirm("Are you sure to delete task: " + todo.name + "?");

    		if (confirmAction) {
    			$$invalidate(1, todos = todos.filter(t => t.id !== todo.id));
    		}
    	};

    	const changePriority = (todo, priority) => {
    		var elements = document.getElementsByClassName("dropdown-menu");

    		for (var i = 0; i < elements.length; i++) {
    			elements[i].classList.remove('show');
    		}

    		todo.priority = priority;
    		$$invalidate(1, todos);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		task = this.value;
    		$$invalidate(0, task);
    	}

    	$$self.$capture_state = () => ({
    		HeaderName,
    		Todo,
    		todos,
    		task,
    		generateRandomId,
    		addTodo,
    		completeTodo,
    		removeTodo,
    		changePriority,
    		disabled
    	});

    	$$self.$inject_state = $$props => {
    		if ('todos' in $$props) $$invalidate(1, todos = $$props.todos);
    		if ('task' in $$props) $$invalidate(0, task = $$props.task);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*task*/ 1) {
    			$$invalidate(2, disabled = task.trim() === "");
    		}
    	};

    	return [
    		task,
    		todos,
    		disabled,
    		addTodo,
    		completeTodo,
    		removeTodo,
    		changePriority,
    		input_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
