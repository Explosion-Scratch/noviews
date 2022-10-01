export default async function tooltip(node, params) {
  let tip;
  node.addEventListener("mouseenter", () => {
	console.log("Moused over", node, window.tippy)

	window.tippy?.(node, {
      placement: "top",
      theme: "light-border",
      ...params,
    });
  });
  return {
    update: (newParams) => {
      if (!tip) {
        return;
      }
      tip.setProps(newParams);
    },
    destroy: () => {
      if (!tip) {
        return;
      }
      tip.destroy();
    },
  };
}

async function until(fn, args = []) {
  return new Promise((resolve) => {
    async function repeat() {
      let result;
      try {
        result = fn(...args);
      } catch (_) {}
      if (!result) {
        await requestAnimationFrame(repeat);
      } else {
        resolve(result);
      }
    }
    repeat();
  });
}
