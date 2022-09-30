
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
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
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_options(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            option.selected = ~value.indexOf(option.__value);
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
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
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.50.1' }, detail), { bubbles: true }));
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

    /* src/NoViews.svelte generated by Svelte v3.50.1 */

    const { Error: Error_1, console: console_1$1 } = globals;
    const file$3 = "src/NoViews.svelte";

    // (133:19) 
    function create_if_block_4(ctx) {
    	let h2;
    	let t1;
    	let t2;
    	let span;
    	let if_block = /*error*/ ctx[1] && create_if_block_5(ctx);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "That's just sad bro";
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			span = element("span");
    			span.textContent = "Find a random YouTube video with 1 or less views";
    			attr_dev(h2, "class", "svelte-x4ylff");
    			add_location(h2, file$3, 133, 2, 3545);
    			attr_dev(span, "class", "desc svelte-x4ylff");
    			add_location(span, file$3, 135, 2, 3640);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*error*/ ctx[1]) {
    				if (if_block) ; else {
    					if_block = create_if_block_5(ctx);
    					if_block.c();
    					if_block.m(t2.parentNode, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(133:19) ",
    		ctx
    	});

    	return block;
    }

    // (125:0) {#if video}
    function create_if_block_3(ctx) {
    	let iframe;
    	let iframe_src_value;
    	let iframe_title_value;

    	const block = {
    		c: function create() {
    			iframe = element("iframe");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://www.youtube.com/embed/" + /*video*/ ctx[0].id)) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "allow", "encrypted-media");
    			attr_dev(iframe, "title", iframe_title_value = /*video*/ ctx[0].title);
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = true;
    			attr_dev(iframe, "class", "svelte-x4ylff");
    			add_location(iframe, file$3, 125, 2, 3367);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, iframe, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*video*/ 1 && !src_url_equal(iframe.src, iframe_src_value = "https://www.youtube.com/embed/" + /*video*/ ctx[0].id)) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}

    			if (dirty & /*video*/ 1 && iframe_title_value !== (iframe_title_value = /*video*/ ctx[0].title)) {
    				attr_dev(iframe, "title", iframe_title_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(125:0) {#if video}",
    		ctx
    	});

    	return block;
    }

    // (135:2) {#if error}
    function create_if_block_5(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "There was an error";
    			attr_dev(span, "class", "error svelte-x4ylff");
    			add_location(span, file$3, 134, 13, 3587);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(135:2) {#if error}",
    		ctx
    	});

    	return block;
    }

    // (138:0) {#if videoInfo}
    function create_if_block_2$1(ctx) {
    	let div3;
    	let div1;
    	let a0;
    	let t0_value = /*videoInfo*/ ctx[3].title + "";
    	let t0;
    	let a0_href_value;
    	let t1;
    	let div0;
    	let svg0;
    	let g;
    	let circle;
    	let path0;
    	let t2;
    	let t3_value = /*video*/ ctx[0].statistics.viewCount + "";
    	let t3;
    	let t4;
    	let a1;
    	let svg1;
    	let path1;
    	let path2;
    	let t5;
    	let t6_value = /*videoInfo*/ ctx[3].channelTitle + "";
    	let t6;
    	let a1_href_value;
    	let t7;
    	let div2;
    	let t8_value = fromNow(/*videoInfo*/ ctx[3].publishedAt, { zero: false, max: 1 }) + "";
    	let t8;
    	let t9;

    	let t10_value = ((/*video*/ ctx[0].description?.trim()?.length)
    	? " – " + niceslice(/*videoInfo*/ ctx[3].description)
    	: "") + "";

    	let t10;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			a0 = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			g = svg_element("g");
    			circle = svg_element("circle");
    			path0 = svg_element("path");
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			a1 = element("a");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			t5 = space();
    			t6 = text(t6_value);
    			t7 = space();
    			div2 = element("div");
    			t8 = text(t8_value);
    			t9 = text(" ago\n      ");
    			t10 = text(t10_value);
    			attr_dev(a0, "class", "title svelte-x4ylff");
    			attr_dev(a0, "href", a0_href_value = "https://youtube.com/watch?v=" + /*video*/ ctx[0].id);
    			add_location(a0, file$3, 140, 6, 3790);
    			attr_dev(circle, "cx", "12");
    			attr_dev(circle, "cy", "12");
    			attr_dev(circle, "r", "2");
    			attr_dev(circle, "class", "svelte-x4ylff");
    			add_location(circle, file$3, 151, 13, 4158);
    			attr_dev(path0, "d", "M22 12c-2.667 4.667-6 7-10 7s-7.333-2.333-10-7c2.667-4.667 6-7 10-7s7.333 2.333 10 7");
    			attr_dev(path0, "class", "svelte-x4ylff");
    			add_location(path0, file$3, 151, 45, 4190);
    			attr_dev(g, "fill", "none");
    			attr_dev(g, "stroke", "currentColor");
    			attr_dev(g, "stroke-linecap", "round");
    			attr_dev(g, "stroke-linejoin", "round");
    			attr_dev(g, "stroke-width", "2");
    			attr_dev(g, "class", "svelte-x4ylff");
    			add_location(g, file$3, 145, 11, 3984);
    			attr_dev(svg0, "width", "32");
    			attr_dev(svg0, "height", "32");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "class", "svelte-x4ylff");
    			add_location(svg0, file$3, 144, 8, 3925);
    			attr_dev(div0, "class", "views svelte-x4ylff");
    			add_location(div0, file$3, 143, 6, 3897);
    			attr_dev(div1, "class", "heading svelte-x4ylff");
    			add_location(div1, file$3, 139, 4, 3762);
    			attr_dev(path1, "fill", "currentColor");
    			attr_dev(path1, "d", "M16 8a5 5 0 1 0 5 5a5 5 0 0 0-5-5Zm0 8a3 3 0 1 1 3-3a3.003 3.003 0 0 1-3 3Z");
    			attr_dev(path1, "class", "svelte-x4ylff");
    			add_location(path1, file$3, 161, 9, 4549);
    			attr_dev(path2, "fill", "currentColor");
    			attr_dev(path2, "d", "M16 2a14 14 0 1 0 14 14A14.016 14.016 0 0 0 16 2Zm-6 24.377V25a3.003 3.003 0 0 1 3-3h6a3.003 3.003 0 0 1 3 3v1.377a11.899 11.899 0 0 1-12 0Zm13.992-1.451A5.002 5.002 0 0 0 19 20h-6a5.002 5.002 0 0 0-4.992 4.926a12 12 0 1 1 15.985 0Z");
    			attr_dev(path2, "class", "svelte-x4ylff");
    			add_location(path2, file$3, 164, 10, 4685);
    			attr_dev(svg1, "width", "32");
    			attr_dev(svg1, "height", "32");
    			attr_dev(svg1, "viewBox", "0 0 32 32");
    			attr_dev(svg1, "class", "svelte-x4ylff");
    			add_location(svg1, file$3, 160, 6, 4492);
    			attr_dev(a1, "class", "channel svelte-x4ylff");
    			attr_dev(a1, "href", a1_href_value = "https://youtube.com/channel/" + /*videoInfo*/ ctx[3].channelId);
    			add_location(a1, file$3, 159, 4, 4409);
    			attr_dev(div2, "class", "desc svelte-x4ylff");
    			add_location(div2, file$3, 171, 4, 5036);
    			attr_dev(div3, "class", "info svelte-x4ylff");
    			add_location(div3, file$3, 138, 2, 3739);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, a0);
    			append_dev(a0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, svg0);
    			append_dev(svg0, g);
    			append_dev(g, circle);
    			append_dev(g, path0);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div3, t4);
    			append_dev(div3, a1);
    			append_dev(a1, svg1);
    			append_dev(svg1, path1);
    			append_dev(svg1, path2);
    			append_dev(a1, t5);
    			append_dev(a1, t6);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, t8);
    			append_dev(div2, t9);
    			append_dev(div2, t10);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*videoInfo*/ 8 && t0_value !== (t0_value = /*videoInfo*/ ctx[3].title + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*video*/ 1 && a0_href_value !== (a0_href_value = "https://youtube.com/watch?v=" + /*video*/ ctx[0].id)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*video*/ 1 && t3_value !== (t3_value = /*video*/ ctx[0].statistics.viewCount + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*videoInfo*/ 8 && t6_value !== (t6_value = /*videoInfo*/ ctx[3].channelTitle + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*videoInfo*/ 8 && a1_href_value !== (a1_href_value = "https://youtube.com/channel/" + /*videoInfo*/ ctx[3].channelId)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*videoInfo*/ 8 && t8_value !== (t8_value = fromNow(/*videoInfo*/ ctx[3].publishedAt, { zero: false, max: 1 }) + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*video, videoInfo*/ 9 && t10_value !== (t10_value = ((/*video*/ ctx[0].description?.trim()?.length)
    			? " – " + niceslice(/*videoInfo*/ ctx[3].description)
    			: "") + "")) set_data_dev(t10, t10_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(138:0) {#if videoInfo}",
    		ctx
    	});

    	return block;
    }

    // (182:0) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let button;
    	let t;
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	function select_block_type_2(ctx, dirty) {
    		if (/*video*/ ctx[0]) return create_if_block_1$1;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			if_block.c();
    			t = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(button, "class", "search button svelte-x4ylff");
    			add_location(button, file$3, 183, 4, 5352);
    			attr_dev(path, "fill", "currentColor");
    			attr_dev(path, "d", "m19.588 15.492l-1.814-1.29a6.483 6.483 0 0 0-.005-3.421l1.82-1.274l-1.453-2.514l-2.024.926a6.484 6.484 0 0 0-2.966-1.706L12.953 4h-2.906l-.193 2.213A6.483 6.483 0 0 0 6.889 7.92l-2.025-.926l-1.452 2.514l1.82 1.274a6.483 6.483 0 0 0-.006 3.42l-1.814 1.29l1.452 2.502l2.025-.927a6.483 6.483 0 0 0 2.965 1.706l.193 2.213h2.906l.193-2.213a6.484 6.484 0 0 0 2.965-1.706l2.025.927l1.453-2.501ZM13.505 2.985a.5.5 0 0 1 .5.477l.178 2.035a7.45 7.45 0 0 1 2.043 1.178l1.85-.863a.5.5 0 0 1 .662.195l2.005 3.47a.5.5 0 0 1-.162.671l-1.674 1.172c.128.798.124 1.593.001 2.359l1.673 1.17a.5.5 0 0 1 .162.672l-2.005 3.457a.5.5 0 0 1-.662.195l-1.85-.863c-.602.49-1.288.89-2.043 1.179l-.178 2.035a.5.5 0 0 1-.5.476h-4.01a.5.5 0 0 1-.5-.476l-.178-2.035a7.453 7.453 0 0 1-2.043-1.179l-1.85.863a.5.5 0 0 1-.663-.194L2.257 15.52a.5.5 0 0 1 .162-.671l1.673-1.171a7.45 7.45 0 0 1 0-2.359L2.42 10.148a.5.5 0 0 1-.162-.67L4.26 6.007a.5.5 0 0 1 .663-.195l1.85.863a7.45 7.45 0 0 1 2.043-1.178l.178-2.035a.5.5 0 0 1 .5-.477h4.01ZM11.5 9a3.5 3.5 0 1 1 0 7a3.5 3.5 0 0 1 0-7Zm0 1a2.5 2.5 0 1 0 0 5a2.5 2.5 0 0 0 0-5Z");
    			attr_dev(path, "class", "svelte-x4ylff");
    			add_location(path, file$3, 191, 7, 5576);
    			attr_dev(svg, "width", "32");
    			attr_dev(svg, "height", "32");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "class", "svelte-x4ylff");
    			add_location(svg, file$3, 186, 4, 5459);
    			attr_dev(div, "class", "buttons svelte-x4ylff");
    			add_location(div, file$3, 182, 2, 5326);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			if_block.m(button, null);
    			append_dev(div, t);
    			append_dev(div, svg);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*clicked*/ ctx[5], false, false, false),
    					listen_dev(svg, "click", /*click_handler*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type_2(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(182:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (180:0) {#if loading}
    function create_if_block$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Loading...";
    			attr_dev(span, "class", "loading desc svelte-x4ylff");
    			add_location(span, file$3, 180, 2, 5271);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(180:0) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (185:23) {:else}
    function create_else_block_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Go!");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(185:23) {:else}",
    		ctx
    	});

    	return block;
    }

    // (185:6) {#if video}
    function create_if_block_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Again!");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(185:6) {#if video}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let t0;
    	let t1;
    	let if_block2_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*video*/ ctx[0]) return create_if_block_3;
    		if (!/*loading*/ ctx[2]) return create_if_block_4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);
    	let if_block1 = /*videoInfo*/ ctx[3] && create_if_block_2$1(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*loading*/ ctx[2]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block2 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if_block2.c();
    			if_block2_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if (if_block0) if_block0.d(1);
    				if_block0 = current_block_type && current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			}

    			if (/*videoInfo*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type_1(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block0) {
    				if_block0.d(detaching);
    			}

    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
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

    function niceslice(str, len) {
    	return str?.length > len ? str?.slice(0, -3) + "..." : str;
    }

    function fromNow(n, o) {
    	var a = 6e4, r = 60 * a, e = 24 * r, t = 365 * e, f = 30 * e;
    	o = o || {};
    	var u = new Date(n).getTime() - Date.now(), h = Math.abs(u);
    	if (h < a) return "just now";

    	var i,
    		m,
    		s = {
    			year: h / t,
    			month: h % t / f,
    			day: h % f / e,
    			hour: h % e / r,
    			minute: h % r / a
    		},
    		w = [],
    		g = o.max || a;

    	for (i in s) w.length < g && ((m = Math.floor(s[i])) || o.zero) && w.push(m + " " + (1 == m ? i : i + "s"));
    	return (g = ", ", (i = w.length) > 1 && o.and && (2 == i && (g = " "), w[--i] = "and " + w[i]), m = w.join(g), o.suffix && (m += u < 0 ? " ago" : " from now"), m);
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let videoInfo;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NoViews', slots, []);
    	let { queryParams = {} } = $$props;
    	let error = false;
    	let dispatch = createEventDispatcher();
    	let { fetchOpts = {} } = $$props;
    	let value = "";
    	let loading = false;
    	let { searchPattern = "[random_prefix][random_whitespace][random_number]" } = $$props;
    	let video;
    	let { maxViews = 1 } = $$props;
    	let THRESHOLD = 1;
    	onMount(() => THRESHOLD = parseInt(maxViews, 10));

    	async function findVid(iterations = 5, curr = []) {
    		if (iterations <= 0) {
    			console.log("Couldn't find");
    			$$invalidate(0, video = curr.sort((a, b) => a.statistics.viewCount - b.statistics.viewCount)[0]);
    			console.log(video);
    			return video;
    		}

    		const prefixes = `IMG,IMG_,IMG-,DSC`.split(",");
    		const whitespaces = ["-", "_", " "];
    		let pattern = searchPattern.replace(/\[random[ _-]number\]/g, () => Math.round(Math.random() * 9999)).replace(/\[random[ _-]prefix\]/g, () => prefixes[Math.floor(Math.random() * prefixes.length)]).replace(/\[random[ _-]whitespace\]/g, () => whitespaces[Math.floor(Math.random() * whitespaces.length)]);
    		let json = await fetch(`https://www.googleapis.com/youtube/v3/search?q=${pattern}&part=snippet&${new URLSearchParams(queryParams).toString()}&type=video&videoEmbeddable=true`, fetchOpts).then(r => r.json());
    		console.log(json);

    		if (json.error) {
    			console.error(json);
    			throw new Error("There was an error");
    		}

    		let vids = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${json.items.map(i => i.id.videoId).join(",")}&part=statistics,snippet&${new URLSearchParams(queryParams).toString()}&type=video&videoEmbeddable=true`, fetchOpts).then(r => r.json()).then(a => a.items);
    		const found = vids.find(i => i.statistics.viewCount <= THRESHOLD);

    		if (found) {
    			console.log("Found: ", found);
    			return $$invalidate(0, video = found);
    		} else {
    			return findVid(iterations - 1, [...curr, ...vids]);
    		}
    	}

    	async function clicked() {
    		$$invalidate(2, loading = true);
    		$$invalidate(1, error = false);

    		try {
    			await findVid(5);
    		} catch(e) {
    			$$invalidate(1, error = true);
    			$$invalidate(0, video = null);
    			$$invalidate(2, loading = false);
    		}

    		$$invalidate(2, loading = false);
    	}

    	const writable_props = ['queryParams', 'fetchOpts', 'searchPattern', 'maxViews'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<NoViews> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("settings");

    	$$self.$$set = $$props => {
    		if ('queryParams' in $$props) $$invalidate(6, queryParams = $$props.queryParams);
    		if ('fetchOpts' in $$props) $$invalidate(7, fetchOpts = $$props.fetchOpts);
    		if ('searchPattern' in $$props) $$invalidate(8, searchPattern = $$props.searchPattern);
    		if ('maxViews' in $$props) $$invalidate(9, maxViews = $$props.maxViews);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		queryParams,
    		error,
    		dispatch,
    		fetchOpts,
    		value,
    		loading,
    		searchPattern,
    		video,
    		maxViews,
    		THRESHOLD,
    		onMount,
    		findVid,
    		clicked,
    		niceslice,
    		fromNow,
    		videoInfo
    	});

    	$$self.$inject_state = $$props => {
    		if ('queryParams' in $$props) $$invalidate(6, queryParams = $$props.queryParams);
    		if ('error' in $$props) $$invalidate(1, error = $$props.error);
    		if ('dispatch' in $$props) $$invalidate(4, dispatch = $$props.dispatch);
    		if ('fetchOpts' in $$props) $$invalidate(7, fetchOpts = $$props.fetchOpts);
    		if ('value' in $$props) value = $$props.value;
    		if ('loading' in $$props) $$invalidate(2, loading = $$props.loading);
    		if ('searchPattern' in $$props) $$invalidate(8, searchPattern = $$props.searchPattern);
    		if ('video' in $$props) $$invalidate(0, video = $$props.video);
    		if ('maxViews' in $$props) $$invalidate(9, maxViews = $$props.maxViews);
    		if ('THRESHOLD' in $$props) THRESHOLD = $$props.THRESHOLD;
    		if ('videoInfo' in $$props) $$invalidate(3, videoInfo = $$props.videoInfo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*video*/ 1) {
    			$$invalidate(3, videoInfo = video?.snippet);
    		}
    	};

    	return [
    		video,
    		error,
    		loading,
    		videoInfo,
    		dispatch,
    		clicked,
    		queryParams,
    		fetchOpts,
    		searchPattern,
    		maxViews,
    		click_handler
    	];
    }

    class NoViews extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			queryParams: 6,
    			fetchOpts: 7,
    			searchPattern: 8,
    			maxViews: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NoViews",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get queryParams() {
    		throw new Error_1("<NoViews>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set queryParams(value) {
    		throw new Error_1("<NoViews>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fetchOpts() {
    		throw new Error_1("<NoViews>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fetchOpts(value) {
    		throw new Error_1("<NoViews>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get searchPattern() {
    		throw new Error_1("<NoViews>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set searchPattern(value) {
    		throw new Error_1("<NoViews>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxViews() {
    		throw new Error_1("<NoViews>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxViews(value) {
    		throw new Error_1("<NoViews>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Select.svelte generated by Svelte v3.50.1 */
    const file$2 = "src/Select.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (27:2) {#each options as option}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[7].label + "";
    	let t;
    	let option_selected_value;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.selected = option_selected_value = /*option*/ ctx[7].value === /*value*/ ctx[1];
    			option.__value = option_value_value = /*option*/ ctx[7].value;
    			option.value = option.__value;
    			add_location(option, file$2, 27, 4, 583);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*options*/ 1 && t_value !== (t_value = /*option*/ ctx[7].label + "")) set_data_dev(t, t_value);

    			if (dirty & /*options, value*/ 3 && option_selected_value !== (option_selected_value = /*option*/ ctx[7].value === /*value*/ ctx[1])) {
    				prop_dev(option, "selected", option_selected_value);
    			}

    			if (dirty & /*options*/ 1 && option_value_value !== (option_value_value = /*option*/ ctx[7].value)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(27:2) {#each options as option}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let select;
    	let mounted;
    	let dispose;
    	let each_value = /*options*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let select_levels = [/*$$props*/ ctx[3]];
    	let select_data = {};

    	for (let i = 0; i < select_levels.length; i += 1) {
    		select_data = assign(select_data, select_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_attributes(select, select_data);
    			if (/*value*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[4].call(select));
    			add_location(select, file$2, 25, 0, 479);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			(select_data.multiple ? select_options : select_option)(select, select_data.value);
    			if (select.autofocus) select.focus();
    			select_option(select, /*value*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[4]),
    					listen_dev(select, "blur", /*blur_handler*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*options, value*/ 3) {
    				each_value = /*options*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			set_attributes(select, select_data = get_spread_update(select_levels, [dirty & /*$$props*/ 8 && /*$$props*/ ctx[3]]));
    			if (dirty & /*$$props*/ 8 && 'value' in select_data) (select_data.multiple ? select_options : select_option)(select, select_data.value);

    			if (dirty & /*value, options*/ 3) {
    				select_option(select, /*value*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots('Select', slots, []);
    	let { options = [] } = $$props;
    	let { value = "" } = $$props;
    	let selectedIdx = 2;
    	let dispatch = createEventDispatcher();

    	onMount(() => {
    		$$invalidate(0, options = options.map(i => {
    			if (typeof i === "string") {
    				return {
    					label: i[0].toUpperCase() + i.slice(1),
    					value: i
    				};
    			}

    			return i;
    		}));

    		if (!value) {
    			$$invalidate(1, value = options[0].value);
    		}
    	});

    	function select_change_handler() {
    		value = select_value(this);
    		$$invalidate(1, value);
    		$$invalidate(0, options);
    	}

    	const blur_handler = e => dispatch("change", e);

    	$$self.$$set = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('options' in $$new_props) $$invalidate(0, options = $$new_props.options);
    		if ('value' in $$new_props) $$invalidate(1, value = $$new_props.value);
    	};

    	$$self.$capture_state = () => ({
    		options,
    		value,
    		selectedIdx,
    		onMount,
    		createEventDispatcher,
    		dispatch
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), $$new_props));
    		if ('options' in $$props) $$invalidate(0, options = $$new_props.options);
    		if ('value' in $$props) $$invalidate(1, value = $$new_props.value);
    		if ('selectedIdx' in $$props) selectedIdx = $$new_props.selectedIdx;
    		if ('dispatch' in $$props) $$invalidate(2, dispatch = $$new_props.dispatch);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [options, value, dispatch, $$props, select_change_handler, blur_handler];
    }

    class Select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { options: 0, value: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Select",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get options() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var languages = {
      aa: "Afar",
      ab: "Abkhazian",
      ae: "Avestan",
      af: "Afrikaans",
      ak: "Akan",
      am: "Amharic",
      an: "Aragonese",
      ar: "Arabic",
      as: "Assamese",
      av: "Avaric",
      ay: "Aymara",
      az: "Azerbaijani",
      ba: "Bashkir",
      be: "Belarusian",
      bg: "Bulgarian",
      bh: "Bihari languages",
      bi: "Bislama",
      bm: "Bambara",
      bn: "Bengali",
      bo: "Tibetan",
      br: "Breton",
      bs: "Bosnian",
      ca: "Catalan",
      ce: "Chechen",
      ch: "Chamorro",
      co: "Corsican",
      cr: "Cree",
      cs: "Czech",
      cu: "Church Slavic",
      cv: "Chuvash",
      cy: "Welsh",
      da: "Danish",
      de: "German",
      dv: "Maldivian",
      dz: "Dzongkha",
      ee: "Ewe",
      el: "Greek",
      en: "English",
      eo: "Esperanto",
      es: "Spanish",
      et: "Estonian",
      eu: "Basque",
      fa: "Persian",
      ff: "Fulah",
      fi: "Finnish",
      fj: "Fijian",
      fo: "Faroese",
      fr: "French",
      fy: "Western Frisian",
      ga: "Irish",
      gd: "Gaelic",
      gl: "Galician",
      gn: "Guarani",
      gu: "Gujarati",
      gv: "Manx",
      ha: "Hausa",
      he: "Hebrew",
      hi: "Hindi",
      ho: "Hiri Motu",
      hr: "Croatian",
      ht: "Haitian",
      hu: "Hungarian",
      hy: "Armenian",
      hz: "Herero",
      ia: "Interlingua",
      id: "Indonesian",
      ie: "Interlingue",
      ig: "Igbo",
      ii: "Sichuan Yi",
      ik: "Inupiaq",
      io: "Ido",
      is: "Icelandic",
      it: "Italian",
      iu: "Inuktitut",
      ja: "Japanese",
      jv: "Javanese",
      ka: "Georgian",
      kg: "Kongo",
      ki: "Kikuyu",
      kj: "Kuanyama",
      kk: "Kazakh",
      kl: "Kalaallisut",
      km: "Central Khmer",
      kn: "Kannada",
      ko: "Korean",
      kr: "Kanuri",
      ks: "Kashmiri",
      ku: "Kurdish",
      kv: "Komi",
      kw: "Cornish",
      ky: "Kirghiz",
      la: "Latin",
      lb: "Luxembourgish",
      lg: "Ganda",
      li: "Limburgan",
      ln: "Lingala",
      lo: "Lao",
      lt: "Lithuanian",
      lu: "Luba-Katanga",
      lv: "Latvian",
      mg: "Malagasy",
      mh: "Marshallese",
      mi: "Maori",
      mk: "Macedonian",
      ml: "Malayalam",
      mn: "Mongolian",
      mr: "Marathi",
      ms: "Malay",
      mt: "Maltese",
      my: "Burmese",
      na: "Nauru",
      nb: "Norwegian",
      nd: "North Ndebele",
      ne: "Nepali",
      ng: "Ndonga",
      nl: "Dutch",
      nn: "Norwegian",
      no: "Norwegian",
      nr: "South Ndebele",
      nv: "Navajo",
      ny: "Chichewa",
      oc: "Occitan",
      oj: "Ojibwa",
      om: "Oromo",
      or: "Oriya",
      os: "Ossetic",
      pa: "Panjabi",
      pi: "Pali",
      pl: "Polish",
      ps: "Pushto",
      pt: "Portuguese",
      qu: "Quechua",
      rm: "Romansh",
      rn: "Rundi",
      ro: "Romanian",
      ru: "Russian",
      rw: "Kinyarwanda",
      sa: "Sanskrit",
      sc: "Sardinian",
      sd: "Sindhi",
      se: "Northern Sami",
      sg: "Sango",
      si: "Sinhala",
      sk: "Slovak",
      sl: "Slovenian",
      sm: "Samoan",
      sn: "Shona",
      so: "Somali",
      sq: "Albanian",
      sr: "Serbian",
      ss: "Swati",
      st: "Sotho, Southern",
      su: "Sundanese",
      sv: "Swedish",
      sw: "Swahili",
      ta: "Tamil",
      te: "Telugu",
      tg: "Tajik",
      th: "Thai",
      ti: "Tigrinya",
      tk: "Turkmen",
      tl: "Tagalog",
      tn: "Tswana",
      to: "Tonga",
      tr: "Turkish",
      ts: "Tsonga",
      tt: "Tatar",
      tw: "Twi",
      ty: "Tahitian",
      ug: "Uighur",
      uk: "Ukrainian",
      ur: "Urdu",
      uz: "Uzbek",
      ve: "Venda",
      vi: "Vietnamese",
      vo: "Volapük",
      wa: "Walloon",
      wo: "Wolof",
      xh: "Xhosa",
      yi: "Yiddish",
      yo: "Yoruba",
      za: "Zhuang",
      zh: "Chinese",
      zu: "Zulu",
    };

    /* src/Settings.svelte generated by Svelte v3.50.1 */

    const { Object: Object_1$1 } = globals;
    const file$1 = "src/Settings.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let button;
    	let svg;
    	let path;
    	let t0;
    	let h2;
    	let t2;
    	let span0;
    	let t4;
    	let label0;
    	let t6;
    	let input0;
    	let t7;
    	let label1;
    	let t9;
    	let span1;
    	let t11;
    	let input1;
    	let t12;
    	let label2;
    	let t14;
    	let select0;
    	let updating_value;
    	let t15;
    	let label3;
    	let t17;
    	let input2;
    	let t18;
    	let label4;
    	let t20;
    	let input3;
    	let t21;
    	let label5;
    	let t23;
    	let select1;
    	let updating_value_1;
    	let t24;
    	let label6;
    	let t26;
    	let select2;
    	let updating_value_2;
    	let current;
    	let mounted;
    	let dispose;

    	function select0_value_binding(value) {
    		/*select0_value_binding*/ ctx[8](value);
    	}

    	let select0_props = {
    		id: "videoDuration",
    		options: ["any", "short", "medium", "long"]
    	};

    	if (/*opts*/ ctx[0].videoDuration !== void 0) {
    		select0_props.value = /*opts*/ ctx[0].videoDuration;
    	}

    	select0 = new Select({ props: select0_props, $$inline: true });
    	binding_callbacks.push(() => bind(select0, 'value', select0_value_binding));

    	function select1_value_binding(value) {
    		/*select1_value_binding*/ ctx[11](value);
    	}

    	let select1_props = {
    		id: "language",
    		options: Object.entries(languages).map(func)
    	};

    	if (/*opts*/ ctx[0].language !== void 0) {
    		select1_props.value = /*opts*/ ctx[0].language;
    	}

    	select1 = new Select({ props: select1_props, $$inline: true });
    	binding_callbacks.push(() => bind(select1, 'value', select1_value_binding));

    	function select2_value_binding(value) {
    		/*select2_value_binding*/ ctx[12](value);
    	}

    	let select2_props = { options: ["none", "moderate", "strict"] };

    	if (/*opts*/ ctx[0].safeSearch !== void 0) {
    		select2_props.value = /*opts*/ ctx[0].safeSearch;
    	}

    	select2 = new Select({ props: select2_props, $$inline: true });
    	binding_callbacks.push(() => bind(select2, 'value', select2_value_binding));

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			h2 = element("h2");
    			h2.textContent = "Settings";
    			t2 = space();
    			span0 = element("span");
    			span0.textContent = "Filter search results";
    			t4 = space();
    			label0 = element("label");
    			label0.textContent = "Maximum views:";
    			t6 = space();
    			input0 = element("input");
    			t7 = space();
    			label1 = element("label");
    			label1.textContent = "Search pattern:";
    			t9 = space();
    			span1 = element("span");
    			span1.textContent = "Use \"[random_number]\", \"[random_prefix]\" and \"[random_whitespace]\" to randomize";
    			t11 = space();
    			input1 = element("input");
    			t12 = space();
    			label2 = element("label");
    			label2.textContent = "Length:";
    			t14 = space();
    			create_component(select0.$$.fragment);
    			t15 = space();
    			label3 = element("label");
    			label3.textContent = "Published after:";
    			t17 = space();
    			input2 = element("input");
    			t18 = space();
    			label4 = element("label");
    			label4.textContent = "Published before:";
    			t20 = space();
    			input3 = element("input");
    			t21 = space();
    			label5 = element("label");
    			label5.textContent = "Language for search results:";
    			t23 = space();
    			create_component(select1.$$.fragment);
    			t24 = space();
    			label6 = element("label");
    			label6.textContent = "Safesearch";
    			t26 = space();
    			create_component(select2.$$.fragment);
    			attr_dev(path, "fill", "currentColor");
    			attr_dev(path, "d", "M340.2 160l-84.4 84.3-84-83.9-11.8 11.8 84 83.8-84 83.9 11.8 11.7 84-83.8 84.4 84.2 11.8-11.7-84.4-84.3 84.4-84.2z");
    			add_location(path, file$1, 34, 9, 1036);
    			attr_dev(svg, "width", "32");
    			attr_dev(svg, "height", "32");
    			attr_dev(svg, "viewBox", "0 0 512 512");
    			add_location(svg, file$1, 33, 6, 977);
    			attr_dev(button, "class", "close svelte-v9lr0e");
    			add_location(button, file$1, 32, 4, 913);
    			attr_dev(h2, "class", "svelte-v9lr0e");
    			add_location(h2, file$1, 40, 4, 1243);
    			attr_dev(span0, "class", "desc");
    			set_style(span0, "text-align", "center");
    			set_style(span0, "width", "100%");
    			add_location(span0, file$1, 41, 4, 1265);
    			attr_dev(label0, "for", "maxViews");
    			attr_dev(label0, "class", "svelte-v9lr0e");
    			add_location(label0, file$1, 43, 4, 1380);
    			attr_dev(input0, "type", "number");
    			add_location(input0, file$1, 44, 4, 1429);
    			attr_dev(label1, "for", "searchPattern");
    			attr_dev(label1, "class", "svelte-v9lr0e");
    			add_location(label1, file$1, 46, 4, 1511);
    			attr_dev(span1, "class", "desc");
    			add_location(span1, file$1, 47, 4, 1566);
    			attr_dev(input1, "type", "text");
    			add_location(input1, file$1, 48, 4, 1676);
    			attr_dev(label2, "for", "videoDuration");
    			attr_dev(label2, "class", "length_label svelte-v9lr0e");
    			add_location(label2, file$1, 50, 4, 1753);
    			attr_dev(label3, "for", "publishedAfter");
    			attr_dev(label3, "class", "publishedAfter svelte-v9lr0e");
    			add_location(label3, file$1, 57, 4, 1983);
    			attr_dev(input2, "id", "publishedAfter");
    			attr_dev(input2, "type", "date");
    			add_location(input2, file$1, 58, 4, 2063);
    			attr_dev(label4, "for", "publishedBefore");
    			attr_dev(label4, "class", "publishedBefore svelte-v9lr0e");
    			add_location(label4, file$1, 60, 4, 2203);
    			attr_dev(input3, "id", "publishedBefore");
    			attr_dev(input3, "type", "date");
    			add_location(input3, file$1, 63, 4, 2298);
    			attr_dev(label5, "for", "language");
    			attr_dev(label5, "class", "language svelte-v9lr0e");
    			add_location(label5, file$1, 65, 4, 2432);
    			attr_dev(label6, "for", "safeSearch");
    			attr_dev(label6, "class", "svelte-v9lr0e");
    			add_location(label6, file$1, 75, 4, 2715);
    			attr_dev(div0, "class", "settings svelte-v9lr0e");
    			add_location(div0, file$1, 31, 2, 886);
    			attr_dev(div1, "class", "settings_wrapper svelte-v9lr0e");
    			add_location(div1, file$1, 30, 0, 853);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(div0, t0);
    			append_dev(div0, h2);
    			append_dev(div0, t2);
    			append_dev(div0, span0);
    			append_dev(div0, t4);
    			append_dev(div0, label0);
    			append_dev(div0, t6);
    			append_dev(div0, input0);
    			set_input_value(input0, /*opts*/ ctx[0].maxViews);
    			append_dev(div0, t7);
    			append_dev(div0, label1);
    			append_dev(div0, t9);
    			append_dev(div0, span1);
    			append_dev(div0, t11);
    			append_dev(div0, input1);
    			set_input_value(input1, /*opts*/ ctx[0].searchPattern);
    			append_dev(div0, t12);
    			append_dev(div0, label2);
    			append_dev(div0, t14);
    			mount_component(select0, div0, null);
    			append_dev(div0, t15);
    			append_dev(div0, label3);
    			append_dev(div0, t17);
    			append_dev(div0, input2);
    			/*input2_binding*/ ctx[9](input2);
    			append_dev(div0, t18);
    			append_dev(div0, label4);
    			append_dev(div0, t20);
    			append_dev(div0, input3);
    			/*input3_binding*/ ctx[10](input3);
    			append_dev(div0, t21);
    			append_dev(div0, label5);
    			append_dev(div0, t23);
    			mount_component(select1, div0, null);
    			append_dev(div0, t24);
    			append_dev(div0, label6);
    			append_dev(div0, t26);
    			mount_component(select2, div0, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[6]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[7]),
    					listen_dev(input2, "change", /*change*/ ctx[4], false, false, false),
    					listen_dev(input2, "keyup", /*change*/ ctx[4], false, false, false),
    					listen_dev(input3, "change", /*change*/ ctx[4], false, false, false),
    					listen_dev(input3, "keyup", /*change*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*opts*/ 1 && to_number(input0.value) !== /*opts*/ ctx[0].maxViews) {
    				set_input_value(input0, /*opts*/ ctx[0].maxViews);
    			}

    			if (dirty & /*opts*/ 1 && input1.value !== /*opts*/ ctx[0].searchPattern) {
    				set_input_value(input1, /*opts*/ ctx[0].searchPattern);
    			}

    			const select0_changes = {};

    			if (!updating_value && dirty & /*opts*/ 1) {
    				updating_value = true;
    				select0_changes.value = /*opts*/ ctx[0].videoDuration;
    				add_flush_callback(() => updating_value = false);
    			}

    			select0.$set(select0_changes);
    			const select1_changes = {};

    			if (!updating_value_1 && dirty & /*opts*/ 1) {
    				updating_value_1 = true;
    				select1_changes.value = /*opts*/ ctx[0].language;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			select1.$set(select1_changes);
    			const select2_changes = {};

    			if (!updating_value_2 && dirty & /*opts*/ 1) {
    				updating_value_2 = true;
    				select2_changes.value = /*opts*/ ctx[0].safeSearch;
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			select2.$set(select2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(select0.$$.fragment, local);
    			transition_in(select1.$$.fragment, local);
    			transition_in(select2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(select0.$$.fragment, local);
    			transition_out(select1.$$.fragment, local);
    			transition_out(select2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(select0);
    			/*input2_binding*/ ctx[9](null);
    			/*input3_binding*/ ctx[10](null);
    			destroy_component(select1);
    			destroy_component(select2);
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

    const func = i => ({ value: i[0], label: i[1] });

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Settings', slots, []);
    	let { opts = {} } = $$props;
    	let publishedAfter, publishedBefore;
    	let dispatch = createEventDispatcher();

    	onMount(() => {
    		$$invalidate(0, opts = {
    			publishedAfter: new Date("January 1, 2000"),
    			publishedBefore: new Date(),
    			language: "en",
    			maxViews: 1,
    			searchPattern: "[random_prefix][random_whitespace][random_number]",
    			videoDuration: "any",
    			safeSearch: "moderate",
    			...opts
    		});

    		$$invalidate(1, publishedAfter.valueAsDate = new Date(opts.publishedAfter), publishedAfter);
    		$$invalidate(2, publishedBefore.valueAsDate = new Date(opts.publishedBefore), publishedBefore);
    	});

    	function change() {
    		$$invalidate(0, opts.publishedAfter = publishedAfter.valueAsDate, opts);
    		$$invalidate(0, opts.publishedBefore = publishedBefore.valueAsDate, opts);
    	}

    	const writable_props = ['opts'];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("close");

    	function input0_input_handler() {
    		opts.maxViews = to_number(this.value);
    		$$invalidate(0, opts);
    	}

    	function input1_input_handler() {
    		opts.searchPattern = this.value;
    		$$invalidate(0, opts);
    	}

    	function select0_value_binding(value) {
    		if ($$self.$$.not_equal(opts.videoDuration, value)) {
    			opts.videoDuration = value;
    			$$invalidate(0, opts);
    		}
    	}

    	function input2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			publishedAfter = $$value;
    			$$invalidate(1, publishedAfter);
    		});
    	}

    	function input3_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			publishedBefore = $$value;
    			$$invalidate(2, publishedBefore);
    		});
    	}

    	function select1_value_binding(value) {
    		if ($$self.$$.not_equal(opts.language, value)) {
    			opts.language = value;
    			$$invalidate(0, opts);
    		}
    	}

    	function select2_value_binding(value) {
    		if ($$self.$$.not_equal(opts.safeSearch, value)) {
    			opts.safeSearch = value;
    			$$invalidate(0, opts);
    		}
    	}

    	$$self.$$set = $$props => {
    		if ('opts' in $$props) $$invalidate(0, opts = $$props.opts);
    	};

    	$$self.$capture_state = () => ({
    		Select,
    		languages,
    		opts,
    		onMount,
    		createEventDispatcher,
    		publishedAfter,
    		publishedBefore,
    		dispatch,
    		change
    	});

    	$$self.$inject_state = $$props => {
    		if ('opts' in $$props) $$invalidate(0, opts = $$props.opts);
    		if ('publishedAfter' in $$props) $$invalidate(1, publishedAfter = $$props.publishedAfter);
    		if ('publishedBefore' in $$props) $$invalidate(2, publishedBefore = $$props.publishedBefore);
    		if ('dispatch' in $$props) $$invalidate(3, dispatch = $$props.dispatch);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		opts,
    		publishedAfter,
    		publishedBefore,
    		dispatch,
    		change,
    		click_handler,
    		input0_input_handler,
    		input1_input_handler,
    		select0_value_binding,
    		input2_binding,
    		input3_binding,
    		select1_value_binding,
    		select2_value_binding
    	];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { opts: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get opts() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set opts(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.50.1 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src/App.svelte";

    // (167:2) {:else}
    function create_else_block_1(ctx) {
    	let noviews;
    	let current;

    	noviews = new NoViews({
    			props: {
    				fetchOpts: {
    					headers: {
    						Authorization: `${/*info*/ ctx[3].token.token_type} ${/*info*/ ctx[3].token.access_token}`
    					}
    				},
    				maxViews: /*settings*/ ctx[0].maxViews || 1,
    				searchPattern: /*settings*/ ctx[0].searchPattern,
    				queryParams: /*queryParams*/ ctx[1]
    			},
    			$$inline: true
    		});

    	noviews.$on("settings", /*settings_handler*/ ctx[6]);

    	const block = {
    		c: function create() {
    			create_component(noviews.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(noviews, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const noviews_changes = {};

    			if (dirty & /*info*/ 8) noviews_changes.fetchOpts = {
    				headers: {
    					Authorization: `${/*info*/ ctx[3].token.token_type} ${/*info*/ ctx[3].token.access_token}`
    				}
    			};

    			if (dirty & /*settings*/ 1) noviews_changes.maxViews = /*settings*/ ctx[0].maxViews || 1;
    			if (dirty & /*settings*/ 1) noviews_changes.searchPattern = /*settings*/ ctx[0].searchPattern;
    			if (dirty & /*queryParams*/ 2) noviews_changes.queryParams = /*queryParams*/ ctx[1];
    			noviews.$set(noviews_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(noviews.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(noviews.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(noviews, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(167:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (158:2) {#if !info.signedIn}
    function create_if_block_1(ctx) {
    	let h2;
    	let t1;
    	let span;
    	let t3;
    	let button;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (!/*info*/ ctx[3].loaded) return create_if_block_2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "NoViews";
    			t1 = space();
    			span = element("span");
    			span.textContent = "Find a random YouTube video with 1 or less views";
    			t3 = space();
    			button = element("button");
    			if_block.c();
    			add_location(h2, file, 158, 4, 3906);
    			attr_dev(span, "class", "desc");
    			add_location(span, file, 159, 4, 3927);
    			button.disabled = button_disabled_value = !/*info*/ ctx[3].loaded;
    			attr_dev(button, "class", "button");
    			add_location(button, file, 160, 4, 4006);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button, anchor);
    			if_block.m(button, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}

    			if (dirty & /*info*/ 8 && button_disabled_value !== (button_disabled_value = !/*info*/ ctx[3].loaded)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(158:2) {#if !info.signedIn}",
    		ctx
    	});

    	return block;
    }

    // (165:45) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Go!");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(165:45) {:else}",
    		ctx
    	});

    	return block;
    }

    // (165:7) {#if !info.loaded}
    function create_if_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading libraries...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(165:7) {#if !info.loaded}",
    		ctx
    	});

    	return block;
    }

    // (180:2) {#if showSettings}
    function create_if_block(ctx) {
    	let settings_1;
    	let updating_opts;
    	let current;

    	function settings_1_opts_binding(value) {
    		/*settings_1_opts_binding*/ ctx[7](value);
    	}

    	let settings_1_props = {};

    	if (/*settings*/ ctx[0] !== void 0) {
    		settings_1_props.opts = /*settings*/ ctx[0];
    	}

    	settings_1 = new Settings({ props: settings_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(settings_1, 'opts', settings_1_opts_binding));
    	settings_1.$on("close", /*close_handler*/ ctx[8]);

    	const block = {
    		c: function create() {
    			create_component(settings_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(settings_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const settings_1_changes = {};

    			if (!updating_opts && dirty & /*settings*/ 1) {
    				updating_opts = true;
    				settings_1_changes.opts = /*settings*/ ctx[0];
    				add_flush_callback(() => updating_opts = false);
    			}

    			settings_1.$set(settings_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(settings_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(settings_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(settings_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(180:2) {#if showSettings}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let script;
    	let script_src_value;
    	let t0;
    	let div;
    	let current_block_type_index;
    	let if_block0;
    	let t1;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*info*/ ctx[3].signedIn) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*showSettings*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			script = element("script");
    			t0 = space();
    			div = element("div");
    			if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			if (!src_url_equal(script.src, script_src_value = "https://apis.google.com/js/api.js")) attr_dev(script, "src", script_src_value);
    			add_location(script, file, 153, 2, 3781);
    			attr_dev(div, "class", "container");
    			add_location(div, file, 156, 0, 3855);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, script);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			append_dev(div, t1);
    			if (if_block1) if_block1.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div, t1);
    			}

    			if (/*showSettings*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*showSettings*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(script);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
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

    function initClient() {
    	return new Promise(resolve => {
    			gapi.client.init({
    				// Your API key will be automatically added to the Discovery Document URLs.
    				discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"],
    				// clientId and scope are optional if auth is not required.
    				clientId: "624071780217-cp736o7egfe97s941dc2kvmv5o7oavbs.apps.googleusercontent.com",
    				scope: "https://www.googleapis.com/auth/youtube.readonly"
    			}).then(() => resolve());
    		});
    }

    async function until(fn, args = []) {
    	return new Promise(resolve => {
    			async function repeat() {
    				let result;

    				try {
    					result = fn(...args);
    				} catch(_) {
    					
    				}

    				if (!result) {
    					await requestAnimationFrame(repeat);
    				} else {
    					resolve(result);
    				}
    			}

    			repeat();
    		});
    }

    function formatDate(d) {
    	d = new Date(d.getTime() - Math.random() * 1000 * 60 * 60 * 24);

    	function pad(n) {
    		return n < 10 ? "0" + n : n;
    	}

    	return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()) + "T" + pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()) + "Z";
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let showSettings = false;
    	let settings = {};

    	let info = {
    		token: {},
    		loaded: false,
    		signedIn: false
    	};

    	let queryParams = {};

    	onMount(() => {
    		try {
    			$$invalidate(0, settings = JSON.parse(localStorage.settings));

    			if (typeof settings !== "object") {
    				$$invalidate(0, settings = {});
    			}
    		} catch(e) {
    			
    		}

    		$$invalidate(3, info.token = JSON.parse(localStorage?.token || "{}"), info);

    		if (typeof info.token !== "object" || !(info.token.access_token && info.token.expires_at && info.token.token_type) || info.token.expires_at < Date.now()) {
    			console.log(info.token, "invalid");
    			$$invalidate(3, info.token = {}, info);
    			$$invalidate(3, info.signedIn = false, info);
    		} else {
    			console.log("Signed in");
    			$$invalidate(3, info.signedIn = true, info);
    		}

    		Object.assign(window, { info, settings });

    		$$invalidate(0, settings = {
    			publishedAfter: new Date("January 1, 2000"),
    			publishedBefore: new Date(),
    			language: "en",
    			videoDuration: "any",
    			safeSearch: "moderate",
    			maxViews: 1,
    			...settings
    		});

    		start();

    		setInterval(
    			() => {
    				localStorage.setItem("settings", JSON.stringify(settings));
    			},
    			500
    		);
    	});

    	async function start() {
    		await until(() => window.gapi);
    		console.log(window.gapi);
    		console.log("GAPI loaded");

    		gapi.load("client", () => {
    			initClient().then(() => {
    				$$invalidate(3, info.loaded = true, info);
    			});
    		});
    	}

    	async function signin() {
    		const user = await gapi.auth2.getAuthInstance().signIn();
    		console.log(user);
    		let response = user.getAuthResponse();
    		$$invalidate(3, info.signedIn = true, info);
    		$$invalidate(3, info.token = response, info);
    		localStorage.setItem("token", JSON.stringify(info.token));
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => info.loaded && signin();
    	const settings_handler = () => $$invalidate(2, showSettings = true);

    	function settings_1_opts_binding(value) {
    		settings = value;
    		$$invalidate(0, settings);
    	}

    	const close_handler = () => $$invalidate(2, showSettings = false);

    	$$self.$capture_state = () => ({
    		NoViews,
    		Settings,
    		onMount,
    		showSettings,
    		settings,
    		info,
    		queryParams,
    		start,
    		initClient,
    		until,
    		signin,
    		formatDate
    	});

    	$$self.$inject_state = $$props => {
    		if ('showSettings' in $$props) $$invalidate(2, showSettings = $$props.showSettings);
    		if ('settings' in $$props) $$invalidate(0, settings = $$props.settings);
    		if ('info' in $$props) $$invalidate(3, info = $$props.info);
    		if ('queryParams' in $$props) $$invalidate(1, queryParams = $$props.queryParams);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*settings, queryParams*/ 3) {
    			{
    				for (let [key, value] of Object.entries(settings)) {
    					if (settings[key]) {
    						$$invalidate(1, queryParams[key] = value, queryParams);
    					} else {
    						delete queryParams[key];
    					}
    				}

    				if (settings.publishedAfter) {
    					$$invalidate(1, queryParams.publishedAfter = formatDate(new Date(settings.publishedAfter)), queryParams);
    				}

    				if (settings.publishedBefore) {
    					$$invalidate(1, queryParams.publishedBefore = formatDate(new Date(settings.publishedBefore)), queryParams);
    				}

    				delete queryParams.maxViews;
    				delete queryParams.searchPattern;
    			}
    		}
    	};

    	return [
    		settings,
    		queryParams,
    		showSettings,
    		info,
    		signin,
    		click_handler,
    		settings_handler,
    		settings_1_opts_binding,
    		close_handler
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

    var app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
