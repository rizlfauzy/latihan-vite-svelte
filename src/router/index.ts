import { createRouter } from 'sv-router';
import Home from '@/pages/home/page.svelte';
import CompanyProfile from '@/pages/company-profile/page.svelte';

export const router = createRouter({
  '/': Home,
  '/company-profile': CompanyProfile,
  '*': Home,
});
