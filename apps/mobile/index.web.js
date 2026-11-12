import '@expo/metro-runtime';
import { registerRootComponent } from 'expo';
import React from 'react';
import App from './App';

function AppPreview() {
  return React.createElement(App, { preview: true });
}

registerRootComponent(AppPreview);
