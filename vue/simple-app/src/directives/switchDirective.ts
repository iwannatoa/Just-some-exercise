import { nextTick, type Directive, type DirectiveBinding } from 'vue';
type SwitchCase = {
  value: unknown;
  el: HTMLElement;
  isDefault: boolean;
};
type SwitchDirectives = {
  _switchCases?: SwitchCase[];
  _switchCasesMap?: Map<unknown, SwitchCase>;
  _switchValue?: unknown;
  _hasSwitchParent?: boolean;
  _defaultCase?: SwitchCase;
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
let styleIntjected = false;
const injectStyle = () => {
  if (styleIntjected) return;
  const style = document.createElement('style');
  style.textContent = hiddenStyle;
  document.head.appendChild(style);
  styleIntjected = true;
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

  const activeCase =
    el._switchCases.find((c) => !c.isDefault && c.value === el._switchValue) ||
    el._switchCases.find((c) => c.isDefault) ||
    null;

  // 简单的 classList.toggle 在现代浏览器中已经足够高效
  el._switchCases.forEach((c) => {
    c.el.classList.toggle(SWITCH_HIDDEN_CLASS, c !== activeCase);
  });
};

const switchDirective = {
  switch: {
    mounted(el: HTMLElement & SwitchDirectives, binding: DirectiveBinding) {
      el._switchCases = [];
      el._switchCasesMap = new Map();
      el._switchValue = binding.value;
      el._hasSwitchParent = true;

      nextTick(() => {
        validateSwitchContainer(el);
      });
    },
    updated(el: HTMLElement & SwitchDirectives, binding: DirectiveBinding) {
      if (binding.value !== el._switchValue) {
        el._switchValue = binding.value;
        scheduleUpdate(el);
      }
    },
    unmounted(el: HTMLElement & SwitchDirectives) {
      el._switchCases = undefined;
      el._switchCasesMap = undefined;
      el._switchValue = undefined;
      el._hasSwitchParent = undefined;
    },
  } as Directive<HTMLElement>,

  case: {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
      validateSwitchUsage(el, 'case');
      const parent = el.parentElement as HTMLElement & SwitchDirectives;
      if (parent && parent._switchCases) {
        const newCase = {
          value: binding.value,
          el: el,
          isDefault: false,
        };
        parent._switchCases.push(newCase);
        parent._switchCasesMap?.set(binding.value, newCase);
        el.style.display = 'none';
        scheduleUpdate(parent);
      }
    },
    updated(el: HTMLElement, binding: DirectiveBinding) {
      const parent = el.parentElement as HTMLElement & SwitchDirectives;
      if (parent?._switchCases) {
        const existingCase = parent._switchCases.find((c) => c.el === el);
        if (existingCase && existingCase.value !== binding.value) {
          existingCase.value = binding.value;
          scheduleUpdate(parent);
        }
      }
    },
    unmounted(el: HTMLElement) {
      const parent = el.parentElement as HTMLElement & SwitchDirectives;
      if (parent?._switchCases) {
        parent._switchCases = parent._switchCases.filter((c) => c.el !== el);
        scheduleUpdate(parent);
        parent._switchCasesMap?.forEach((c, k) => {
          if (c.el === el) {
            parent._switchCasesMap?.delete(k);
          }
        });
      }
    },
  } as Directive<HTMLElement>,

  caseDefault: {
    mounted(el: HTMLElement) {
      validateSwitchUsage(el, 'default');
      const parent = el.parentElement as HTMLElement & SwitchDirectives;
      if (parent && parent._switchCases) {
        const defaultCase = {
          value: undefined,
          el: el,
          isDefault: true,
        };
        parent._switchCases.push(defaultCase);
        parent._defaultCase = defaultCase;
        el.style.display = 'none';
        scheduleUpdate(parent);
      }
    },
    updated(el: HTMLElement) {
      const parent = el.parentElement as HTMLElement & SwitchDirectives;
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
      const parent = el.parentElement as HTMLElement & SwitchDirectives;
      if (parent?._switchCases) {
        parent._switchCases = parent._switchCases.filter((c) => c.el !== el);
        if (!parent._switchCases.some((c) => c.isDefault)) {
          console.warn('v-case-default was removed from switch container');
        }
        parent._defaultCase = undefined;
        scheduleUpdate(parent);
      }
    },
  } as Directive<HTMLElement>,
};

export const useSwitchDirectives = () => {
  injectStyle();
  return switchDirective;
};
