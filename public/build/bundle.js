
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
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

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
    }

    function create_animation(node, from, fn, params) {
        if (!from)
            return noop;
        const to = node.getBoundingClientRect();
        if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
            return noop;
        const { delay = 0, duration = 300, easing = identity, 
        // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
        start: start_time = now() + delay, 
        // @ts-ignore todo:
        end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
        let running = true;
        let started = false;
        let name;
        function start() {
            if (css) {
                name = create_rule(node, 0, 1, duration, delay, easing, css);
            }
            if (!delay) {
                started = true;
            }
        }
        function stop() {
            if (css)
                delete_rule(node, name);
            running = false;
        }
        loop(now => {
            if (!started && now >= start_time) {
                started = true;
            }
            if (started && now >= end) {
                tick(1, 0);
                stop();
            }
            if (!running) {
                return false;
            }
            if (started) {
                const p = now - start_time;
                const t = 0 + 1 * easing(p / duration);
                tick(t, 1 - t);
            }
            return true;
        });
        start();
        tick(0, 1);
        return stop;
    }
    function fix_position(node) {
        const style = getComputedStyle(node);
        if (style.position !== 'absolute' && style.position !== 'fixed') {
            const { width, height } = style;
            const a = node.getBoundingClientRect();
            node.style.position = 'absolute';
            node.style.width = width;
            node.style.height = height;
            add_transform(node, a);
        }
    }
    function add_transform(node, a) {
        const b = node.getBoundingClientRect();
        if (a.left !== b.left || a.top !== b.top) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
        }
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function fix_and_outro_and_destroy_block(block, lookup) {
        block.f();
        outro_and_destroy_block(block, lookup);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

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

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let notifications = writable([]);

    var toast = {
    	show(text, { timeout = 1000, dismissable = true } = {}) {
    		let id = Math.random().toString(36).slice(2);
    		notifications.update((i) => [
    			...i,
    			{
    				timer: setTimeout(() => {
    					this.hide(id);
    				}, timeout),
    				dismissable,
    				id,
    				text
    			}
    		]);
    		return {
    			dismiss() {
    				this.hide(id);
    			}
    		};
    	},
    	hide(id) {
    		notifications.update((i) => i.filter((j) => j.id !== id));
    	}
    };

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function quintOut(t) {
        return --t * t * t * t * t + 1;
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }
    function crossfade(_a) {
        var { fallback } = _a, defaults = __rest(_a, ["fallback"]);
        const to_receive = new Map();
        const to_send = new Map();
        function crossfade(from, node, params) {
            const { delay = 0, duration = d => Math.sqrt(d) * 30, easing = cubicOut } = assign(assign({}, defaults), params);
            const to = node.getBoundingClientRect();
            const dx = from.left - to.left;
            const dy = from.top - to.top;
            const dw = from.width / to.width;
            const dh = from.height / to.height;
            const d = Math.sqrt(dx * dx + dy * dy);
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            const opacity = +style.opacity;
            return {
                delay,
                duration: is_function(duration) ? duration(d) : duration,
                easing,
                css: (t, u) => `
				opacity: ${t * opacity};
				transform-origin: top left;
				transform: ${transform} translate(${u * dx}px,${u * dy}px) scale(${t + (1 - t) * dw}, ${t + (1 - t) * dh});
			`
            };
        }
        function transition(items, counterparts, intro) {
            return (node, params) => {
                items.set(params.key, {
                    rect: node.getBoundingClientRect()
                });
                return () => {
                    if (counterparts.has(params.key)) {
                        const { rect } = counterparts.get(params.key);
                        counterparts.delete(params.key);
                        return crossfade(rect, node, params);
                    }
                    // if the node is disappearing altogether
                    // (i.e. wasn't claimed by the other list)
                    // then we need to supply an outro
                    items.delete(params.key);
                    return fallback && fallback(node, params, intro);
                };
            };
        }
        return [
            transition(to_send, to_receive, false),
            transition(to_receive, to_send, true)
        ];
    }

    function flip(node, { from, to }, params = {}) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const [ox, oy] = style.transformOrigin.split(' ').map(parseFloat);
        const dx = (from.left + from.width * ox / to.width) - (to.left + ox);
        const dy = (from.top + from.height * oy / to.height) - (to.top + oy);
        const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
        return {
            delay,
            duration: is_function(duration) ? duration(Math.sqrt(dx * dx + dy * dy)) : duration,
            easing,
            css: (t, u) => {
                const x = u * dx;
                const y = u * dy;
                const sx = t + u * from.width / to.width;
                const sy = t + u * from.height / to.height;
                return `transform: ${transform} translate(${x}px, ${y}px) scale(${sx}, ${sy});`;
            }
        };
    }

    /* src/ToastContainer.svelte generated by Svelte v3.50.1 */
    const file$4 = "src/ToastContainer.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (44:3) {#if notif.dismissable}
    function create_if_block$2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "x";
    			attr_dev(button, "class", "dismiss svelte-4iqf5u");
    			add_location(button, file$4, 44, 4, 1000);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*del*/ ctx[1](/*notif*/ ctx[5].id))) /*del*/ ctx[1](/*notif*/ ctx[5].id).apply(this, arguments);
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
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(44:3) {#if notif.dismissable}",
    		ctx
    	});

    	return block;
    }

    // (36:1) {#each notifs as notif (notif.id)}
    function create_each_block$1(key_1, ctx) {
    	let div;
    	let span;
    	let t0_value = /*notif*/ ctx[5].text + "";
    	let t0;
    	let t1;
    	let t2;
    	let div_id_value;
    	let div_intro;
    	let div_outro;
    	let rect;
    	let stop_animation = noop;
    	let current;
    	let if_block = /*notif*/ ctx[5].dismissable && create_if_block$2(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			attr_dev(span, "id", "text");
    			attr_dev(span, "class", "svelte-4iqf5u");
    			add_location(span, file$4, 42, 3, 933);
    			attr_dev(div, "class", "notification svelte-4iqf5u");
    			attr_dev(div, "id", div_id_value = /*notif*/ ctx[5].id);
    			add_location(div, file$4, 36, 2, 781);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t2);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*notifs*/ 1) && t0_value !== (t0_value = /*notif*/ ctx[5].text + "")) set_data_dev(t0, t0_value);

    			if (/*notif*/ ctx[5].dismissable) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty & /*notifs*/ 1 && div_id_value !== (div_id_value = /*notif*/ ctx[5].id)) {
    				attr_dev(div, "id", div_id_value);
    			}
    		},
    		r: function measure() {
    			rect = div.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(div);
    			stop_animation();
    			add_transform(div, rect);
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(div, rect, flip, { duration: 200 });
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, /*receive*/ ctx[3], { key: /*notif*/ ctx[5].id });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, /*send*/ ctx[2], { key: /*notif*/ ctx[5].id });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(36:1) {#each notifs as notif (notif.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*notifs*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*notif*/ ctx[5].id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "id", "notifications_container");
    			attr_dev(div, "class", "svelte-4iqf5u");
    			add_location(div, file$4, 34, 0, 708);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*notifs, del*/ 3) {
    				each_value = /*notifs*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, fix_and_outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let notifs;
    	let $notifications;
    	validate_store(notifications, 'notifications');
    	component_subscribe($$self, notifications, $$value => $$invalidate(4, $notifications = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ToastContainer', slots, []);

    	function del(id) {
    		return () => {
    			set_store_value(notifications, $notifications = $notifications.filter(j => j.id !== id), $notifications);
    		};
    	}

    	const [send, receive] = crossfade({
    		duration: d => Math.sqrt(d * 200),
    		fallback(node, params) {
    			const style = getComputedStyle(node);
    			const transform = style.transform === 'none' ? '' : style.transform;

    			return {
    				duration: 600,
    				easing: quintOut,
    				css: t => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
    			};
    		}
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ToastContainer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		notifications,
    		del,
    		quintOut,
    		crossfade,
    		flip,
    		send,
    		receive,
    		notifs,
    		$notifications
    	});

    	$$self.$inject_state = $$props => {
    		if ('notifs' in $$props) $$invalidate(0, notifs = $$props.notifs);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$notifications*/ 16) {
    			$$invalidate(0, notifs = $notifications);
    		}
    	};

    	return [notifs, del, send, receive, $notifications];
    }

    class ToastContainer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ToastContainer",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/NoViews.svelte generated by Svelte v3.50.1 */

    const { Error: Error_1, console: console_1$1 } = globals;
    const file$3 = "src/NoViews.svelte";

    // (138:19) 
    function create_if_block_5$1(ctx) {
    	let h2;
    	let t1;
    	let t2;
    	let span;
    	let if_block = /*error*/ ctx[2] && create_if_block_6(ctx);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "NoViews";
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			span = element("span");
    			span.textContent = "Find a random YouTube video with 1 or less views";
    			attr_dev(h2, "class", "svelte-16if8ed");
    			add_location(h2, file$3, 138, 2, 3810);
    			attr_dev(span, "class", "desc svelte-16if8ed");
    			add_location(span, file$3, 142, 2, 3945);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*error*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_6(ctx);
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
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(138:19) ",
    		ctx
    	});

    	return block;
    }

    // (130:0) {#if video}
    function create_if_block_4$1(ctx) {
    	let iframe;
    	let iframe_src_value;
    	let iframe_title_value;

    	const block = {
    		c: function create() {
    			iframe = element("iframe");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://www.youtube.com/embed/" + /*video*/ ctx[1].id)) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "allow", "encrypted-media");
    			attr_dev(iframe, "title", iframe_title_value = /*video*/ ctx[1].title);
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = true;
    			attr_dev(iframe, "class", "svelte-16if8ed");
    			add_location(iframe, file$3, 130, 2, 3632);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, iframe, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*video*/ 2 && !src_url_equal(iframe.src, iframe_src_value = "https://www.youtube.com/embed/" + /*video*/ ctx[1].id)) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}

    			if (dirty & /*video*/ 2 && iframe_title_value !== (iframe_title_value = /*video*/ ctx[1].title)) {
    				attr_dev(iframe, "title", iframe_title_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(130:0) {#if video}",
    		ctx
    	});

    	return block;
    }

    // (140:2) {#if error}
    function create_if_block_6(ctx) {
    	let span;

    	let t_value = (typeof /*error*/ ctx[2] === "string"
    	? /*error*/ ctx[2]
    	: "There was an error") + "";

    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "error svelte-16if8ed");
    			add_location(span, file$3, 139, 13, 3840);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*error*/ 4 && t_value !== (t_value = (typeof /*error*/ ctx[2] === "string"
    			? /*error*/ ctx[2]
    			: "There was an error") + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(140:2) {#if error}",
    		ctx
    	});

    	return block;
    }

    // (145:0) {#if videoInfo}
    function create_if_block_3$1(ctx) {
    	let div3;
    	let div1;
    	let a0;
    	let t0_value = /*videoInfo*/ ctx[4].title + "";
    	let t0;
    	let a0_href_value;
    	let t1;
    	let div0;
    	let svg0;
    	let g;
    	let circle;
    	let path0;
    	let t2;
    	let t3_value = /*video*/ ctx[1].statistics.viewCount + "";
    	let t3;
    	let t4;
    	let a1;
    	let svg1;
    	let path1;
    	let path2;
    	let t5;
    	let t6_value = /*videoInfo*/ ctx[4].channelTitle + "";
    	let t6;
    	let a1_href_value;
    	let a1_data_tippy_content_value;
    	let t7;
    	let div2;
    	let span;
    	let t8_value = fromNow(/*videoInfo*/ ctx[4].publishedAt, { zero: false, max: 1 }) + "";
    	let t8;
    	let t9;
    	let span_data_tippy_content_value;
    	let t10;

    	let t11_value = ((/*video*/ ctx[1].description?.trim()?.length)
    	? " – " + niceslice(/*videoInfo*/ ctx[4].description)
    	: "") + "";

    	let t11;

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
    			span = element("span");
    			t8 = text(t8_value);
    			t9 = text(" ago");
    			t10 = space();
    			t11 = text(t11_value);
    			attr_dev(a0, "class", "title svelte-16if8ed");
    			attr_dev(a0, "href", a0_href_value = "https://youtube.com/watch?v=" + /*video*/ ctx[1].id);
    			add_location(a0, file$3, 147, 6, 4095);
    			attr_dev(circle, "cx", "12");
    			attr_dev(circle, "cy", "12");
    			attr_dev(circle, "r", "2");
    			attr_dev(circle, "class", "svelte-16if8ed");
    			add_location(circle, file$3, 158, 13, 4463);
    			attr_dev(path0, "d", "M22 12c-2.667 4.667-6 7-10 7s-7.333-2.333-10-7c2.667-4.667 6-7 10-7s7.333 2.333 10 7");
    			attr_dev(path0, "class", "svelte-16if8ed");
    			add_location(path0, file$3, 158, 45, 4495);
    			attr_dev(g, "fill", "none");
    			attr_dev(g, "stroke", "currentColor");
    			attr_dev(g, "stroke-linecap", "round");
    			attr_dev(g, "stroke-linejoin", "round");
    			attr_dev(g, "stroke-width", "2");
    			attr_dev(g, "class", "svelte-16if8ed");
    			add_location(g, file$3, 152, 11, 4289);
    			attr_dev(svg0, "width", "32");
    			attr_dev(svg0, "height", "32");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "class", "svelte-16if8ed");
    			add_location(svg0, file$3, 151, 8, 4230);
    			attr_dev(div0, "class", "views svelte-16if8ed");
    			add_location(div0, file$3, 150, 6, 4202);
    			attr_dev(div1, "class", "heading svelte-16if8ed");
    			add_location(div1, file$3, 146, 4, 4067);
    			attr_dev(path1, "fill", "currentColor");
    			attr_dev(path1, "d", "M16 8a5 5 0 1 0 5 5a5 5 0 0 0-5-5Zm0 8a3 3 0 1 1 3-3a3.003 3.003 0 0 1-3 3Z");
    			attr_dev(path1, "class", "svelte-16if8ed");
    			add_location(path1, file$3, 172, 9, 4940);
    			attr_dev(path2, "fill", "currentColor");
    			attr_dev(path2, "d", "M16 2a14 14 0 1 0 14 14A14.016 14.016 0 0 0 16 2Zm-6 24.377V25a3.003 3.003 0 0 1 3-3h6a3.003 3.003 0 0 1 3 3v1.377a11.899 11.899 0 0 1-12 0Zm13.992-1.451A5.002 5.002 0 0 0 19 20h-6a5.002 5.002 0 0 0-4.992 4.926a12 12 0 1 1 15.985 0Z");
    			attr_dev(path2, "class", "svelte-16if8ed");
    			add_location(path2, file$3, 175, 10, 5076);
    			attr_dev(svg1, "width", "32");
    			attr_dev(svg1, "height", "32");
    			attr_dev(svg1, "viewBox", "0 0 32 32");
    			attr_dev(svg1, "class", "svelte-16if8ed");
    			add_location(svg1, file$3, 171, 6, 4883);
    			attr_dev(a1, "class", "channel svelte-16if8ed");
    			attr_dev(a1, "href", a1_href_value = "https://youtube.com/channel/" + /*videoInfo*/ ctx[4].channelId);
    			attr_dev(a1, "data-tippy-content", a1_data_tippy_content_value = "Visit " + /*videoInfo*/ ctx[4].channelTitle + " on YouTube");
    			add_location(a1, file$3, 166, 4, 4714);
    			attr_dev(span, "data-tippy-content", span_data_tippy_content_value = /*videoInfo*/ ctx[4].publishedAt);
    			attr_dev(span, "class", "svelte-16if8ed");
    			add_location(span, file$3, 183, 6, 5452);
    			attr_dev(div2, "class", "desc svelte-16if8ed");
    			add_location(div2, file$3, 182, 4, 5427);
    			attr_dev(div3, "class", "info svelte-16if8ed");
    			add_location(div3, file$3, 145, 2, 4044);
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
    			append_dev(div2, span);
    			append_dev(span, t8);
    			append_dev(span, t9);
    			append_dev(div2, t10);
    			append_dev(div2, t11);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*videoInfo*/ 16 && t0_value !== (t0_value = /*videoInfo*/ ctx[4].title + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*video*/ 2 && a0_href_value !== (a0_href_value = "https://youtube.com/watch?v=" + /*video*/ ctx[1].id)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*video*/ 2 && t3_value !== (t3_value = /*video*/ ctx[1].statistics.viewCount + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*videoInfo*/ 16 && t6_value !== (t6_value = /*videoInfo*/ ctx[4].channelTitle + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*videoInfo*/ 16 && a1_href_value !== (a1_href_value = "https://youtube.com/channel/" + /*videoInfo*/ ctx[4].channelId)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*videoInfo*/ 16 && a1_data_tippy_content_value !== (a1_data_tippy_content_value = "Visit " + /*videoInfo*/ ctx[4].channelTitle + " on YouTube")) {
    				attr_dev(a1, "data-tippy-content", a1_data_tippy_content_value);
    			}

    			if (dirty & /*videoInfo*/ 16 && t8_value !== (t8_value = fromNow(/*videoInfo*/ ctx[4].publishedAt, { zero: false, max: 1 }) + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*videoInfo*/ 16 && span_data_tippy_content_value !== (span_data_tippy_content_value = /*videoInfo*/ ctx[4].publishedAt)) {
    				attr_dev(span, "data-tippy-content", span_data_tippy_content_value);
    			}

    			if (dirty & /*video, videoInfo*/ 18 && t11_value !== (t11_value = ((/*video*/ ctx[1].description?.trim()?.length)
    			? " – " + niceslice(/*videoInfo*/ ctx[4].description)
    			: "") + "")) set_data_dev(t11, t11_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(145:0) {#if videoInfo}",
    		ctx
    	});

    	return block;
    }

    // (195:0) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let button;
    	let t;
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	function select_block_type_2(ctx, dirty) {
    		if (/*video*/ ctx[1]) return create_if_block_2$1;
    		return create_else_block_1;
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
    			attr_dev(button, "class", "search button svelte-16if8ed");
    			add_location(button, file$3, 196, 4, 5815);
    			attr_dev(path, "fill", "currentColor");
    			attr_dev(path, "d", "m19.588 15.492l-1.814-1.29a6.483 6.483 0 0 0-.005-3.421l1.82-1.274l-1.453-2.514l-2.024.926a6.484 6.484 0 0 0-2.966-1.706L12.953 4h-2.906l-.193 2.213A6.483 6.483 0 0 0 6.889 7.92l-2.025-.926l-1.452 2.514l1.82 1.274a6.483 6.483 0 0 0-.006 3.42l-1.814 1.29l1.452 2.502l2.025-.927a6.483 6.483 0 0 0 2.965 1.706l.193 2.213h2.906l.193-2.213a6.484 6.484 0 0 0 2.965-1.706l2.025.927l1.453-2.501ZM13.505 2.985a.5.5 0 0 1 .5.477l.178 2.035a7.45 7.45 0 0 1 2.043 1.178l1.85-.863a.5.5 0 0 1 .662.195l2.005 3.47a.5.5 0 0 1-.162.671l-1.674 1.172c.128.798.124 1.593.001 2.359l1.673 1.17a.5.5 0 0 1 .162.672l-2.005 3.457a.5.5 0 0 1-.662.195l-1.85-.863c-.602.49-1.288.89-2.043 1.179l-.178 2.035a.5.5 0 0 1-.5.476h-4.01a.5.5 0 0 1-.5-.476l-.178-2.035a7.453 7.453 0 0 1-2.043-1.179l-1.85.863a.5.5 0 0 1-.663-.194L2.257 15.52a.5.5 0 0 1 .162-.671l1.673-1.171a7.45 7.45 0 0 1 0-2.359L2.42 10.148a.5.5 0 0 1-.162-.67L4.26 6.007a.5.5 0 0 1 .663-.195l1.85.863a7.45 7.45 0 0 1 2.043-1.178l.178-2.035a.5.5 0 0 1 .5-.477h4.01ZM11.5 9a3.5 3.5 0 1 1 0 7a3.5 3.5 0 0 1 0-7Zm0 1a2.5 2.5 0 1 0 0 5a2.5 2.5 0 0 0 0-5Z");
    			attr_dev(path, "class", "svelte-16if8ed");
    			add_location(path, file$3, 205, 7, 6075);
    			attr_dev(svg, "data-tippy-content", "Settings");
    			attr_dev(svg, "width", "32");
    			attr_dev(svg, "height", "32");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "class", "svelte-16if8ed");
    			add_location(svg, file$3, 199, 4, 5922);
    			attr_dev(div, "class", "buttons svelte-16if8ed");
    			add_location(div, file$3, 195, 2, 5789);
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
    					listen_dev(button, "click", /*clicked*/ ctx[6], false, false, false),
    					listen_dev(svg, "click", /*click_handler*/ ctx[11], false, false, false)
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
    		source: "(195:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (193:0) {#if loading}
    function create_if_block_1$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Loading...";
    			attr_dev(span, "class", "loading desc svelte-16if8ed");
    			add_location(span, file$3, 193, 2, 5734);
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(193:0) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (198:23) {:else}
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
    		source: "(198:23) {:else}",
    		ctx
    	});

    	return block;
    }

    // (198:6) {#if video}
    function create_if_block_2$1(ctx) {
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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(198:6) {#if video}",
    		ctx
    	});

    	return block;
    }

    // (214:0) {#if showSignout}
    function create_if_block$1(ctx) {
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill", "currentColor");
    			attr_dev(path, "d", "m221.7 133.7l-42 42a8.3 8.3 0 0 1-5.7 2.3a8 8 0 0 1-5.6-13.7l28.3-28.3H104a8 8 0 0 1 0-16h92.7l-28.3-28.3a8 8 0 0 1 11.3-11.4l42 42a8.1 8.1 0 0 1 0 11.4ZM104 208H48V48h56a8 8 0 0 0 0-16H48a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h56a8 8 0 0 0 0-16Z");
    			attr_dev(path, "class", "svelte-16if8ed");
    			add_location(path, file$3, 221, 5, 7445);
    			attr_dev(svg, "data-tippy-content", "Signout");
    			attr_dev(svg, "class", "signout svelte-16if8ed");
    			attr_dev(svg, "width", "32");
    			attr_dev(svg, "height", "32");
    			attr_dev(svg, "viewBox", "0 0 256 256");
    			add_location(svg, file$3, 214, 2, 7262);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(svg, "click", /*click_handler_1*/ ctx[12], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(214:0) {#if showSignout}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let if_block3_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*video*/ ctx[1]) return create_if_block_4$1;
    		if (!/*loading*/ ctx[3]) return create_if_block_5$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);
    	let if_block1 = /*videoInfo*/ ctx[4] && create_if_block_3$1(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*loading*/ ctx[3]) return create_if_block_1$1;
    		return create_else_block$1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block2 = current_block_type_1(ctx);
    	let if_block3 = /*showSignout*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			if_block3_anchor = empty();
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
    			insert_dev(target, t2, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, if_block3_anchor, anchor);
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

    			if (/*videoInfo*/ ctx[4]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3$1(ctx);
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
    					if_block2.m(t2.parentNode, t2);
    				}
    			}

    			if (/*showSignout*/ ctx[0]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$1(ctx);
    					if_block3.c();
    					if_block3.m(if_block3_anchor.parentNode, if_block3_anchor);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
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
    			if (detaching) detach_dev(t2);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(if_block3_anchor);
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
    	let { showSignout = true } = $$props;
    	let THRESHOLD = 1;
    	onMount(() => THRESHOLD = parseInt(maxViews, 10));

    	async function findVid(iterations = 5, curr = []) {
    		if (iterations <= 0) {
    			toast.show("Couldn't find a video with less than " + THRESHOLD + " views");
    			console.log("Couldn't find");
    			$$invalidate(1, video = curr.sort((a, b) => a.statistics.viewCount - b.statistics.viewCount)[0]);
    			console.log(video);
    			return video;
    		}

    		const prefixes = `IMG,IMG_,IMG-,DSC`.split(",");
    		const whitespaces = ["-", "_", " "];
    		let pattern = searchPattern.replace(/\[random[ _-]number\]/g, () => Math.round(Math.random() * 9999)).replace(/\[random[ _-]prefix\]/g, () => prefixes[Math.floor(Math.random() * prefixes.length)]).replace(/\[random[ _-]whitespace\]/g, () => whitespaces[Math.floor(Math.random() * whitespaces.length)]);
    		toast.show(`Searching for "${pattern}"`);
    		let json = await fetch(`https://www.googleapis.com/youtube/v3/search?q=${pattern}&part=snippet&${new URLSearchParams(queryParams).toString()}&type=video&videoEmbeddable=true`, fetchOpts).then(r => r.json());
    		console.log(json);

    		if (json.error) {
    			console.error(json);
    			throw new Error(json.error.message);
    		}

    		let vids = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${json.items.map(i => i.id.videoId).join(",")}&part=statistics,snippet&${new URLSearchParams(queryParams).toString()}&type=video&videoEmbeddable=true`, fetchOpts).then(r => r.json()).then(a => a.items);
    		const found = vids.find(i => i.statistics.viewCount <= THRESHOLD);

    		if (found) {
    			console.log("Found: ", found);
    			return $$invalidate(1, video = found);
    		} else {
    			return findVid(iterations - 1, [...curr, ...vids]);
    		}
    	}

    	async function clicked() {
    		$$invalidate(3, loading = true);
    		$$invalidate(2, error = false);
    		toast.show("Searching...");

    		try {
    			await findVid(5);
    		} catch(e) {
    			toast.show("There was an error");
    			$$invalidate(2, error = e.message || true);
    			$$invalidate(1, video = null);
    			$$invalidate(3, loading = false);
    		}

    		$$invalidate(3, loading = false);
    	}

    	const writable_props = ['queryParams', 'fetchOpts', 'searchPattern', 'maxViews', 'showSignout'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<NoViews> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("settings");
    	const click_handler_1 = () => (localStorage.clear(), location.reload());

    	$$self.$$set = $$props => {
    		if ('queryParams' in $$props) $$invalidate(7, queryParams = $$props.queryParams);
    		if ('fetchOpts' in $$props) $$invalidate(8, fetchOpts = $$props.fetchOpts);
    		if ('searchPattern' in $$props) $$invalidate(9, searchPattern = $$props.searchPattern);
    		if ('maxViews' in $$props) $$invalidate(10, maxViews = $$props.maxViews);
    		if ('showSignout' in $$props) $$invalidate(0, showSignout = $$props.showSignout);
    	};

    	$$self.$capture_state = () => ({
    		notifs: toast,
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
    		showSignout,
    		THRESHOLD,
    		onMount,
    		findVid,
    		clicked,
    		niceslice,
    		fromNow,
    		videoInfo
    	});

    	$$self.$inject_state = $$props => {
    		if ('queryParams' in $$props) $$invalidate(7, queryParams = $$props.queryParams);
    		if ('error' in $$props) $$invalidate(2, error = $$props.error);
    		if ('dispatch' in $$props) $$invalidate(5, dispatch = $$props.dispatch);
    		if ('fetchOpts' in $$props) $$invalidate(8, fetchOpts = $$props.fetchOpts);
    		if ('value' in $$props) value = $$props.value;
    		if ('loading' in $$props) $$invalidate(3, loading = $$props.loading);
    		if ('searchPattern' in $$props) $$invalidate(9, searchPattern = $$props.searchPattern);
    		if ('video' in $$props) $$invalidate(1, video = $$props.video);
    		if ('maxViews' in $$props) $$invalidate(10, maxViews = $$props.maxViews);
    		if ('showSignout' in $$props) $$invalidate(0, showSignout = $$props.showSignout);
    		if ('THRESHOLD' in $$props) THRESHOLD = $$props.THRESHOLD;
    		if ('videoInfo' in $$props) $$invalidate(4, videoInfo = $$props.videoInfo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*video*/ 2) {
    			$$invalidate(4, videoInfo = video?.snippet);
    		}
    	};

    	return [
    		showSignout,
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
    		click_handler,
    		click_handler_1
    	];
    }

    class NoViews extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			queryParams: 7,
    			fetchOpts: 8,
    			searchPattern: 9,
    			maxViews: 10,
    			showSignout: 0
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

    	get showSignout() {
    		throw new Error_1("<NoViews>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showSignout(value) {
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

    const { Object: Object_1, console: console_1, document: document_1 } = globals;
    const file = "src/App.svelte";

    // (208:2) {#if !info.signedIn && !anonymous}
    function create_if_block_2(ctx) {
    	let h2;
    	let t1;
    	let span;
    	let t3;
    	let button;
    	let button_disabled_value;
    	let t4;
    	let if_block1_anchor;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (!/*info*/ ctx[4].loaded && !/*info*/ ctx[4].reload) return create_if_block_4;
    		if (/*info*/ ctx[4].reload) return create_if_block_5;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*info*/ ctx[4].loaded && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "NoViews";
    			t1 = space();
    			span = element("span");
    			span.textContent = "Find a random YouTube video with 1 or less views";
    			t3 = space();
    			button = element("button");
    			if_block0.c();
    			t4 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			add_location(h2, file, 208, 4, 5357);
    			attr_dev(span, "class", "desc");
    			add_location(span, file, 209, 4, 5378);
    			attr_dev(button, "data-tippy-content", "Sign in with google");
    			button.disabled = button_disabled_value = !/*info*/ ctx[4].loaded && !/*info*/ ctx[4].reload;
    			attr_dev(button, "class", "button");
    			add_location(button, file, 210, 4, 5457);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button, anchor);
    			if_block0.m(button, null);
    			insert_dev(target, t4, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button, null);
    				}
    			}

    			if (dirty & /*info*/ 16 && button_disabled_value !== (button_disabled_value = !/*info*/ ctx[4].loaded && !/*info*/ ctx[4].reload)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (/*info*/ ctx[4].loaded) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button);
    			if_block0.d();
    			if (detaching) detach_dev(t4);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(208:2) {#if !info.signedIn && !anonymous}",
    		ctx
    	});

    	return block;
    }

    // (218:29) {:else}
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
    		source: "(218:29) {:else}",
    		ctx
    	});

    	return block;
    }

    // (217:83) 
    function create_if_block_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("There\n        was an error - Reload");
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
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(217:83) ",
    		ctx
    	});

    	return block;
    }

    // (217:7) {#if !info.loaded && !info.reload}
    function create_if_block_4(ctx) {
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(217:7) {#if !info.loaded && !info.reload}",
    		ctx
    	});

    	return block;
    }

    // (220:4) {#if info.loaded}
    function create_if_block_3(ctx) {
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Use without signing in - May be rate limited";
    			attr_dev(span, "data-tippy-content", "This may or may not work depending on how many people use it");
    			attr_dev(span, "class", "below svelte-1bljdl1");
    			add_location(span, file, 220, 6, 5844);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*click_handler_1*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(220:4) {#if info.loaded}",
    		ctx
    	});

    	return block;
    }

    // (229:2) {#if info.signedIn || anonymous}
    function create_if_block_1(ctx) {
    	let noviews;
    	let current;

    	noviews = new NoViews({
    			props: {
    				fetchOpts: {
    					headers: {
    						Authorization: `${/*info*/ ctx[4].token.token_type} ${/*info*/ ctx[4].token.access_token}`
    					}
    				},
    				showSignout: true,
    				maxViews: /*settings*/ ctx[1].maxViews || 1,
    				searchPattern: /*settings*/ ctx[1].searchPattern,
    				queryParams: /*queryParams*/ ctx[2]
    			},
    			$$inline: true
    		});

    	noviews.$on("settings", /*settings_handler*/ ctx[8]);

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

    			if (dirty & /*info*/ 16) noviews_changes.fetchOpts = {
    				headers: {
    					Authorization: `${/*info*/ ctx[4].token.token_type} ${/*info*/ ctx[4].token.access_token}`
    				}
    			};

    			if (dirty & /*settings*/ 2) noviews_changes.maxViews = /*settings*/ ctx[1].maxViews || 1;
    			if (dirty & /*settings*/ 2) noviews_changes.searchPattern = /*settings*/ ctx[1].searchPattern;
    			if (dirty & /*queryParams*/ 4) noviews_changes.queryParams = /*queryParams*/ ctx[2];
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(229:2) {#if info.signedIn || anonymous}",
    		ctx
    	});

    	return block;
    }

    // (243:2) {#if showSettings}
    function create_if_block(ctx) {
    	let settings_1;
    	let updating_opts;
    	let current;

    	function settings_1_opts_binding(value) {
    		/*settings_1_opts_binding*/ ctx[9](value);
    	}

    	let settings_1_props = {};

    	if (/*settings*/ ctx[1] !== void 0) {
    		settings_1_props.opts = /*settings*/ ctx[1];
    	}

    	settings_1 = new Settings({ props: settings_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(settings_1, 'opts', settings_1_opts_binding));
    	settings_1.$on("close", /*close_handler*/ ctx[10]);

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

    			if (!updating_opts && dirty & /*settings*/ 2) {
    				updating_opts = true;
    				settings_1_changes.opts = /*settings*/ ctx[1];
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
    		source: "(243:2) {#if showSettings}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let script;
    	let script_src_value;
    	let link0;
    	let link1;
    	let t0;
    	let div;
    	let t1;
    	let t2;
    	let t3;
    	let toastcontainer;
    	let current;
    	let if_block0 = !/*info*/ ctx[4].signedIn && !/*anonymous*/ ctx[0] && create_if_block_2(ctx);
    	let if_block1 = (/*info*/ ctx[4].signedIn || /*anonymous*/ ctx[0]) && create_if_block_1(ctx);
    	let if_block2 = /*showSettings*/ ctx[3] && create_if_block(ctx);
    	toastcontainer = new ToastContainer({ $$inline: true });

    	const block = {
    		c: function create() {
    			script = element("script");
    			link0 = element("link");
    			link1 = element("link");
    			t0 = space();
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			if (if_block2) if_block2.c();
    			t3 = space();
    			create_component(toastcontainer.$$.fragment);
    			if (!src_url_equal(script.src, script_src_value = "https://apis.google.com/js/api.js")) attr_dev(script, "src", script_src_value);
    			add_location(script, file, 195, 2, 5023);
    			attr_dev(link0, "rel", "stylesheet");
    			attr_dev(link0, "href", "https://unpkg.com/tippy.js@6.3.7/themes/light-border.css");
    			add_location(link0, file, 196, 2, 5083);
    			attr_dev(link1, "rel", "stylesheet");
    			attr_dev(link1, "href", "https://unpkg.com/tippy.js@6.3.7/dist/tippy.css");
    			add_location(link1, file, 200, 2, 5185);
    			attr_dev(div, "class", "container");
    			add_location(div, file, 206, 0, 5292);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document_1.head, script);
    			append_dev(document_1.head, link0);
    			append_dev(document_1.head, link1);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t1);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t2);
    			if (if_block2) if_block2.m(div, null);
    			insert_dev(target, t3, anchor);
    			mount_component(toastcontainer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*info*/ ctx[4].signedIn && !/*anonymous*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*info*/ ctx[4].signedIn || /*anonymous*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*info, anonymous*/ 17) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, t2);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*showSettings*/ ctx[3]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*showSettings*/ 8) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(toastcontainer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(toastcontainer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(script);
    			detach_dev(link0);
    			detach_dev(link1);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (detaching) detach_dev(t3);
    			destroy_component(toastcontainer, detaching);
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
    	let anonymous = false;
    	let settings = {};

    	let info = {
    		token: {},
    		loaded: false,
    		signedIn: false,
    		reload: false
    	};

    	let queryParams = {};

    	onMount(() => {
    		toast.show("Loading...");

    		import('https://cdn.skypack.dev/tippy.js').then(({ default: tippy }) => {
    			window.tippy = tippy;

    			setInterval(
    				() => {
    					[
    						...document.querySelectorAll("[data-tippy-content]:not([data-tippy-checked])")
    					].forEach(i => {
    						tippy(i, {
    							theme: "light-border",
    							content: i.getAttribute("data-tippy-content")
    						});

    						i.setAttribute("data-tippy-checked", "true");
    					});
    				},
    				500
    			);
    		});

    		try {
    			$$invalidate(1, settings = JSON.parse(localStorage.settings));

    			if (typeof settings !== "object") {
    				$$invalidate(1, settings = {});
    			}
    		} catch(e) {
    			
    		}

    		$$invalidate(4, info.token = JSON.parse(localStorage?.token || "{}"), info);

    		if (typeof info.token !== "object" || !(info.token.access_token && info.token.expires_at && info.token.token_type) || info.token.expires_at < Date.now()) {
    			console.log(info.token, "invalid");
    			$$invalidate(4, info.token = {}, info);
    			$$invalidate(4, info.signedIn = false, info);
    		} else {
    			console.log("Signed in");
    			$$invalidate(4, info.signedIn = true, info);
    		}

    		Object.assign(window, { info, settings });

    		$$invalidate(1, settings = {
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

    		gapi.load("client", {
    			callback: () => {
    				initClient().then(() => {
    					$$invalidate(4, info.loaded = true, info);
    					toast.show("Loaded!");
    				});
    			},
    			onerror: () => {
    				toast.show("There was an error");
    			}
    		});
    	}

    	function initClient() {
    		return new Promise(resolve => {
    				gapi.client.init({
    					// Your API key will be automatically added to the Discovery Document URLs.
    					discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"],
    					// clientId and scope are optional if auth is not required.
    					clientId: "624071780217-cp736o7egfe97s941dc2kvmv5o7oavbs.apps.googleusercontent.com",
    					scope: "https://www.googleapis.com/auth/youtube.readonly"
    				}).then(() => resolve(), e => {
    					$$invalidate(4, info.reload = true, info);
    					console.log(e);
    					toast.show(`Error loading client${e.details ? ": " + e.details.split(":")[0] : ""}`, { timeout: 5000 });
    				});
    			});
    	}

    	async function signin() {
    		const user = await gapi.auth2.getAuthInstance().signIn();
    		console.log(user);
    		let response = user.getAuthResponse();
    		$$invalidate(4, info.signedIn = true, info);
    		$$invalidate(4, info.token = response, info);
    		localStorage.setItem("token", JSON.stringify(info.token));
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => info.reload
    	? location.reload()
    	: info.loaded && signin();

    	const click_handler_1 = () => $$invalidate(0, anonymous = true);
    	const settings_handler = () => $$invalidate(3, showSettings = true);

    	function settings_1_opts_binding(value) {
    		settings = value;
    		$$invalidate(1, settings);
    	}

    	const close_handler = () => ($$invalidate(3, showSettings = false), toast.show("Saved settings"));

    	$$self.$capture_state = () => ({
    		ToastContainer,
    		NoViews,
    		Settings,
    		notifs: toast,
    		onMount,
    		toast,
    		showSettings,
    		anonymous,
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
    		if ('showSettings' in $$props) $$invalidate(3, showSettings = $$props.showSettings);
    		if ('anonymous' in $$props) $$invalidate(0, anonymous = $$props.anonymous);
    		if ('settings' in $$props) $$invalidate(1, settings = $$props.settings);
    		if ('info' in $$props) $$invalidate(4, info = $$props.info);
    		if ('queryParams' in $$props) $$invalidate(2, queryParams = $$props.queryParams);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*anonymous, settings, queryParams*/ 7) {
    			{
    				if (anonymous) {
    					$$invalidate(2, queryParams.key = `AIzaSyC_5nnMeplNjnAVC5tyS5OT5tDxnt43QFA`, queryParams);
    				}

    				for (let [key, value] of Object.entries(settings)) {
    					if (settings[key]) {
    						$$invalidate(2, queryParams[key] = value, queryParams);
    					} else {
    						delete queryParams[key];
    					}
    				}

    				if (settings.publishedAfter) {
    					$$invalidate(2, queryParams.publishedAfter = formatDate(new Date(settings.publishedAfter)), queryParams);
    				}

    				if (settings.publishedBefore) {
    					$$invalidate(2, queryParams.publishedBefore = formatDate(new Date(settings.publishedBefore)), queryParams);
    				}

    				delete queryParams.maxViews;
    				delete queryParams.searchPattern;
    			}
    		}
    	};

    	return [
    		anonymous,
    		settings,
    		queryParams,
    		showSettings,
    		info,
    		signin,
    		click_handler,
    		click_handler_1,
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
