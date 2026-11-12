import { Pressable, StyleSheet, type PressableProps } from 'react-native';

// Feedback starts on touch-down; actions stay on release so scrolling across a
// button never submits a form or deletes a place.
export function AppPressable({
  style,
  hitSlop = 8,
  pressRetentionOffset = 24,
  unstable_pressDelay = 0,
  disabled,
  ...props
}: PressableProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      hitSlop={hitSlop}
      pressRetentionOffset={pressRetentionOffset}
      unstable_pressDelay={unstable_pressDelay}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        state.pressed && !disabled && styles.pressed,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
});
