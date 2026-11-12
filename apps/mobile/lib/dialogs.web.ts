import type { AlertButton, AlertOptions } from 'react-native';

export const Alert = {
  alert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    _options?: AlertOptions
  ) {
    const text = [title, message].filter(Boolean).join('\n\n');
    if (buttons?.length) {
      const action = buttons.find((button) => button.style !== 'cancel');
      if (window.confirm(text)) action?.onPress?.();
      else buttons.find((button) => button.style === 'cancel')?.onPress?.();
    } else window.alert(text);
  },
};
