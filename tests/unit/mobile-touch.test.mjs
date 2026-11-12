import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(
  new URL('../../apps/mobile/components/AppPressable.tsx', import.meta.url),
  'utf8'
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;
const context = {
  exports: {},
  require: (id) =>
    id === 'react-native'
      ? {
          Pressable: 'NativePressable',
          StyleSheet: { create: (styles) => styles },
        }
      : require(id),
};
vm.runInNewContext(compiled, context);
const { AppPressable } = context.exports;

test('터치 영역을 확장하고 지연 없이 누름 피드백을 제공한다', () => {
  let calls = 0;
  const element = AppPressable({ onPress: () => calls++ });
  assert.equal(element.props.hitSlop, 8);
  assert.equal(element.props.pressRetentionOffset, 24);
  assert.equal(element.props.unstable_pressDelay, 0);
  assert.equal(element.props.style({ pressed: true })[1].opacity, 0.75);
  assert.equal(element.props.onPressIn, undefined);
  assert.equal(calls, 0);
  element.props.onPress();
  assert.equal(calls, 1);
});

test('비활성 버튼과 모달 배경의 터치 범위 설정을 보존한다', () => {
  const element = AppPressable({ disabled: true, hitSlop: 0 });
  assert.equal(element.props.disabled, true);
  assert.equal(element.props.hitSlop, 0);
  assert.equal(element.props.style({ pressed: true })[1], false);
});
