import { createRouter } from 'sv-router';
import Home from './lib/Home.svelte';
import CompanyProfile from './lib/CompanyProfile.svelte';

export const router = createRouter({
  '/': Home,
  '/company-profile': CompanyProfile,
  '*': Home,
});
