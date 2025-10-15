import { customRef } from 'vue';

export const debounceRef = <T>(value: T, milliSecond: number = 200) => {
  return customRef((track, trigger) => {
    let timeout: ReturnType<typeof setTimeout>;
    return {
      get() {
        track();
        return value;
      },
      set(newValue) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          value = newValue;
          trigger();
        }, milliSecond);
      },
    };
  });
};

export const throttleRef = <T>(value: T, milliSecond: number = 200) => {
  return customRef((track, trigger) => {
    let lastTime = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined = undefined;
    let pendingValue: T;
    return {
      get() {
        track();
        return value;
      },
      set(newValue) {
        const now = Date.now();
        if (now - lastTime >= milliSecond) {
          value = newValue;
          lastTime = now;
          if (timeout) {
            clearTimeout(timeout);
          }
          trigger();
        } else {
          pendingValue = newValue;
          timeout ??= setTimeout(
            () => {
              value = pendingValue;
              lastTime = Date.now();
              timeout = undefined;
              trigger();
            },
            milliSecond - (now - lastTime),
          );
        }
      },
    };
  });
};
