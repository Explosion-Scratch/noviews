
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
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
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
    function children(element) {
        return Array.from(element.childNodes);
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
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
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

    const { console: console_1$1 } = globals;
    const file$1 = "src/NoViews.svelte";

    // (95:19) 
    function create_if_block_4(ctx) {
    	let h2;
    	let t1;
    	let span;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "That's just sad bro";
    			t1 = space();
    			span = element("span");
    			span.textContent = "Find a random YouTube video with 1 or less views";
    			attr_dev(h2, "class", "svelte-4tcnaq");
    			add_location(h2, file$1, 95, 2, 2451);
    			attr_dev(span, "class", "desc svelte-4tcnaq");
    			add_location(span, file$1, 96, 2, 2482);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(95:19) ",
    		ctx
    	});

    	return block;
    }

    // (87:0) {#if video}
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
    			attr_dev(iframe, "class", "svelte-4tcnaq");
    			add_location(iframe, file$1, 87, 2, 2273);
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
    		source: "(87:0) {#if video}",
    		ctx
    	});

    	return block;
    }

    // (99:0) {#if videoInfo}
    function create_if_block_2(ctx) {
    	let div3;
    	let div1;
    	let a0;
    	let t0_value = /*videoInfo*/ ctx[2].title + "";
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
    	let t6_value = /*videoInfo*/ ctx[2].channelTitle + "";
    	let t6;
    	let a1_href_value;
    	let t7;
    	let div2;
    	let t8_value = fromNow(`2020-04-18T22:24:16Z`, { zero: false, max: 1 }) + "";
    	let t8;
    	let t9;

    	let t10_value = ((/*video*/ ctx[0].description?.trim()?.length)
    	? " – " + niceslice(/*videoInfo*/ ctx[2].description)
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
    			attr_dev(a0, "class", "title svelte-4tcnaq");
    			attr_dev(a0, "href", a0_href_value = "https://youtube.com/watch?v=" + /*video*/ ctx[0].id);
    			add_location(a0, file$1, 101, 6, 2632);
    			attr_dev(circle, "cx", "12");
    			attr_dev(circle, "cy", "12");
    			attr_dev(circle, "r", "2");
    			attr_dev(circle, "class", "svelte-4tcnaq");
    			add_location(circle, file$1, 112, 13, 3000);
    			attr_dev(path0, "d", "M22 12c-2.667 4.667-6 7-10 7s-7.333-2.333-10-7c2.667-4.667 6-7 10-7s7.333 2.333 10 7");
    			attr_dev(path0, "class", "svelte-4tcnaq");
    			add_location(path0, file$1, 112, 45, 3032);
    			attr_dev(g, "fill", "none");
    			attr_dev(g, "stroke", "currentColor");
    			attr_dev(g, "stroke-linecap", "round");
    			attr_dev(g, "stroke-linejoin", "round");
    			attr_dev(g, "stroke-width", "2");
    			attr_dev(g, "class", "svelte-4tcnaq");
    			add_location(g, file$1, 106, 11, 2826);
    			attr_dev(svg0, "width", "32");
    			attr_dev(svg0, "height", "32");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "class", "svelte-4tcnaq");
    			add_location(svg0, file$1, 105, 8, 2767);
    			attr_dev(div0, "class", "views svelte-4tcnaq");
    			add_location(div0, file$1, 104, 6, 2739);
    			attr_dev(div1, "class", "heading svelte-4tcnaq");
    			add_location(div1, file$1, 100, 4, 2604);
    			attr_dev(path1, "fill", "currentColor");
    			attr_dev(path1, "d", "M16 8a5 5 0 1 0 5 5a5 5 0 0 0-5-5Zm0 8a3 3 0 1 1 3-3a3.003 3.003 0 0 1-3 3Z");
    			attr_dev(path1, "class", "svelte-4tcnaq");
    			add_location(path1, file$1, 122, 9, 3391);
    			attr_dev(path2, "fill", "currentColor");
    			attr_dev(path2, "d", "M16 2a14 14 0 1 0 14 14A14.016 14.016 0 0 0 16 2Zm-6 24.377V25a3.003 3.003 0 0 1 3-3h6a3.003 3.003 0 0 1 3 3v1.377a11.899 11.899 0 0 1-12 0Zm13.992-1.451A5.002 5.002 0 0 0 19 20h-6a5.002 5.002 0 0 0-4.992 4.926a12 12 0 1 1 15.985 0Z");
    			attr_dev(path2, "class", "svelte-4tcnaq");
    			add_location(path2, file$1, 125, 10, 3527);
    			attr_dev(svg1, "width", "32");
    			attr_dev(svg1, "height", "32");
    			attr_dev(svg1, "viewBox", "0 0 32 32");
    			attr_dev(svg1, "class", "svelte-4tcnaq");
    			add_location(svg1, file$1, 121, 6, 3334);
    			attr_dev(a1, "class", "channel svelte-4tcnaq");
    			attr_dev(a1, "href", a1_href_value = "https://youtube.com/channel/" + /*videoInfo*/ ctx[2].channelId);
    			add_location(a1, file$1, 120, 4, 3251);
    			attr_dev(div2, "class", "desc svelte-4tcnaq");
    			add_location(div2, file$1, 132, 4, 3878);
    			attr_dev(div3, "class", "info svelte-4tcnaq");
    			add_location(div3, file$1, 99, 2, 2581);
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
    			if (dirty & /*videoInfo*/ 4 && t0_value !== (t0_value = /*videoInfo*/ ctx[2].title + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*video*/ 1 && a0_href_value !== (a0_href_value = "https://youtube.com/watch?v=" + /*video*/ ctx[0].id)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*video*/ 1 && t3_value !== (t3_value = /*video*/ ctx[0].statistics.viewCount + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*videoInfo*/ 4 && t6_value !== (t6_value = /*videoInfo*/ ctx[2].channelTitle + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*videoInfo*/ 4 && a1_href_value !== (a1_href_value = "https://youtube.com/channel/" + /*videoInfo*/ ctx[2].channelId)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*video, videoInfo*/ 5 && t10_value !== (t10_value = ((/*video*/ ctx[0].description?.trim()?.length)
    			? " – " + niceslice(/*videoInfo*/ ctx[2].description)
    			: "") + "")) set_data_dev(t10, t10_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(99:0) {#if videoInfo}",
    		ctx
    	});

    	return block;
    }

    // (143:0) {:else}
    function create_else_block$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	function select_block_type_2(ctx, dirty) {
    		if (/*video*/ ctx[0]) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if_block.c();
    			attr_dev(button, "class", "search svelte-4tcnaq");
    			add_location(button, file$1, 143, 2, 4169);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if_block.m(button, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*clicked*/ ctx[3], false, false, false);
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
    			if (detaching) detach_dev(button);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(143:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (141:0) {#if loading}
    function create_if_block$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Loading...";
    			attr_dev(span, "class", "loading desc svelte-4tcnaq");
    			add_location(span, file$1, 141, 2, 4114);
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
    		source: "(141:0) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (145:21) {:else}
    function create_else_block_1(ctx) {
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
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(145:21) {:else}",
    		ctx
    	});

    	return block;
    }

    // (145:4) {#if video}
    function create_if_block_1(ctx) {
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(145:4) {#if video}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let t0;
    	let t1;
    	let if_block2_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*video*/ ctx[0]) return create_if_block_3;
    		if (!/*loading*/ ctx[1]) return create_if_block_4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);
    	let if_block1 = /*videoInfo*/ ctx[2] && create_if_block_2(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*loading*/ ctx[1]) return create_if_block$1;
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
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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

    			if (/*videoInfo*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const THRESHOLD = 1;

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

    function instance$1($$self, $$props, $$invalidate) {
    	let videoInfo;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NoViews', slots, []);
    	let { fetchOpts = {} } = $$props;
    	let value = "";
    	let loading = false;
    	let video;
    	const prefixes = `IMG,IMG_,IMG-,DSC`.split(",");

    	async function findVid(iterations = 5, curr = []) {
    		if (iterations <= 0) {
    			console.log("Couldn't find");
    			$$invalidate(0, video = curr.sort((a, b) => a.statistics.viewCount - b.statistics.viewCount)[0]);
    			console.log(video);
    			return video;
    		}

    		let json = await fetch(`https://www.googleapis.com/youtube/v3/search?q=${prefixes[Math.floor(Math.random() * prefixes.length)]}${Math.round(Math.random() * 9999)}&part=snippet`, fetchOpts).then(r => r.json());
    		console.log(json);
    		let vids = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${json.items.map(i => i.id.videoId).join(",")}&part=statistics,snippet`, fetchOpts).then(r => r.json()).then(a => a.items);
    		const found = vids.find(i => i.statistics.viewCount <= THRESHOLD);

    		if (found) {
    			console.log("Found: ", found);
    			return $$invalidate(0, video = found);
    		} else {
    			return findVid(iterations - 1, [...curr, ...vids]);
    		}
    	}

    	async function clicked() {
    		$$invalidate(1, loading = true);
    		await findVid(5);
    		$$invalidate(1, loading = false);
    	}

    	const writable_props = ['fetchOpts'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<NoViews> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('fetchOpts' in $$props) $$invalidate(4, fetchOpts = $$props.fetchOpts);
    	};

    	$$self.$capture_state = () => ({
    		fetchOpts,
    		value,
    		loading,
    		video,
    		THRESHOLD,
    		prefixes,
    		findVid,
    		clicked,
    		niceslice,
    		fromNow,
    		videoInfo
    	});

    	$$self.$inject_state = $$props => {
    		if ('fetchOpts' in $$props) $$invalidate(4, fetchOpts = $$props.fetchOpts);
    		if ('value' in $$props) value = $$props.value;
    		if ('loading' in $$props) $$invalidate(1, loading = $$props.loading);
    		if ('video' in $$props) $$invalidate(0, video = $$props.video);
    		if ('videoInfo' in $$props) $$invalidate(2, videoInfo = $$props.videoInfo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*video*/ 1) {
    			$$invalidate(2, videoInfo = video?.snippet);
    		}
    	};

    	return [video, loading, videoInfo, clicked, fetchOpts];
    }

    class NoViews extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { fetchOpts: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NoViews",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get fetchOpts() {
    		throw new Error("<NoViews>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fetchOpts(value) {
    		throw new Error("<NoViews>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.50.1 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    // (69:2) {:else}
    function create_else_block(ctx) {
    	let noviews;
    	let current;

    	noviews = new NoViews({
    			props: {
    				fetchOpts: {
    					headers: {
    						Authorization: `${/*info*/ ctx[0].token.token_type} ${/*info*/ ctx[0].token.access_token}`
    					}
    				}
    			},
    			$$inline: true
    		});

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

    			if (dirty & /*info*/ 1) noviews_changes.fetchOpts = {
    				headers: {
    					Authorization: `${/*info*/ ctx[0].token.token_type} ${/*info*/ ctx[0].token.access_token}`
    				}
    			};

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
    		id: create_else_block.name,
    		type: "else",
    		source: "(69:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (65:2) {#if !info.signedIn}
    function create_if_block(ctx) {
    	let h2;
    	let t1;
    	let span;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "NoViews";
    			t1 = space();
    			span = element("span");
    			span.textContent = "Find a random YouTube video with 1 or less views";
    			t3 = space();
    			button = element("button");
    			button.textContent = "Signin";
    			add_location(h2, file, 65, 4, 1657);
    			attr_dev(span, "class", "desc");
    			add_location(span, file, 66, 4, 1678);
    			add_location(button, file, 67, 4, 1757);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*signin*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(65:2) {#if !info.signedIn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let script;
    	let script_src_value;
    	let t;
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*info*/ ctx[0].signedIn) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			script = element("script");
    			t = space();
    			div = element("div");
    			if_block.c();
    			if (!src_url_equal(script.src, script_src_value = "https://apis.google.com/js/api.js")) attr_dev(script, "src", script_src_value);
    			add_location(script, file, 60, 2, 1532);
    			attr_dev(div, "class", "container");
    			add_location(div, file, 63, 0, 1606);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, script);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
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
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(script);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
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

    async function start() {
    	await until(() => window.gapi);
    	console.log(window.gapi);
    	console.log("GAPI loaded");
    	gapi.load("client", initClient);
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

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let info = { token: {}, signedIn: false };
    	onMount(start);

    	async function signin() {
    		const user = await gapi.auth2.getAuthInstance().signIn();
    		console.log(user);
    		let response = user.getAuthResponse();
    		$$invalidate(0, info.signedIn = true, info);
    		$$invalidate(0, info.token = response, info);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		NoViews,
    		onMount,
    		info,
    		start,
    		initClient,
    		until,
    		signin
    	});

    	$$self.$inject_state = $$props => {
    		if ('info' in $$props) $$invalidate(0, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, signin];
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
