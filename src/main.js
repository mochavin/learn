import { mount } from 'svelte';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './lib/styles/tokens.css';
import './lib/styles/global.css';
import './lib/styles/prose.css';
import App from './App.svelte';

mount(App, { target: document.getElementById('app') });
