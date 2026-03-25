import { createRouter, createWebHistory } from "vue-router";
import session from "@/utils/session";

const routes = [
	{
		path: "/home",
		name: "Home",
		component: () => import("@/pages/Home.vue"),
	},
	{
		path: "/",
		redirect: "home",
	},
	{
		path: "/app/:appID",
		name: "StudioApp",
		component: () => import("@/pages/StudioApp.vue"),
	},
	{
		path: "/app/:appID/:pageID",
		name: "StudioPage",
		component: () => import("@/pages/StudioPage.vue"),
	},
	{
		path: "/not-permitted",
		name: "NotPermitted",
		component: () => import("@/pages/NotPermitted.vue"),
	},
	// NCE Form Runtime Route
	{
		path: "/form/:formName/:docname?",
		name: "NceFormRuntime",
		component: () => import("@nce/pages/NceFormRuntime.vue"),
		props: true,
	},
	// NCE Theme Routes
	{
		path: "/theme",
		name: "ThemeSettings",
		component: () => import("@nce/theme/ThemeSettingsPage.vue"),
	},
	{
		path: "/theme/preview",
		name: "ThemePreview",
		component: () => import("@nce/theme/ThemePreviewPage.vue"),
	},
];

let router = createRouter({
	history: createWebHistory("/studio"),
	routes,
});

router.beforeEach(async (to, _, next) => {
	!session.initialized && (await session.initialize());

	if (!session.isLoggedIn) {
		window.location.href = "/login?redirect-to=/studio";
		return next(false);
	}
	if (!session.hasPermission && to.path !== "/not-permitted") {
		return next("/not-permitted");
	}
	return next();
});

export default router;
