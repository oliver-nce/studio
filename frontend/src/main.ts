import "./index.css";
// import { initializeTheme } from "@nce/theme/themeInit"; // Not needed until theme system is bundled here

import { createApp } from "vue";
import { createPinia } from "pinia";
import "./setupFrappeUIResource";
import studio_router from "@/router/studio_router";
import App from "./App.vue";

import { resourcesPlugin, frappeRequest } from "frappe-ui";
import { spritePlugin } from "frappe-ui/icons";
import { registerGlobalComponents } from "./globals";

import { COMPONENTS } from "@/data/components";
import { NCE_COMPONENTS } from "@/nce/data/nceComponents";
import Block from "@/utils/block";
import "@/utils/appUtilsRenderer";

Block.setComponents({ ...COMPONENTS, ...NCE_COMPONENTS });

const studio = createApp(App);
const pinia = createPinia();

// For the main app builder
studio.use(studio_router);
studio.use(resourcesPlugin);
studio.use(spritePlugin);
studio.use(pinia);
registerGlobalComponents(studio);
window.__APP_COMPONENTS__ = studio._context.components;

declare global {
	interface Window {
		site_url: string;
		__APP_COMPONENTS__: any;
		[key: string]: string;
	}
}

// initializeTheme(); // Not needed until theme system is bundled here

studio_router.isReady().then(async () => {
	if (import.meta.env.DEV) {
		await frappeRequest({
			url: "/api/method/studio.www.studio.get_context_for_dev",
		}).then(async (values: Record<string, any>) => {
			for (let key in values) {
				window[key] = values[key];
			}
		});
	}
	studio.mount("#studio");
});
