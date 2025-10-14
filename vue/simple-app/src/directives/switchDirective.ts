import { nextTick, type Directive, type DirectiveBinding } from 'vue';

type SwitchCase = {
  value: unknown;
  el: HTMLElement;
  isDefault: boolean;
};

interface SwitchElement extends HTMLElement {
  _switchCases?: SwitchCase[];
  _switchCasesMap?: Map<unknown, SwitchCase>;
  _switchValue?: unknown;
  _hasSwitchParent?: boolean;
  _defaultCase?: SwitchCase;
}

const SWITCH_HIDDEN_CLASS = 'v-switch-hidden';
let updateQueue = new Map<SwitchElement, number>();
let rafId: number | null = null;

const hiddenStyle = `
.${SWITCH_HIDDEN_CLASS} {
  transform: scale(0) !important;    
  opacity: 0 !important;             
  position: absolute !important;
  pointer-events: none !important;
}`;

let styleInjected = false;

const injectStyle = () => {
  if (styleInjected || typeof document === 'undefined') return;

  if (document.querySelector('style[data-v-switch]')) {
    styleInjected = true;
    return;
  }

  const style = document.createElement('style');
  style.textContent = hiddenStyle;
  style.setAttribute('data-v-switch', '');
  document.head.appendChild(style);
  styleInjected = true;
};

const batchUpdate = () => {
  updateQueue.forEach((_, el) => updateActiveCase(el));
  updateQueue.clear();
  rafId = null;
};

const scheduleUpdate = (el: SwitchElement) => {
  updateQueue.set(el, Date.now());

  if (!rafId) {
    rafId = requestAnimationFrame(batchUpdate);
  }
};

const validateSwitchUsage = (el: HTMLElement, type: 'case' | 'default') => {
  const parent = el.parentElement as SwitchElement;
  if (!parent?._hasSwitchParent) {
    throw new Error(`v-${type} must be used inside v-switch directive`);
  }
};

const validateSwitchContainer = (el: SwitchElement) => {
  if (!el._switchCases || el._switchCases.length === 0) {
    console.warn(`v-switch requires at least one v-case or v-case-default`);
    return false;
  }

  const defaultCases = el._switchCases?.filter((c) => c.isDefault) || [];
  if (defaultCases.length > 1) {
    console.error(`Multiple v-case-default detected in the same v-switch`);
    return false;
  }
  return true;
};

const updateActiveCase = (el: SwitchElement) => {
  if (!el._switchCases || !validateSwitchContainer(el)) return;

  let activeCase: SwitchCase | null = null;

  if (el._switchCasesMap && el._switchValue !== undefined) {
    activeCase = el._switchCasesMap.get(el._switchValue) || null;
  }

  if (!activeCase && el._defaultCase) {
    activeCase = el._defaultCase;
  }

  activeCase ??= el._switchCases.find((c) => c.isDefault) || null;

  el._switchCases.forEach((c) => {
    c.el.classList.toggle(SWITCH_HIDDEN_CLASS, c !== activeCase);
  });
};

const switchDirective = {
  switch: {
    mounted(el: SwitchElement, binding: DirectiveBinding) {
      injectStyle();

      el._switchCases = [];
      el._switchCasesMap = new Map();
      el._switchValue = binding.value;
      el._hasSwitchParent = true;

      nextTick(() => {
        validateSwitchContainer(el);
      });
    },
    updated(el: SwitchElement, binding: DirectiveBinding) {
      if (binding.value !== el._switchValue) {
        el._switchValue = binding.value;
        scheduleUpdate(el);
      }
    },
    unmounted(el: SwitchElement) {
      el._switchCases = undefined;
      el._switchCasesMap = undefined;
      el._switchValue = undefined;
      el._hasSwitchParent = undefined;
      el._defaultCase = undefined;
    },
  } as Directive<HTMLElement>,

  case: {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
      validateSwitchUsage(el, 'case');
      const parent = el.parentElement as SwitchElement;
      if (parent._switchCases && parent._switchCasesMap) {
        const newCase = {
          value: binding.value,
          el: el,
          isDefault: false,
        };

        parent._switchCases.push(newCase);
        parent._switchCasesMap.set(binding.value, newCase);

        el.classList.add(SWITCH_HIDDEN_CLASS);
        scheduleUpdate(parent);
      }
    },
    updated(el: HTMLElement, binding: DirectiveBinding) {
      const parent = el.parentElement as SwitchElement;
      if (parent?._switchCases && parent._switchCasesMap) {
        const existingCase = parent._switchCases.find((c) => c.el === el);
        if (existingCase && existingCase.value !== binding.value) {
          parent._switchCasesMap.delete(existingCase.value);
          existingCase.value = binding.value;
          parent._switchCasesMap.set(binding.value, existingCase);
          scheduleUpdate(parent);
        }
      }
    },
    unmounted(el: HTMLElement) {
      const parent = el.parentElement as SwitchElement;
      if (parent?._switchCases && parent._switchCasesMap) {
        const removedCase = parent._switchCases.find((c) => c.el === el);
        parent._switchCases = parent._switchCases.filter((c) => c.el !== el);

        if (removedCase) {
          parent._switchCasesMap.delete(removedCase.value);
        }

        scheduleUpdate(parent);
      }
    },
  } as Directive<HTMLElement>,

  caseDefault: {
    mounted(el: HTMLElement) {
      validateSwitchUsage(el, 'default');
      const parent = el.parentElement as SwitchElement;
      if (parent._switchCases) {
        const defaultCase = {
          value: undefined,
          el: el,
          isDefault: true,
        };

        parent._switchCases.push(defaultCase);
        parent._defaultCase = defaultCase;

        el.classList.add(SWITCH_HIDDEN_CLASS);
        scheduleUpdate(parent);
      }
    },
    updated(el: HTMLElement) {
      const parent = el.parentElement as SwitchElement;
      if (parent && !parent._switchCases?.some((c) => c.el === el && c.isDefault)) {
        console.warn('v-case-default was re-mounted, re-adding to switch container');
        const defaultCase = {
          value: undefined,
          el: el,
          isDefault: true,
        };
        parent._switchCases?.push(defaultCase);
        parent._defaultCase = defaultCase;
        scheduleUpdate(parent);
      }
    },
    unmounted(el: HTMLElement) {
      const parent = el.parentElement as SwitchElement;
      if (parent?._switchCases) {
        parent._switchCases = parent._switchCases.filter((c) => c.el !== el);
        if (parent._defaultCase?.el === el) {
          parent._defaultCase = undefined;
        }
        if (!parent._switchCases.some((c) => c.isDefault)) {
          console.warn('v-case-default was removed from switch container');
        }
        scheduleUpdate(parent);
      }
    },
  } as Directive<HTMLElement>,
};

export const useSwitchDirectives = () => {
  injectStyle();
  return switchDirective;
};
