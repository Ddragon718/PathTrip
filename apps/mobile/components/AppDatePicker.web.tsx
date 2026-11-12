import type { ComponentProps } from 'react';
import type NativePicker from '@react-native-community/datetimepicker';

const dateValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function AppDatePicker({
  value,
  minimumDate,
  onChange,
  accessibilityLabel,
}: ComponentProps<typeof NativePicker>) {
  return (
    <input
      aria-label={accessibilityLabel ?? '날짜 선택'}
      type="date"
      value={dateValue(value)}
      min={minimumDate ? dateValue(minimumDate) : undefined}
      style={{
        maxWidth: 145,
        minWidth: 0,
        padding: '9px 6px',
        border: '1px solid #DFDED7',
        borderRadius: 10,
        color: '#173E35',
        background: '#FFFDF9',
        fontSize: 12,
        fontFamily: 'inherit',
      }}
      onChange={(event) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(event.currentTarget.value)) return;
        const date = new Date(`${event.currentTarget.value}T12:00:00`);
        if (
          !Number.isFinite(date.getTime()) ||
          (minimumDate && dateValue(date) < dateValue(minimumDate))
        )
          return;
        onChange?.(
          {
            type: 'set',
            nativeEvent: {
              timestamp: date.getTime(),
              utcOffset: -date.getTimezoneOffset(),
            },
          },
          date
        );
      }}
    />
  );
}
